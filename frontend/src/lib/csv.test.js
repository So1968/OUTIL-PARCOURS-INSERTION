import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv";

describe("import CSV Insertis", () => {
  it("détecte le point-virgule et retire le BOM", () => {
    const rows = parseCsv("\uFEFFPrénom;Nom;Ville\r\nSofia;de los Rios;Lyon");

    expect(rows).toEqual([{ Prénom: "Sofia", Nom: "de los Rios", Ville: "Lyon" }]);
  });

  it("conserve les séparateurs et retours à la ligne dans les cellules citées", () => {
    const rows = parseCsv('Prénom,Note\nSofia,"Premier contact, puis\nrelance"');

    expect(rows).toEqual([{ Prénom: "Sofia", Note: "Premier contact, puis\nrelance" }]);
  });

  it("gère les guillemets doublés", () => {
    const rows = parseCsv('Nom;Note\nTest;"Elle dit ""oui"""');

    expect(rows[0].Note).toBe('Elle dit "oui"');
  });

  it("ignore un fichier sans ligne de données", () => {
    expect(parseCsv("Prénom;Nom")).toEqual([]);
  });
});
