import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiAccessError, creerNotePartageeSecurisee, lireApercuSecurise } from "./secureApi";

const id = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
afterEach(() => vi.unstubAllGlobals());

describe("adaptateur API métier same-origin (non activé dans le prototype)", () => {
  it("lit uniquement la ressource demandée sans en-tête d'usurpation de rôle", async () => {
    const mock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id, version: 1 }), {
      status: 200, headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", mock);
    expect(await lireApercuSecurise(id)).toEqual({ id, version: 1 });
    expect(mock).toHaveBeenCalledWith(`/api/dossiers/${id}/overview`, {
      credentials: "same-origin", cache: "no-store", redirect: "error",
    });
  });

  it("refuse un identifiant de dossier arbitraire sans aucun appel réseau", async () => {
    const mock = vi.fn();
    vi.stubGlobal("fetch", mock);
    await expect(lireApercuSecurise("../notes")).rejects.toBeInstanceOf(ApiAccessError);
    expect(mock).not.toHaveBeenCalled();
  });

  it("exige un CSRF valide pour créer un brouillon, sans mémoriser la session", async () => {
    const csrf = "f".repeat(64);
    const mock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: csrf }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ noteId: "fictif", dossierVersion: 2 }), { status: 201 }));
    vi.stubGlobal("fetch", mock);
    const result = await creerNotePartageeSecurisee({ caseId: id, text: "Brouillon fictif", expectedVersion: 1 });
    expect(result.dossierVersion).toBe(2);
    const [, opts] = mock.mock.calls[1];
    expect(mock.mock.calls[0][0]).toBe("/auth/csrf");
    expect(opts.headers["X-CSRF-Token"]).toBe(csrf);
    expect(opts.credentials).toBe("same-origin");
    expect(opts.body).toBe(JSON.stringify({ text: "Brouillon fictif", expectedVersion: 1 }));
    expect(opts.headers.Authorization).toBeUndefined();
  });

  it("ne tente aucune écriture si la session ou le CSRF ne sont pas disponibles", async () => {
    const mock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "SESSION_REQUISE" }), { status: 401 }));
    vi.stubGlobal("fetch", mock);
    await expect(creerNotePartageeSecurisee({ caseId: id, text: "Exemple", expectedVersion: 0 }))
      .rejects.toMatchObject({ status: 401, code: "SESSION_REQUISE" });
    expect(mock).toHaveBeenCalledTimes(1);
  });
});
