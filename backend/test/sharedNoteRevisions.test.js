import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  correctSharedNote, validateSharedNote, readSharedNoteHistory,
  DossierVersionConflict, InvalidSharedNote, SharedNoteHistoryUnavailable,
} from "../src/sharedNoteService.js";
import { CaseAccessDenied } from "../src/caseAccessService.js";
import { COOKIE_NAME } from "../src/sessions.js";

const caseId = randomUUID(), noteId = randomUUID(), userId = randomUUID();
const now = new Date("2026-10-25T12:00:00Z");
const originalText = "Suite fictive à organiser";

// Double transactionnel pour les refus et transitions ; la CI PostgreSQL
// vérifie séparément le verrouillage réel et les annulations en base.
function fixture({ role = "REFERENTE", assigned = true, archived = false,
  auditError = false, revisionError = false, serializationError = false } = {}) {
  let state = {
    dossier: { id: caseId, referentId: assigned ? userId : randomUUID(), version: 1,
      archivedAt: archived ? now : null, assignments: [] },
    note: { id: noteId, caseId, version: 1, text: originalText, validated: false },
    revisions: [{ version: 1, text: originalText, validated: false, actorId: userId,
      reason: "CREATION_BROUILLON", createdAt: now }], audit: [],
  };
  const db = {
    webSession: { findUnique: async () => ({ userId, expiresAt: new Date(now.getTime() + 60000),
      revokedAt: null, user: { enabled: true } }) },
    $transaction: async (operation, options) => {
      assert.equal(options.isolationLevel, "Serializable");
      const draft = structuredClone(state);
      const result = await operation({
        webSession: db.webSession,
        userAccount: { findUnique: async () => ({ id: userId, role, enabled: true }) },
        caseFile: {
          findUnique: async ({ where }) => where.id === caseId ? draft.dossier : null,
          updateMany: async ({ where }) => {
            if (where.version !== draft.dossier.version) return { count: 0 };
            draft.dossier.version++;
            return { count: 1 };
          },
        },
        sharedNote: {
          findFirst: async ({ where }) => where.id === noteId && where.caseId === caseId ? draft.note : null,
          updateMany: async ({ where, data }) => {
            if (where.version !== draft.note.version) return { count: 0 };
            draft.note = { ...draft.note, text: data.text, validated: data.validated,
              version: draft.note.version + 1 };
            return { count: 1 };
          },
        },
        sharedNoteRevision: {
          findUnique: async ({ where }) => draft.revisions.find(r => r.version === where.noteId_version.version) ?? null,
          create: async ({ data }) => {
            if (revisionError) throw new Error("REVISION_FICTIVEMENT_INDISPONIBLE");
            draft.revisions.push({ ...data, createdAt: now });
          },
          findMany: async ({ where, take, orderBy, select }) => {
            assert.equal(orderBy.version, "desc");
            assert.equal(select.text, true);
            assert.equal(where.noteId, noteId);
            assert.equal(where.caseId, caseId);
            return draft.revisions.filter(r => !where.version || r.version < where.version.lt)
              .sort((a, b) => b.version - a.version).slice(0, take);
          },
        },
        auditEvent: { create: async ({ data }) => {
          if (auditError) throw new Error("AUDIT_FICTIVEMENT_INDISPONIBLE");
          draft.audit.push(data);
        } },
      });
      if (serializationError) throw Object.assign(new Error("Concurrence fictive"), { code: "P2034" });
      state = draft;
      return result;
    },
  };
  const args = { db, caseId, noteId, cookieHeader: `${COOKIE_NAME}=${"a".repeat(64)}`, now };
  return { args, state: () => state };
}

test("correction et validation conservent chaque état, son auteur et son motif", async () => {
  const f = fixture();
  assert.deepEqual(await correctSharedNote({ ...f.args, expectedVersion: 1,
    text: "  Nouvelle suite fictive  ", reason: "  Précision après entretien fictif  " }), {
    noteId, noteVersion: 2, dossierVersion: 2, validated: false,
  });
  await validateSharedNote({ ...f.args, expectedVersion: 2 });
  assert.equal(f.state().note.validated, true);
  await correctSharedNote({ ...f.args, expectedVersion: 3,
    text: "Suite fictive corrigée", reason: "Actualisation fictive" });
  assert.equal(f.state().note.validated, false);
  const result = await readSharedNoteHistory(f.args);
  assert.deepEqual(result.history.map(r => [r.version, r.validated]), [[4, false], [3, true], [2, false], [1, false]]);
  assert.equal(result.history.at(-1).text, originalText);
  assert.equal(result.history[2].reason, "Précision après entretien fictif");
  assert.ok(result.history.every(r => r.actorId === userId && r.createdAt instanceof Date));
  assert.equal(result.nextBeforeVersion, null);
  assert.deepEqual(f.state().audit.map(r => r.eventType), [
    "SHARED_NOTE_CORRECTED", "SHARED_NOTE_VALIDATED", "SHARED_NOTE_CORRECTED", "SHARED_NOTE_HISTORY_READ",
  ]);
  assert.ok(f.state().audit.every(r => !JSON.stringify(r).includes("Suite fictive")));
});

test("brouillons et historique refusés aux autres profils, même affectés en lecture", async () => {
  for (const role of ["APPUI_TNS", "ACCUEIL", "RELAIS_LOGEMENT", "DIRECTION", "GOUVERNANCE", "ADMIN_TECHNIQUE"]) {
    const f = fixture({ role });
    f.state().dossier.assignments = [{ userId, capability: "SHARED_READ", active: true }];
    await assert.rejects(readSharedNoteHistory(f.args), CaseAccessDenied);
    await assert.rejects(validateSharedNote({ ...f.args, expectedVersion: 1 }), CaseAccessDenied);
    await assert.rejects(correctSharedNote({ ...f.args, expectedVersion: 1,
      text: "Exemple fictif", reason: "Correction fictive" }), CaseAccessDenied);
    assert.equal(f.state().audit.length, 0);
  }
});

