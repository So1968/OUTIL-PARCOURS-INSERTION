import { describe, expect, it } from "vitest";
import {
  RELATION_AIDE_FIELDS, emptyReflection, checkedReflectionContent,
  checkedReflectionPage, sameReflectionContent,
} from "./secureProfessionalReflectionData";

const caseId = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const authorId = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const blank = emptyReflection();
const filled = { ...blank, entreeRelation: "Échange fictif observé" };
const history = [{
  dossierVersion: 2, previousContent: blank, content: filled,
  actorId: authorId, reason: "Première rédaction fictive",
  createdAt: "2026-11-05T19:00:00Z",
}];
const page = (overrides = {}) => ({
  caseId, dossierVersion: 2, reflectionVersion: 2,
  content: filled, history, nextBeforeVersion: null, ...overrides,
});

describe("contrat de la réflexion professionnelle réservée", () => {
  it("utilise exactement les six axes du cahier des charges, sans classement", () => {
    expect(RELATION_AIDE_FIELDS.map(([key]) => key)).toEqual([
      "entreeRelation", "expressionDemande", "receptionAideProposee",
      "possibiliteCoConstruction", "rapportCadre", "postureProfessionnelleAPrivilegier",
    ]);
    expect(checkedReflectionContent(blank)).toEqual(blank);
    expect(checkedReflectionContent(filled)).toEqual(filled);
    expect(sameReflectionContent(filled, { ...filled })).toBe(true);
    for (const invalid of [
      null, [], { ...blank, diagnostic: "inconnu" },
      { ...blank, rapportCadre: { valeur: "invalide" } },
      { ...blank, rapportCadre: "\u0000" },
      { ...blank, rapportCadre: "  espaces  " },
      { ...blank, rapportCadre: "a".repeat(1201) },
      Object.fromEntries(Object.entries(blank).slice(1)),
    ]) expect(checkedReflectionContent(invalid)).toBeNull();
  });

  it("refuse une page malformée, avec historique incohérent ou auteur mélangé", () => {
    expect(checkedReflectionPage(page(), caseId).history).toEqual(history);
    expect(checkedReflectionPage(page({
      dossierVersion: 1, reflectionVersion: 0, content: blank, history: [],
    }), caseId).reflectionVersion).toBe(0);
    for (const bad of [
      page({ caseId: authorId }),
      page({ extra: "fuite" }),
      page({ reflectionVersion: 3 }),
      page({ content: { ...filled, entreeRelation: "autre" } }),
      page({ history: [{ ...history[0], actorId: "invalide" }] }),
      page({ history: [{ ...history[0], dossierVersion: 3 }] }),
      page({ history: [{ ...history[0], reason: "" }] }),
      page({ history: [{ ...history[0], content: blank }] }),
      page({ reflectionVersion: 0, history: [], content: filled }),
    ]) expect(() => checkedReflectionPage(bad, caseId)).toThrow("REPONSE_REFLEXION_INVALIDE");
    expect(() => checkedReflectionPage(page(), caseId, 2)).toThrow("REPONSE_REFLEXION_INVALIDE");
  });
});
