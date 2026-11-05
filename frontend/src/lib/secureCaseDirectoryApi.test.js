import { afterEach, describe, expect, it, vi } from "vitest";
import { loadWritableCases, hasUsableArtagReference } from "./secureCaseDirectoryApi";
const id = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const row = { id, artagReference: "ARTAG-FICTIF", version: 0,
  createdAt: "2026-10-26T08:00:00Z", updatedAt: "2026-10-26T08:00:00Z" };
afterEach(() => vi.unstubAllGlobals());

describe("client de la file active serveur", () => {
  it("utilise la session same-origin sans rôle, filtre de compte ni stockage local", async () => {
    const mock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ cases: [row], nextCursor: null })));
    vi.stubGlobal("fetch", mock);
    expect((await loadWritableCases()).cases).toEqual([row]);
    expect(mock).toHaveBeenCalledExactlyOnceWith("/api/mes-dossiers", {
      credentials: "same-origin", cache: "no-store", redirect: "error",
    });
  });
  it("accepte un numéro manquant sans inventer de référence", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ cases: [{ ...row, artagReference: null }], nextCursor: null }))));
    expect((await loadWritableCases()).cases[0].artagReference).toBeNull();
    for (const value of [null, "", "  ", " ARTAG", "a".repeat(81), "ARTAG\nFICTIF"]) expect(hasUsableArtagReference(value)).toBe(false);
  });
  it("refuse un curseur arbitraire sans requête", async () => {
    const mock = vi.fn(); vi.stubGlobal("fetch", mock);
    await expect(loadWritableCases("../autre?role=REFERENTE")).rejects.toMatchObject({ status: 422 });
    expect(mock).not.toHaveBeenCalled();
  });
  it("refuse des données incomplètes, répétées ou une pagination qui boucle", async () => {
    for (const payload of [{}, { cases: [row, row], nextCursor: null },
      { cases: [{ ...row, artagReference: {} }], nextCursor: null },
      { cases: [], nextCursor: "idem" }]) {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(payload))));
      await expect(loadWritableCases("idem")).rejects.toMatchObject({ status: 503 });
    }
  });
  it("conserve les refus du serveur sans reproduire son message dans l'interface", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "Détail fictif non affichable" }), { status: 404 })));
    await expect(loadWritableCases()).rejects.toMatchObject({ status: 404, code: "SERVICE_INDISPONIBLE" });
  });
});
