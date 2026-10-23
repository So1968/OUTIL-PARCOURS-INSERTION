import { describe, expect, it } from "vitest";
import { findAutomaticDocumentMatch, rankDocumentMatches } from "./documentMatching";

const rows = [
  { Nom: "EXEMPLE", Prénom: "Alpha", "Numéro Insertis": "12345" },
  { Nom: "DEMO", Prénom: "Beta", "Numéro Insertis": "23456" },
  { Nom: "TEST", Prénom: "Gamma", "Numéro Insertis": "34567" },
];

describe("documentMatching", () => {
  it("ne rattache jamais automatiquement sur NOM Prénom seuls", () => {
    expect(findAutomaticDocumentMatch("EXEMPLE Alpha", rows)).toBeNull();
    expect(findAutomaticDocumentMatch("Beta DEMO - pièces", rows)).toBeNull();
  });

  it("accepte identifiant Insertis stable et identité concordante", () => {
    expect(findAutomaticDocumentMatch("EXEMPLE Alpha 12345", rows)).toMatchObject({
      dossierId: "12345",
      personne: "EXEMPLE Alpha",
      confidence: "forte",
    });
  });

  it("ne rattache pas sur __id interne sans numéro de dossier", () => {
    const dossiers = [{ Nom: "EXEMPLE", Prénom: "Alpha", __id: "ABC123" }];
    expect(findAutomaticDocumentMatch("ABC123 EXEMPLE Alpha", dossiers)).toBeNull();
  });

  it("reconnaît un numéro Insertis", () => {
    expect(findAutomaticDocumentMatch("Dossier 34567 documents", rows)).toMatchObject({
      dossierId: "34567",
    });
  });

  it("n'associe pas le numéro 123 à un dossier 12345", () => {
    const dossiers = [
      { Nom: "EXEMPLE", Prénom: "Alpha", "Numéro Insertis": "123" },
      { Nom: "FICTIF", Prénom: "Beta", "Numéro Insertis": "12345" },
    ];
    expect(findAutomaticDocumentMatch("Documents dossier 12345", dossiers)).toMatchObject({ dossierId: "12345" });
    expect(findAutomaticDocumentMatch("Documents dossier 123456", dossiers)).toBeNull();
  });

  it("ne considère pas l'identifiant de repli par position comme un vrai numéro", () => {
    const dossiers = [{ Nom: "EXEMPLE", Prénom: "Alpha" }];
    expect(findAutomaticDocumentMatch("Dossier dossier-0 - pièces", dossiers)).toBeNull();
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
    const ranked = rankDocumentMatches("EXEMPLE Alpha 12345", rows);
    expect(ranked[0].dossierId).toBe("12345");
    expect(ranked[0].score).toBeGreaterThan(90);
  });
});
