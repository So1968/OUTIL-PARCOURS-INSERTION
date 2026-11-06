import test from "node:test";
import assert from "node:assert/strict";
import { selectFictionalRevisedTimeline, FictionalRevisionError } from "../src/fictionalRevisionTimeline.js";
import { prepareFictionalSummary } from "../src/fictionalSummaryPreparation.js";

const caseId = "case-fiction-revisions";
function revision(id, version, occurredAt, recordedAt, text, reason = "Note de suivi") {
  return { id, caseId, version, occurredAt, recordedAt, text, reason, evidenceStatus: "DECLARATION" };
}
const revisions = [
  revision("E01", 2, "2026-02-03", "2026-02-20", "Activité de couture envisagée.", "Rectification rédactionnelle"),
  revision("E02", 1, "2026-06-08", "2026-06-08", "90 euros de chiffre d'affaires en juin déclarés."),
  revision("E01", 1, "2026-02-03", "2026-02-10", "Activité informatique envisagée (erreur de saisie)."),
  revision("E03", 1, "2026-11-04", "2026-11-04", "0 euro de chiffre d'affaires en juin déclaré."),
  revision("E01", 3, "2026-02-03", "2026-11-05", "Activité textile envisagée.", "Correction ultérieure"),
];

test("retient uniquement la dernière correction connue, sans effacer sa traçabilité", () => {
  const result = selectFictionalRevisedTimeline({
    caseId, asOf: "2026-11-04", revisions, authorized: true,
  });
  assert.equal(result.status, "CHRONOLOGIE_FICTIVE_VERSIONNEE");
  assert.deepEqual(result.sourceEventIds, ["E01", "E02", "E03"]);
  assert.equal(result.events[0].text, "Activité de couture envisagée.");
  assert.equal(result.events[0].version, 2);
  assert.ok(!result.events.some(event => event.text.includes("informatique")));
  assert.ok(!result.events.some(event => event.text.includes("textile")));
  assert.deepEqual(result.revisionTrail[0].supersededVersions, [1]);
  assert.deepEqual(result.revisionTrail[0].correctionReasons, [{
    version: 2, recordedAt: "2026-02-20", reason: "Rectification rédactionnelle",
  }]);
  assert.equal(result.revisionTrail[0].textOfSupersededVersionsUsedAsEvidence, false);
  assert.equal(result.historyCompletenessVerified, false);
  assert.equal(result.providerCalled, false);
  assert.equal(result.persisted, false);
  assert.deepEqual(revisions.map(r => r.version), [2, 1, 1, 1, 3]);
});

test("restitue l'état tel qu'il était connu au moment demandé", () => {
  const beforeCorrection = selectFictionalRevisedTimeline({
    caseId, asOf: "2026-02-15", revisions, authorized: true,
  });
  assert.deepEqual(beforeCorrection.sourceEventIds, ["E01"]);
  assert.equal(beforeCorrection.events[0].version, 1);
  const beforeCreation = selectFictionalRevisedTimeline({
    caseId, asOf: "2026-02-09", revisions, authorized: true,
  });
  assert.deepEqual(beforeCreation.events, []);
  const afterCorrection = selectFictionalRevisedTimeline({
    caseId, asOf: "2026-11-05", revisions, authorized: true,
  });
  assert.equal(afterCorrection.events[0].version, 3);
});

test("ne confond pas rectification éditoriale et déclarations contradictoires", () => {
  const result = selectFictionalRevisedTimeline({
    caseId, asOf: "2026-11-04", revisions, authorized: true,
  });
  assert.ok(result.events.some(event => event.id === "E02" && event.text.includes("90 euros")));
  assert.ok(result.events.some(event => event.id === "E03" && event.text.includes("0 euro")));
  const prepared = prepareFictionalSummary({
    caseId, asOf: "2026-11-04", events: result.events, authorized: true,
  });
  assert.deepEqual(prepared.sourceEventIds, ["E01", "E02", "E03"]);
  assert.equal(prepared.latestEventId, "E03");
  assert.equal(prepared.evidence[0].version, 2);
});

test("refuse l'accès dès la révocation, sans divulguer les notes", () => {
  assert.deepEqual(selectFictionalRevisedTimeline({
    caseId, asOf: "2026-11-04", revisions, authorized: false,
  }), { status: "ACCES_REFUSE", events: [] });
});

test("refuse une chaîne dont il manque une version ou avec doublon", () => {
  const gaps = revisions.filter(r => r.id !== "E01" || r.version !== 2);
  assert.throws(() => selectFictionalRevisedTimeline({
    caseId, asOf: "2026-11-04", revisions: gaps, authorized: true,
  }), FictionalRevisionError);
  assert.throws(() => selectFictionalRevisedTimeline({
    caseId, asOf: "2026-11-04", revisions: [...revisions, revisions[0]], authorized: true,
  }), FictionalRevisionError);
});

test("refuse une date d'enregistrement incohérente et l'ordre temporel inversé", () => {
  const reversed = revisions.map(r => r.id === "E01" && r.version === 2
    ? { ...r, recordedAt: "2026-02-09" } : r);
  assert.throws(() => selectFictionalRevisedTimeline({
    caseId, asOf: "2026-11-04", revisions: reversed, authorized: true,
  }), FictionalRevisionError);
  assert.throws(() => selectFictionalRevisedTimeline({
    caseId, asOf: "2026-11-04", revisions: [
      revision("E01", 1, "2026-11-04", "2026-02-03", "Date impossible."),
    ], authorized: true,
  }), FictionalRevisionError);
});

test("refuse les révisions de dossiers étrangers, les données supplémentaires et dates invalides", () => {
  const invalid = [
    [{ ...revisions[0], caseId: "case-fiction-autre" }],
    [{ ...revisions[0], nom: "Nom non prévu" }],
    [{ ...revisions[0], occurredAt: "2026-02-30" }],
    [{ ...revisions[0], recordedAt: "hier" }],
  ];
  for (const items of invalid) {
    assert.throws(() => selectFictionalRevisedTimeline({
      caseId, asOf: "2026-11-04", revisions: items, authorized: true,
    }), FictionalRevisionError);
  }
  assert.throws(() => selectFictionalRevisedTimeline({
    caseId: "personne-reelle-123", asOf: "2026-11-04", revisions, authorized: true,
  }), FictionalRevisionError);
});

test("régression : les douze mois sont reconnus, et les dates impossibles refusées", () => {
  for (let month = 1; month <= 12; month += 1) {
    const date = `2026-${String(month).padStart(2, "0")}-01`;
    const result = selectFictionalRevisedTimeline({
      caseId, asOf: date, revisions: [
        revision("E01", 1, date, date, "Entretien fictif daté."),
      ], authorized: true,
    });
    assert.equal(result.events[0].occurredAt, date);
  }
  for (const invalid of ["2026-02-29", "2026-04-31", "2026-06-31", "2026-11-31", "2026-13-01"]) {
    assert.throws(() => selectFictionalRevisedTimeline({
      caseId, asOf: invalid, revisions: [], authorized: true,
    }), FictionalRevisionError);
  }
  const leap = selectFictionalRevisedTimeline({
    caseId, asOf: "2024-02-29", revisions: [
      revision("E01", 1, "2024-02-29", "2024-02-29", "Jour bissextile fictif."),
    ], authorized: true,
  });
  assert.equal(leap.events[0].occurredAt, "2024-02-29");
});
