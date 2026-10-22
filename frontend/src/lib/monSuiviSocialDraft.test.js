import { describe, expect, it } from "vitest";
import { preparerBrouillonMonSuiviSocial } from "./monSuiviSocialDraft";

describe("brouillon Mon Suivi Social — préparation manuelle", () => {
  it("reprend uniquement les champs autorisés pour le brouillon minimal", () => {
    const note = preparerBrouillonMonSuiviSocial({
      faits: "Entretien fictif",
      demarches: "Rendez-vous préparé",
      suitePrevue: "Vérifier une échéance",
      analyse: "ANALYSE_INTERNE_NE_PAS_TRANSFERER",
      vigilance: "VIGILANCE_INTERNE_NE_PAS_TRANSFERER",
      autonomie: "AUTONOMIE_DETAILLEE_NE_PAS_TRANSFERER",
      parolePersonne: "PAROLE_PERSONNE_NE_PAS_TRANSFERER",
      telephone: "CONTACT_NE_PAS_TRANSFERER",
    });

    expect(note).toContain("Entretien fictif");
    expect(note).toContain("Rendez-vous préparé");
    expect(note).toContain("Vérifier une échéance");
    expect(note).not.toMatch(/NE_PAS_TRANSFERER/);
    expect(note).toMatch(/à relire/);
  });

  it("ne reprend pas les champs réservés quand les champs communs sont vides", () => {
    const note = preparerBrouillonMonSuiviSocial({ analyse: "NOTE_INTERNE" });
    expect(note).not.toContain("NOTE_INTERNE");
    expect(note).toContain("à compléter");
  });
});
