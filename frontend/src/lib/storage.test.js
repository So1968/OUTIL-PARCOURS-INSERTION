import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  readStorageItem,
  readStorageJson,
  removeStorageItem,
  writeStorageItem,
  writeStorageJson,
} from "./storage";

describe("stockage local sécurisé", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("lit et écrit du JSON", () => {
    expect(writeStorageJson("dossier", { id: 42 })).toBe(true);
    expect(readStorageJson("dossier", null)).toEqual({ id: 42 });
  });

  it("retourne la valeur de repli si le JSON est invalide", () => {
    localStorage.setItem("dossier", "{invalide");
    expect(readStorageJson("dossier", [])).toEqual([]);
  });

  it("lit, écrit et retire une valeur simple", () => {
    expect(writeStorageItem("role", "professionnelle")).toBe(true);
    expect(readStorageItem("role", "aucun")).toBe("professionnelle");
    expect(removeStorageItem("role")).toBe(true);
    expect(readStorageItem("role", "aucun")).toBe("aucun");
  });

  it("ne bloque pas l’application si le stockage refuse une écriture", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota dépassé", "QuotaExceededError");
    });

    expect(writeStorageJson("dossier", { id: 42 })).toBe(false);
  });
});
