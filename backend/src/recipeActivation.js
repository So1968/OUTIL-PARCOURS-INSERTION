
// Validation fail-closed au démarrage, avant toute connexion à la base.
// Le verrou technique ne constitue JAMAIS une autorisation ARTAG.
export function validateRecipeActivation(env = {}) {
  const sso = env.ARTAG_OIDC_ENABLED === "1";
  const sharedWrites = env.ARTAG_ENABLE_SHARED_WRITES === "1";
  const workTasks = env.ARTAG_ENABLE_WORK_TASKS === "1";
  if (!sso && !sharedWrites && !workTasks) {
    return Object.freeze({ enabled: false, sso: false, sharedWrites: false, workTasks: false });
  }
  if (env.NODE_ENV === "production") {
    throw new Error("PRODUCTION_NON_AUTORISEE");
  }
  if (env.ARTAG_PRIVATE_RECIPE_GATE !== "1") {
    throw new Error("RECETTE_PRIVEE_NON_ACTIVEE");
  }
  if (!sso && (sharedWrites || workTasks)) {
    throw new Error("SSO_REQUIS");
  }

  // Origin d'application canonique : HTTPS obligatoire, sans chemin, paramètres,
  // identifiants incorporés ni URL de redirection étrangère.
  let origin, redirect;
  try {
    origin = new URL(env.ARTAG_PUBLIC_ORIGIN);
    redirect = new URL(env.ARTAG_OIDC_REDIRECT_URI);
  } catch {
    throw new Error("ORIGINE_HTTPS_INVALIDE");
  }
  if (origin.protocol !== "https:" || origin.username || origin.password ||
    origin.search || origin.hash || origin.pathname !== "/" ||
    origin.origin !== env.ARTAG_PUBLIC_ORIGIN ||
    redirect.origin !== origin.origin || redirect.pathname !== "/auth/callback" ||
    redirect.search || redirect.hash || redirect.username || redirect.password) {
    throw new Error("ORIGINE_HTTPS_INVALIDE");
  }
  return Object.freeze({ enabled: true, sso, sharedWrites, workTasks });
}
