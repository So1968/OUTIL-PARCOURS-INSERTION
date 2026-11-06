import test from "node:test";
import assert from "node:assert/strict";
import { selectFictionalCaseContext, FictionalContextError } from "../src/fictionalCaseContext.js";

const base = { caseId: "case-fiction-alpha", asOf: "2026-11-04", authorized: true };
const events = [
  { id: "E08", caseId: base.caseId, occurredAt: "2026-11-04", text: "Projet salarié confirmé.", evidenceStatus: "DECLARATION", version: 1 },
  { id: "E01", caseId: base.caseId, occurredAt: "2026-02-03", text: "Projet indépendant envisagé.", evidenceStatus: "DECLARATION", version: 1 },
  { id: "E09", caseId: base.caseId, occurredAt: "2026-11-05", text: "Événement futur.", evidenceStatus: "INCONNU", version: 1 },
];

test("refuse sans habilitation même si le contenu est présent", () => {
  assert.deepEqual(selectFictionalCaseContext({ ...base, authorized: false, events }), {
    status: "ACCES_REFUSE", events: [],
  });
});

test("trie chronologiquement et exclut les événements postérieurs", () => {
  const result = selectFictionalCaseContext({ ...base, events });
  assert.equal(result.status, "CONTEXTE_FICTIF");
  assert.deepEqual(result.sourceEventIds, ["E01", "E08"]);
  assert.equal(result.generatedSummary, false);
  assert.equal(result.events[0].text, "Projet indépendant envisagé.");
  assert.deepEqual(events.map(e => e.id), ["E08", "E01", "E09"]);
});

test("rejette tout événement d'un autre dossier, sans le filtrer silencieusement", () => {
  assert.throws(() => selectFictionalCaseContext({
    ...base, events: [...events, { ...events[0], id: "E10", caseId: "case-fiction-beta" }],
  }), FictionalContextError);
});

test("rejette doublons, dates invalides et données non conformes", () => {
  const bad = [
    [...events, { ...events[0] }],
    [{ ...events[0], occurredAt: "2026-02-30" }],
    [{ ...events[0], text: "" }],
    [{ ...events[0], evidenceStatus: "DIAGNOSTIC" }],
    [{ ...events[0], version: 0 }],
    [{ ...events[0], personName: "Inconnu" }],
  ];
  for (const input of bad) {
    assert.throws(() => selectFictionalCaseContext({ ...base, events: input }), FictionalContextError);
  }
  assert.throws(() => selectFictionalCaseContext({ ...base, asOf: "2026-11-31", events }), FictionalContextError);
  assert.throws(() => selectFictionalCaseContext({ ...base, caseId: "dossier-reel", events }), FictionalContextError);
});

test("sortie stable et événements copiés et figés", () => {
  const first = selectFictionalCaseContext({ ...base, events });
  const second = selectFictionalCaseContext({ ...base, events });
  assert.deepEqual(first, second);
  assert.notStrictEqual(first.events[0], events[1]);
  assert.ok(Object.isFrozen(first.events[0]));
  assert.ok(Object.isFrozen(first.sourceEventIds));
});

test("accepte le 29 février d'une année bissextile", () => {
  const leap = { ...events[0], occurredAt: "2024-02-29" };
  assert.equal(selectFictionalCaseContext({ ...base, events: [leap] }).events.length, 1);
  assert.throws(() => selectFictionalCaseContext({
    ...base, events: [{ ...leap, occurredAt: "2025-02-29" }],
  }), FictionalContextError);
});
