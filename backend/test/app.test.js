import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createApp } from "../src/app.js";

async function withServer(check) {
  const server = createApp().listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    await check(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("la santé du socle répond sans aucun détail métier", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/healthz`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok", service: "artag-api-socle" });
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.has("x-powered-by"), false);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  });
});

test("les routes métier ne sont jamais accessibles dans ce socle", async () => {
  await withServer(async (baseUrl) => {
    for (const [method, uri] of [
      ["GET", "/api/dossiers"], ["POST", "/api/dossiers"], ["GET", "/api/notes-reservees"],
      ["GET", "/api/dossiers/fictif/notes-partagees"],
      ["GET", "/api/mes-dossiers"],
      ["PATCH", "/api/dossiers/fictif/notes-partagees/fictif"],
      ["POST", "/api/dossiers/fictif/notes-partagees/fictif/validation"],
      ["GET", "/api/dossiers/fictif/notes-partagees/fictif/historique"],
    ]) {
      const response = await fetch(`${baseUrl}${uri}`, { method });
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), { error: "METIER_NON_ACTIVE" });
    }
    const missing = await fetch(`${baseUrl}/other`);
    assert.equal(missing.status, 404);
  });
});

test("readiness indisponible sans PostgreSQL privé configuré", async () => {
  await withServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/readyz`);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { status: "unavailable" });
  });
});

async function withPrivateServer(privateDb, check) {
  const server = createApp({ privateDb }).listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    await check(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

test("readiness vérifie la connexion réelle et masque les détails des erreurs", async () => {
  let checks = 0;
  await withPrivateServer({ $queryRaw: async () => { checks++; return [{ "?column?": 1 }]; } }, async baseUrl => {
    const response = await fetch(`${baseUrl}/readyz`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ready" });
  });
  assert.equal(checks, 1);

  await withPrivateServer({ $queryRaw: async () => { throw new Error("connexion fictive privée"); } }, async baseUrl => {
    const response = await fetch(`${baseUrl}/readyz`);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { status: "unavailable" });
  });
});
