import test from "node:test";
import assert from "node:assert/strict";
import { BRIEF_FIELDS, canonicalBrief } from "../src/caseBriefService.js";

const mockContent = (type, replacements = {}) =>
  Object.fromEntries(BRIEF_FIELDS[type].map(field => [field, replacements[field] ?? ""]));

test("synthèse courte et note de continuité gardent exactement leurs rubriques validées", () => {
  assert.deepEqual(BRIEF_FIELDS["synthese-courte"], [
    "situationGlobale", "difficultesPrincipales", "pointsAppui",
    "sujetsTravailles", "etapeActuelle", "vigilanceUtile",
  ]);
  assert.deepEqual(BRIEF_FIELDS["note-continuite"], [
    "situationEnCours", "prioriteImmediate", "dejaFait", "relaisAbsence", "vigilanceUtile",
  ]);
  assert.deepEqual(canonicalBrief("synthese-courte", mockContent("synthese-courte")), mockContent("synthese-courte"));
  assert.deepEqual(canonicalBrief("note-continuite", mockContent("note-continuite")), mockContent("note-continuite"));
  assert.equal(canonicalBrief("autre", {}), null);
});

test("refuse les données inattendues, le texte trop long et les caractères interdits", () => {
  for (const type of Object.keys(BRIEF_FIELDS)) {
    const field = BRIEF_FIELDS[type][0];
    const valid = mockContent(type, { [field]: "Situation fictive sans donnée réelle" });
    assert.deepEqual(canonicalBrief(type, valid), valid);
    for (const invalid of [
      null, [], { ...valid, score: 9 }, { ...valid, [field]: undefined },
      { ...valid, [field]: { texte: "fictif" } },
      { ...valid, [field]: "a".repeat(351) },
      { ...valid, [field]: "\u0000" },
      { ...valid, [field]: "  Une information   " },
      Object.fromEntries(Object.entries(valid).slice(1)),
    ]) assert.equal(canonicalBrief(type, invalid), null);
  }
});

test("une première saisie peut conserver plusieurs rubriques non renseignées sans inventer de faits", () => {
  const content = mockContent("note-continuite", {
    situationEnCours: "Dossier de démonstration",
    prioriteImmediate: "Vérifier le prochain rendez-vous",
  });
  assert.deepEqual(canonicalBrief("note-continuite", content), content);
  assert.equal(content.dejaFait, "");
  assert.equal(content.vigilanceUtile, "");
});
