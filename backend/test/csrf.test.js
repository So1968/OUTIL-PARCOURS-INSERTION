import test from "node:test";
import assert from "node:assert/strict";
import { issueCsrfToken, validCsrf } from "../src/csrf.js";
import { COOKIE_NAME } from "../src/sessions.js";

const secret = "clé-fictive-de-tests-uniquement-32-caractères";
const cookieHeader = `${COOKIE_NAME}=${"a".repeat(64)}`;
const allowedOrigin = "https://artag.example.org";

test("jeton lié au cookie et à un secret serveur non exposé", () => {
  const token = issueCsrfToken(secret, cookieHeader);
  assert.match(token, /^[a-f0-9]{64}$/);
  assert.equal(validCsrf({
    secret, cookieHeader, csrfHeader: token, origin: allowedOrigin, allowedOrigin,
  }), true);
  assert.equal(issueCsrfToken(secret, `${COOKIE_NAME}=${"b".repeat(64)}`) === token, false);
});

test("refuse les origines étrangères, absence de header, secret faible et cookies dupliqués", () => {
  const token = issueCsrfToken(secret, cookieHeader);
  for (const params of [
    { origin: "https://outside.example.org" },
    { origin: undefined },
    { csrfHeader: "faux" },
    { cookieHeader: "" },
    { cookieHeader: `${cookieHeader}; ${cookieHeader}` },
    { secret: "trop court" },
  ]) {
    assert.equal(validCsrf({
      secret, cookieHeader, csrfHeader: token, origin: allowedOrigin, allowedOrigin, ...params,
    }), false);
  }
});
