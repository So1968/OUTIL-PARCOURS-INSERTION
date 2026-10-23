
import test from "node:test";
import assert from "node:assert/strict";
import { validateRecipeActivation } from "../src/recipeActivation.js";

const valid = {
  NODE_ENV: "test",
  ARTAG_PRIVATE_RECIPE_GATE: "1",
  ARTAG_OIDC_ENABLED: "1",
  ARTAG_ENABLE_WORK_TASKS: "1",
  ARTAG_PUBLIC_ORIGIN: "https://artag.example.org",
  ARTAG_OIDC_REDIRECT_URI: "https://artag.example.org/auth/callback",
};

test("aucun service métier autorisé par défaut", () => {
  assert.deepEqual(validateRecipeActivation({}), {
    enabled: false, sso: false, sharedWrites: false, workTasks: false,
  });
  assert.deepEqual(validateRecipeActivation({ ARTAG_PRIVATE_RECIPE_GATE:"1" }), {
    enabled: false, sso: false, sharedWrites: false, workTasks: false,
  });
});

test("configuration SSO insuffisante sans verrou de recette explicite", () => {
  assert.throws(() => validateRecipeActivation({ ...valid, ARTAG_PRIVATE_RECIPE_GATE:undefined }),
    /RECETTE_PRIVEE_NON_ACTIVEE/);
  assert.throws(() => validateRecipeActivation({ ...valid, NODE_ENV:"production" }),
    /PRODUCTION_NON_AUTORISEE/);
  assert.throws(() => validateRecipeActivation({
    ...valid, ARTAG_OIDC_ENABLED:"0",
  }), /SSO_REQUIS/);
});

test("refuse les redirections OIDC hors origine, HTTP, URL à secret ou chemin arbitraire", () => {
  for (const changes of [
    { ARTAG_PUBLIC_ORIGIN:"http://artag.example.org" },
    { ARTAG_PUBLIC_ORIGIN:"https://artag.example.org/admin" },
    { ARTAG_PUBLIC_ORIGIN:"https://someone:password@artag.example.org" },
    { ARTAG_OIDC_REDIRECT_URI:"https://evil.example.org/auth/callback" },
    { ARTAG_OIDC_REDIRECT_URI:"https://artag.example.org/other" },
    { ARTAG_OIDC_REDIRECT_URI:"http://artag.example.org/auth/callback" },
    { ARTAG_OIDC_REDIRECT_URI:"https://artag.example.org/auth/callback?token=fictif" },
  ]) {
    assert.throws(() => validateRecipeActivation({ ...valid, ...changes }),
      /ORIGINE_HTTPS_INVALIDE/);
  }
});

test("retourne uniquement les états non sensibles à journaliser", () => {
  const result = validateRecipeActivation(valid);
  assert.deepEqual(result, { enabled:true, sso:true, sharedWrites:false, workTasks:true });
  assert.equal(Object.hasOwn(result, "ARTAG_PUBLIC_ORIGIN"), false);
  assert.equal(Object.hasOwn(result, "ARTAG_OIDC_CLIENT_SECRET"), false);
  assert.equal(Object.isFrozen(result), true);
});
