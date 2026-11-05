import test from "node:test";
import assert from "node:assert/strict";
import {
  PROFESSIONAL_REFLECTION_FIELDS, canonicalProfessionalReflection,
} from "../src/professionalReflectionService.js";

const example = (changes = {}) =>
  Object.fromEntries(PROFESSIONAL_REFLECTION_FIELDS.map(field => [field, changes[field] ?? ""]));

test("les six axes de la relation d'aide respectent strictement le cahier des charges", () => {
  assert.deepEqual(PROFESSIONAL_REFLECTION_FIELDS, [
    "entreeRelation", "expressionDemande", "receptionAideProposee",
    "possibiliteCoConstruction", "rapportCadre", "postureProfessionnelleAPrivilegier",
  ]);
  const valid = example({ expressionDemande: "Observations fictives vérifiées" });
  assert.deepEqual(canonicalProfessionalReflection(valid), valid);
  assert.deepEqual(canonicalProfessionalReflection(example()), example());
});

test("la réflexion professionnelle refuse les axes étrangers, données non textuelles et textes invalides", () => {
  const empty = example();
  for (const invalid of [
    null, [], {}, { ...empty, evaluationPsychologique: "interdit" },
    { ...empty, entreeRelation: {} },
    { ...empty, entreeRelation: "\u0000" },
    { ...empty, entreeRelation: "  deux espaces " },
    { ...empty, entreeRelation: "x".repeat(1201) },
    Object.fromEntries(Object.entries(empty).slice(1)),
  ]) assert.equal(canonicalProfessionalReflection(invalid), null);
  const valid = example({ entreeRelation: "Point observé.\nProposition à vérifier." });
  assert.deepEqual(canonicalProfessionalReflection(valid), valid);
});
