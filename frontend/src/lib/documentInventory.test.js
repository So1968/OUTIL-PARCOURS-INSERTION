import { describe, expect, it } from "vitest";
import { buildFolderInventory, duplicateStats, fileExtension, humanFileSize, suggestedTriage } from "./documentInventory";

function fakeFile(name, relative, size = 10, lastModified = 1000) {
  return { name, webkitRelativePath: relative, size, lastModified };
}

describe("documentInventory", () => {
  it("détecte les extensions", () => {
    expect(fileExtension("note.PDF")).toBe("pdf");
    expect(fileExtension("README")).toBe("sans-extension");
  });

  it("indexe un sous-dossier sans lire le contenu", () => {
    const files = [
      fakeFile("note.pdf", "ORGA/EXEMPLE Alpha/note.pdf", 100, 2000),
      fakeFile("photo.jpg", "ORGA/EXEMPLE Alpha/photos/photo.jpg", 200, 3000),
      fakeFile("autre.docx", "ORGA/DEMO Beta/autre.docx", 50, 1000),
    ];
    const result = buildFolderInventory(files, "ORGA", "EXEMPLE Alpha", "C:\\Travail", 80);
    expect(result.fileCount).toBe(2);
    expect(result.indexedFiles[0].chemin).toContain("C:\\Travail\\EXEMPLE Alpha");
    expect(result.extensionCounts).toEqual({ pdf: 1, jpg: 1 });
    expect(result.latestModified).toBe(3000);
    expect(result.truncated).toBe(false);
  });

  it("marque les fichiers potentiellement dupliqués", () => {
    const files = [
      fakeFile("note.pdf", "ORGA/EXEMPLE Alpha/note.pdf", 100),
      fakeFile("note.pdf", "ORGA/EXEMPLE Alpha/copie/note.pdf", 100),
    ];
    const result = buildFolderInventory(files, "ORGA", "EXEMPLE Alpha", "", 80);
    expect(result.indexedFiles.every((file) => file.duplicatePotential)).toBe(true);
    expect(suggestedTriage(result.indexedFiles[0])).toBe("Doublon à vérifier");
  });

  it("limite le nombre de noms mémorisés", () => {
    const files = Array.from({ length: 100 }, (_, index) =>
      fakeFile(`fichier-${index}.txt`, `ORGA/EXEMPLE Alpha/fichier-${index}.txt`, index),
    );
    const result = buildFolderInventory(files, "ORGA", "EXEMPLE Alpha", "", 10);
    expect(result.fileCount).toBe(100);
    expect(result.indexedFileCount).toBe(10);
    expect(result.truncated).toBe(true);
  });

  it("repère les doublons nom + taille", () => {
    const files = [
      fakeFile("note.pdf", "ORGA/A/note.pdf", 100),
      fakeFile("note.pdf", "ORGA/B/note.pdf", 100),
      fakeFile("note.pdf", "ORGA/C/note.pdf", 200),
    ];
    expect(duplicateStats(files)).toEqual({ duplicateGroups: 1, duplicateFiles: 2 });
  });

  it("formate les tailles", () => {
    expect(humanFileSize(1024)).toBe("1.0 Ko");
  });
});
