import { describe, expect, it } from "vitest";
import { BRIEF_TYPES, checkedBriefContent, checkedBriefPage, sameBriefContent } from "./secureCaseBriefData";

const caseId = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const actorId = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const empty = type => Object.fromEntries(BRIEF_TYPES[type].fields.map(([field]) => [field, ""]));
const page = (type, overrides = {}) => ({
  caseId, type, dossierVersion: 1, briefVersion: 0, content: empty(type),
  history: [], nextBeforeVersion: null, ...overrides,
});

describe("contrat client des deux blocs courts", () => {
  it("conserve les rubriques exactes de la synthèse et de la continuité", () => {
    expect(BRIEF_TYPES["synthese-courte"].fields.map(([name]) => name)).toEqual([
      "situationGlobale", "difficultesPrincipales", "pointsAppui",
      "sujetsTravailles", "etapeActuelle", "vigilanceUtile",
    ]);
    expect(BRIEF_TYPES["note-continuite"].fields.map(([name]) => name)).toEqual([
      "situationEnCours", "prioriteImmediate", "dejaFait", "relaisAbsence", "vigilanceUtile",
    ]);
    for (const type of Object.keys(BRIEF_TYPES)) {
      const blank = empty(type), first = BRIEF_TYPES[type].fields[0][0];
      expect(checkedBriefContent(type, blank)).toEqual(blank);
      const filled = { ...blank, [first]: "Texte fictif" };
      expect(sameBriefContent(type, filled, { ...filled })).toBe(true);
      for (const bad of [
        null, [], { ...filled, score: 5 }, { ...filled, [first]: "x".repeat(351) },
        { ...filled, [first]: "\u0000" }, { ...filled, [first]: " Texte fictif " },
        { ...filled, [first]: { text: "fictif" } },
        Object.fromEntries(Object.entries(filled).slice(1)),
      ]) expect(checkedBriefContent(type, bad)).toBeNull();
    }
  });

  it("valide un état vide, une version auditée et une pagination cohérente", () => {
    for (const type of Object.keys(BRIEF_TYPES)) {
      const blank = empty(type), field = BRIEF_TYPES[type].fields[0][0];
      const filled = { ...blank, [field]: "Texte fictif" };
      const history = [{ dossierVersion: 2, previousContent: blank, content: filled,
        actorId, reason: "Saisie fictive", createdAt: "2026-11-05T19:00:00Z" }];
      expect(checkedBriefPage(page(type), caseId, type).history).toEqual([]);
      expect(checkedBriefPage(page(type, {
        dossierVersion: 2, briefVersion: 2, content: filled, history,
      }), caseId, type).history).toEqual(history);
      for (const bad of [
        page(type, { caseId: actorId }),
        page(type, { type: "autre" }),
        page(type, { content: { ...blank, score: 5 } }),
        page(type, { briefVersion: 2, dossierVersion: 1 }),
        page(type, { briefVersion: 2, dossierVersion: 2, content: filled,
          history: [{ ...history[0], actorId: "invalide" }] }),
        page(type, { briefVersion: 2, dossierVersion: 2, content: filled,
          history: [{ ...history[0], dossierVersion: 3 }] }),
        page(type, { briefVersion: 2, dossierVersion: 2, content: filled,
          history: [{ ...history[0], content: blank }] }),
        page(type, { extra: true }),
      ]) expect(() => checkedBriefPage(bad, caseId, type)).toThrow("REPONSE_BLOC_COURT_INVALIDE");
    }
  });
});
