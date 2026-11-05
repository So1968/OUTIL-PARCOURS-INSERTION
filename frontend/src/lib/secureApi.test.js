import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiAccessError, creerNotePartageeSecurisee, lireApercuSecurise,
  corrigerNotePartageeSecurisee, validerNotePartageeSecurisee, lireHistoriqueNotePartageeSecurise,
} from "./secureApi";

const id = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const noteId = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
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

  it("corrige avec une justification et une version, puis valide sans renvoyer le texte", async () => {
    const csrf = "a".repeat(64);
    const json = payload => new Response(JSON.stringify(payload), { status: 200 });
    const mock = vi.fn()
      .mockResolvedValueOnce(json({ token: csrf }))
      .mockResolvedValueOnce(json({ noteId, dossierVersion: 2, validated: false }))
      .mockResolvedValueOnce(json({ token: csrf }))
      .mockResolvedValueOnce(json({ noteId, dossierVersion: 3, validated: true }));
    vi.stubGlobal("fetch", mock);
    const corrected = await corrigerNotePartageeSecurisee({ caseId: id, noteId,
      text: "Précision fictive", reason: "Relecture fictive", expectedVersion: 1 });
    expect(corrected.validated).toBe(false);
    expect(mock.mock.calls[1]).toEqual([`/api/dossiers/${id}/notes-partagees/${noteId}`, {
      method: "PATCH", credentials: "same-origin", cache: "no-store", redirect: "error",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
      body: JSON.stringify({ text: "Précision fictive", reason: "Relecture fictive", expectedVersion: 1 }),
    }]);
    expect((await validerNotePartageeSecurisee({ caseId: id, noteId, expectedVersion: 2 })).validated).toBe(true);
    expect(mock.mock.calls[3][0]).toBe(`/api/dossiers/${id}/notes-partagees/${noteId}/validation`);
    expect(mock.mock.calls[3][1].body).toBe(JSON.stringify({ expectedVersion: 2 }));
  });

  it("lit les versions par pages sans charger ni conserver de jeton CSRF", async () => {
    const mock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ history: [], nextBeforeVersion: null })));
    vi.stubGlobal("fetch", mock);
    await lireHistoriqueNotePartageeSecurise({ caseId: id, noteId, beforeVersion: 8 });
    expect(mock).toHaveBeenCalledExactlyOnceWith(`/api/dossiers/${id}/notes-partagees/${noteId}/historique?beforeVersion=8`, {
      credentials: "same-origin", cache: "no-store", redirect: "error",
    });
  });

  it("refuse les identifiants et curseurs arbitraires avant toute requête", async () => {
    const mock = vi.fn();
    vi.stubGlobal("fetch", mock);
    await expect(corrigerNotePartageeSecurisee({ caseId: id, noteId: "../autre" })).rejects.toMatchObject({ status: 422 });
    await expect(validerNotePartageeSecurisee({ caseId: id, noteId: "../autre" })).rejects.toMatchObject({ status: 422 });
    await expect(lireHistoriqueNotePartageeSecurise({ caseId: id, noteId, beforeVersion: "1&role=REFERENTE" }))
      .rejects.toMatchObject({ status: 422 });
    expect(mock).not.toHaveBeenCalled();
  });

  it("remonte un conflit sans réessayer une correction ni écraser la version serveur", async () => {
    const mock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: "a".repeat(64) })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "DOSSIER_MODIFIE_ENTRE_TEMPS" }), { status: 409 }));
    vi.stubGlobal("fetch", mock);
    await expect(corrigerNotePartageeSecurisee({ caseId: id, noteId,
      text: "Exemple fictif", reason: "Correction fictive", expectedVersion: 1 }))
      .rejects.toMatchObject({ status: 409, code: "DOSSIER_MODIFIE_ENTRE_TEMPS" });
    expect(mock).toHaveBeenCalledTimes(2);
  });

  it("bloque une validation quand le jeton CSRF retourné est invalide", async () => {
    const mock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ token: "invalide" })));
    vi.stubGlobal("fetch", mock);
    await expect(validerNotePartageeSecurisee({ caseId: id, noteId, expectedVersion: 1 }))
      .rejects.toMatchObject({ status: 503, code: "CSRF_INDISPONIBLE" });
    expect(mock).toHaveBeenCalledTimes(1);
  });
});
