import { describe, expect, it } from "vitest";
import { findAutomaticDocumentMatch, rankDocumentMatches } from "./documentMatching";

const rows = [
  { Nom: "EXEMPLE", Prénom: "Alpha", "Numéro Insertis": "12345" },
  { Nom: "DEMO", Prénom: "Beta", "Numéro Insertis": "23456" },
  { Nom: "TEST", Prénom: "Gamma", "Numéro Insertis": "34567" },
];

describe("documentMatching", () => {
  it("reconnaît NOM Prénom", () => {
    expect(findAutomaticDocumentMatch("EXEMPLE Alpha", rows)).toMatchObject({
      dossierId: "12345",
      personne: "EXEMPLE Alpha",
      confidence: "forte",
    });
  });

  it("reconnaît Prénom NOM", () => {
    expect(findAutomaticDocumentMatch("Beta DEMO - pièces", rows)).toMatchObject({
      dossierId: "23456",
      personne: "DEMO Beta",
    });
  });

  it("reconnaît un numéro Insertis", () => {
    expect(findAutomaticDocumentMatch("Dossier 34567 documents", rows)).toMatchObject({
      dossierId: "34567",
    });
  });

  it("ne rattache pas automatiquement un prénom seul", () => {
    expect(findAutomaticDocumentMatch("Alpha", rows)).toBeNull();
  });

  it("ne rattache pas automatiquement si deux identités obtiennent le même score", () => {
    const doublons = [
      { Nom: "FICTIF", Prénom: "Delta", "Numéro Insertis": "A1" },
      { Nom: "FICTIF", Prénom: "Delta", "Numéro Insertis": "A2" },
    ];
    expect(findAutomaticDocumentMatch("FICTIF Delta", doublons)).toBeNull();
  });

  it("classe les suggestions par score", () => {
    const ranked = rankDocumentMatches("EXEMPLE Alpha", rows);
    expect(ranked[0].dossierId).toBe("12345");
    expect(ranked[0].score).toBeGreaterThan(90);
  });
});
