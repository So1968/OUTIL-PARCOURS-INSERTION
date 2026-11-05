import { describe, it, expect } from "vitest";
import {
  AUTONOMY_IDS, AUTONOMY_CHOICES, checkedAutonomyAnswers, checkedAutonomyPage, sameAutonomyAnswers,
} from "./secureAutonomyData";

const caseId = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const actorId = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const questions = AUTONOMY_IDS.map((id, index) => ({ id, axe: "Domaine fictif " + index, question: "Question fictive " + index + " ?" }));
const answer = { demarches: { reponse: "Avec un peu d’aide", note: "Fictif", valide: true } };
const empty = () => ({ caseId, dossierVersion: 1, autonomyVersion: 0, questions, choix: AUTONOMY_CHOICES,
  reponses: {}, history: [], nextBeforeVersion: null });

describe("contrat du socle autonomie professionnel", () => {
  it("conserve les repères absents et refuse champs supplémentaires et scores", () => {
    expect(checkedAutonomyAnswers({})).toEqual({});
    expect(checkedAutonomyAnswers(answer)).toEqual(answer);
    expect(sameAutonomyAnswers(answer, { ...answer })).toBe(true);
    for (const malformed of [null, [], { inconnu: answer.demarches },
      { demarches: { ...answer.demarches, score: 5 } },
      { demarches: { ...answer.demarches, reponse: "5/5" } },
      { demarches: { ...answer.demarches, note: "a".repeat(1501) } },
      { demarches: { ...answer.demarches, valide: "oui" } }]) {
      expect(checkedAutonomyAnswers(malformed)).toBeNull();
    }
  });
  it("valide un état vide, les huit questions et l'historique versionné", () => {
    expect(checkedAutonomyPage(empty(), caseId).reponses).toEqual({});
    const version = { dossierVersion: 2, previousReponses: {}, reponses: answer, actorId,
      reason: "Saisie fictive", createdAt: "2026-11-05T18:00:00Z" };
    const page = { ...empty(), dossierVersion: 2, autonomyVersion: 2, reponses: answer, history: [version] };
    expect(checkedAutonomyPage(page, caseId).history[0].reponses).toEqual(answer);
    for (const invalid of [
      { ...page, caseId: actorId },
      { ...page, questions: questions.slice(1) },
      { ...page, choix: ["Score"] },
      { ...page, reponses: { score: 7 } },
      { ...page, history: [{ ...version, actorId: "invalide" }] },
      { ...page, history: [{ ...version, dossierVersion: 3 }] },
      { ...page, nextBeforeVersion: 2 },
      { ...page, extra: "fictif" },
    ]) expect(() => checkedAutonomyPage(invalid, caseId)).toThrow("REPONSE_AUTONOMIE_INVALIDE");
  });
});