test("refus des notes hors dossier, dossiers archivés et affectations absentes", async () => {
  for (const options of [{ assigned: false }, { archived: true }]) {
    const f = fixture(options);
    await assert.rejects(readSharedNoteHistory(f.args), CaseAccessDenied);
  }
  const f = fixture();
  await assert.rejects(readSharedNoteHistory({ ...f.args, noteId: randomUUID() }), CaseAccessDenied);
  await assert.rejects(readSharedNoteHistory({ ...f.args, caseId: randomUUID() }), CaseAccessDenied);
  await assert.rejects(readSharedNoteHistory({ ...f.args, cookieHeader: "role=REFERENTE" }), CaseAccessDenied);
  await assert.rejects(readSharedNoteHistory({ ...f.args, now: new Date("invalide") }), CaseAccessDenied);
});

test("une affectation de rédaction explicite peut être révoquée sans ouvrir les notes réservées", async () => {
  const f = fixture({ assigned: false });
  f.state().dossier.assignments = [{ userId, capability: "SHARED_WRITE", active: true }];
  await validateSharedNote({ ...f.args, expectedVersion: 1 });
  assert.equal((await readSharedNoteHistory(f.args)).validated, true);
  f.state().dossier.assignments[0].active = false;
  await assert.rejects(readSharedNoteHistory(f.args), CaseAccessDenied);
  await assert.rejects(correctSharedNote({ ...f.args, expectedVersion: 2,
    text: "Suite fictive", reason: "Après révocation fictive" }), CaseAccessDenied);
  assert.equal(f.state().note.version, 2);
});

test("les corrections imposent un texte, une justification courte et une version entière", async () => {
  const f = fixture();
  for (const changes of [
    { text: " " }, { text: "x".repeat(4001) }, { text: {} },
    { reason: " " }, { reason: "x".repeat(201) }, { reason: null },
    { expectedVersion: -1 }, { expectedVersion: 1.5 }, { expectedVersion: "1" },
    { expectedVersion: 2147483647 },
  ]) {
    await assert.rejects(correctSharedNote({ ...f.args, expectedVersion: 1,
      text: "Correction fictive", reason: "Justification fictive", ...changes }), InvalidSharedNote);
  }
  await assert.rejects(correctSharedNote({ ...f.args, expectedVersion: 1,
    text: originalText, reason: "Aucun changement fictif" }), InvalidSharedNote);
  assert.equal(f.state().note.version, 1);
});

test("une validation déjà acquise ou une ancienne version ne crée aucune nouvelle révision", async () => {
  const f = fixture();
  await validateSharedNote({ ...f.args, expectedVersion: 1 });
  await assert.rejects(validateSharedNote({ ...f.args, expectedVersion: 2 }), InvalidSharedNote);
  await assert.rejects(validateSharedNote({ ...f.args, expectedVersion: 1 }), DossierVersionConflict);
  assert.equal(f.state().revisions.length, 2);
});

test("un historique manquant ou incohérent bloque toute réécriture sans inventer de provenance", async () => {
  for (const revisions of [[], [{ version: 1, text: "Autre contenu fictif", validated: false }]]) {
    const f = fixture();
    f.state().revisions = revisions;
    await assert.rejects(validateSharedNote({ ...f.args, expectedVersion: 1 }), SharedNoteHistoryUnavailable);
    await assert.rejects(readSharedNoteHistory(f.args), SharedNoteHistoryUnavailable);
    assert.equal(f.state().dossier.version, 1);
    assert.equal(f.state().audit.length, 0);
  }
});

test("panne de révision, panne d'audit ou conflit PostgreSQL : aucun succès partiel", async () => {
  for (const options of [{ auditError: true }, { revisionError: true }, { serializationError: true }]) {
    const f = fixture(options);
    await assert.rejects(correctSharedNote({ ...f.args, expectedVersion: 1,
      text: "Correction fictive", reason: "Motif fictif" }),
    options.serializationError ? DossierVersionConflict : Error);
    assert.equal(f.state().dossier.version, 1);
    assert.equal(f.state().note.text, originalText);
    assert.equal(f.state().revisions.length, 1);
    assert.equal(f.state().audit.length, 0);
  }
});

test("l'historique est paginé sans répéter ni perdre de versions", async () => {
  const f = fixture();
  f.state().note.version = 55;
  f.state().revisions = Array.from({ length: 55 }, (_, i) => ({
    version: i + 1, text: originalText, validated: false, actorId: userId,
    reason: "Précision fictive", createdAt: now,
  }));
  const first = await readSharedNoteHistory(f.args);
  assert.equal(first.history.length, 50);
  assert.equal(first.nextBeforeVersion, 6);
  const next = await readSharedNoteHistory({ ...f.args, beforeVersion: first.nextBeforeVersion });
  assert.deepEqual([...first.history, ...next.history].map(r => r.version),
    Array.from({ length: 55 }, (_, i) => 55 - i));
  assert.equal(next.nextBeforeVersion, null);
  for (const beforeVersion of [0, -1, 1.5, "1", 2147483648]) {
    await assert.rejects(readSharedNoteHistory({ ...f.args, beforeVersion }), InvalidSharedNote);
  }
});
