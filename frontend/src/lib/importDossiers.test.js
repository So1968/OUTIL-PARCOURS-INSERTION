import { describe, expect, it } from "vitest";
import { analyserImportDossiers, identifiantImport } from "./importDossiers";

const dossier = (id) => ({ "Numéro Insertis": id, Nom: "FICTIF", Prénom: "Exemple" });

describe("import de la file active (données fictives)", () => {
  it("identifie les variantes connues d'un numéro de dossier", () => {
    expect(identifiantImport({ "N° dossier": " A-12 " })).toBe("A-12");
    expect(identifiantImport({ Nom: "EXEMPLE" })).toBe("");
  });

  it("refuse les imports sans identifiant métier", () => {
    const result = analyserImportDossiers([dossier("A-1"), { Nom: "FICTIF" }]);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/sans numéro/);
  });

  it("refuse les doublons dans un fichier CSV", () => {
    const result = analyserImportDossiers([dossier("123"), { "Numero dossier": "123" }]);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/répété/);
  });

  it("refuse les doublons alphabétiques même avec variation de casse", () => {
    expect(analyserImportDossiers([dossier("ABC"), dossier("abc")]).ok).toBe(false);
  });

  it("n'alerte pas à tort lors d'un réimport identique", () => {
    expect(analyserImportDossiers([dossier("A-1"), dossier("A-2")], [dossier("A-2"), dossier("A-1")])).toMatchObject({
      ok: true, total: 2, missingFromImport: 0, newInImport: 0, alreadyPresent: 2,
    });
  });

  it("compte les dossiers absents avant de les retirer de la liste affichée", () => {
    expect(analyserImportDossiers([dossier("A-2"), dossier("A-3")], [dossier("A-1"), dossier("A-2")])).toMatchObject({
      ok: true, missingFromImport: 1, newInImport: 1, alreadyPresent: 1,
    });
  });

  it("refuse un fichier vide et ne modifie jamais les tableaux fournis", () => {
    const rows = [dossier("A-1")];
    const snapshot = JSON.stringify(rows);
    expect(analyserImportDossiers([]).ok).toBe(false);
    analyserImportDossiers(rows, [dossier("B-1")]);
    expect(JSON.stringify(rows)).toBe(snapshot);
  });
});
