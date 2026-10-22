import test from "node:test";
import assert from "node:assert/strict";
import { createOidcProvider } from "../src/oidcProvider.js";

const fixture = {
  issuer: "https://login.microsoftonline.com/00000000-0000-0000-0000-000000000001/v2.0",
  clientId: "identifiant-fictif",
  clientSecret: "secret-pour-tests-seulement",
  redirectUri: "https://artag.example.org/auth/callback",
};

test("tenant dédié en HTTPS et callback fixe : validation sans aucun appel réseau", () => {
  const provider = createOidcProvider(fixture);
  assert.equal(provider.issuer, fixture.issuer);
  assert.equal(provider.redirectUri, fixture.redirectUri);
  assert.ok(provider.generateVerifier());
});

test("refuse les tenants partagés et les URLs de callback non sécurisées", () => {
  for (const issuer of [
    "http://login.microsoftonline.com/demo/v2.0",
    "https://login.microsoftonline.com/common/v2.0",
    "https://login.microsoftonline.com/organizations/v2.0",
    "https://login.microsoftonline.com/consumers/v2.0",
  ]) {
    assert.throws(() => createOidcProvider({ ...fixture, issuer }));
  }
  assert.throws(() => createOidcProvider({ ...fixture, redirectUri: "http://artag.example.org/auth/callback" }));
  assert.throws(() => createOidcProvider({ ...fixture, clientSecret: "" }));
});
