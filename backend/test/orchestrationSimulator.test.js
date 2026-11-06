import test from "node:test";
import assert from "node:assert/strict";
import { proposeSimulatedActions, simulateConfirmedReminder, SimulationInputError } from "../src/orchestrationSimulator.js";

const fixture = Object.freeze({
  eventId: "evt-fiction-001",
  source: "SIMULATEUR_INSERTIS",
  type: "ENTRETIEN_TERMINE",
  occurredAt: "2026-11-04T10:00:00+01:00",
  fictionalCaseId: "case-fiction-001",
});

test("l'entretien fictif ne crée aucune action sans confirmation", () => {
  const result = proposeSimulatedActions(fixture);
  assert.equal(result.status, "CONFIRMATION_REQUISE");
  assert.equal(result.proposals.length, 2);
  assert.ok(result.proposals.every(p => p.selected === false));
  assert.deepEqual(simulateConfirmedReminder(fixture), { status: "AUCUNE_ACTION", reminders: [] });
});

test("une confirmation explicite prépare seulement une simulation", () => {
  const result = simulateConfirmedReminder(fixture, {
    confirmed: true, selectedCodes: ["PREPARER_SUITE"],
  });
  assert.equal(result.status, "SIMULATION_SEULEMENT");
  assert.deepEqual(result.reminders, [{
    source: "SIMULATEUR_OUTLOOK", eventId: fixture.eventId,
    code: "PREPARER_SUITE", persisted: false, sent: false,
  }]);
});

test("une proposition inconnue ou une confirmation absente ne déclenche rien", () => {
  for (const args of [
    { confirmed: false, selectedCodes: ["PREPARER_SUITE"] },
    { confirmed: true, selectedCodes: ["AUTRE"] },
    { confirmed: true, selectedCodes: ["PREPARER_SUITE", "PREPARER_SUITE"] },
  ]) {
    assert.equal(simulateConfirmedReminder(fixture, args).status, "AUCUNE_ACTION");
  }
});

test("refuse les champs supplémentaires, identifiants réels et dates invalides", () => {
  for (const event of [
    { ...fixture, nom: "Personne réelle" },
    { ...fixture, fictionalCaseId: "123456" },
    { ...fixture, eventId: "evt-reel-1" },
    { ...fixture, source: "INSERTIS" },
    { ...fixture, occurredAt: "hier" },
    null,
  ]) {
    assert.throws(() => proposeSimulatedActions(event), SimulationInputError);
  }
});

test("répéter le même événement produit une sortie identique sans stockage", () => {
  const first = proposeSimulatedActions(fixture);
  const second = proposeSimulatedActions(fixture);
  assert.deepEqual(first, second);
  assert.notStrictEqual(first, second);
});

test("refuse les dates impossibles, accepte le 29 février bissextile", () => {
  for (const occurredAt of [
    "2026-02-29T10:00:00+01:00",
    "2026-04-31T10:00:00+01:00",
    "2026-11-04T25:00:00+01:00",
    "2026-11-04T10:61:00+01:00",
    "2026-11-04T10:00:00+25:00",
  ]) {
    assert.throws(() => proposeSimulatedActions({ ...fixture, occurredAt }), SimulationInputError);
  }
  assert.equal(proposeSimulatedActions({
    ...fixture, occurredAt: "2024-02-29T10:00:00+01:00",
  }).status, "CONFIRMATION_REQUISE");
});
