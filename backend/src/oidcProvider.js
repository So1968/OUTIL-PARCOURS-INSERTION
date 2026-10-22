import * as oidc from "openid-client";

/** Adaptateur OpenID Connect 6.x : validation de signature, issuer, audience,
 * nonce et PKCE par la bibliothèque. Aucun jeton tiers n'est conservé.
 * La configuration n'est jamais envoyée au frontend.
 */
export function createOidcProvider({ issuer, clientId, clientSecret, redirectUri }) {
  const issuerUrl = new URL(issuer);
  const callback = new URL(redirectUri);
  if (issuerUrl.protocol !== "https:" || issuerUrl.username || issuerUrl.password
    || issuerUrl.search || issuerUrl.hash || issuerUrl.hostname === "localhost"
    || callback.protocol !== "https:" || callback.pathname !== "/auth/callback"
    || !clientId || !clientSecret) {
    throw new Error("CONFIGURATION_OIDC_INVALIDE");
  }
  // Éviter le choix d'un tenant partagé (common/consumers/organizations)
  // sans accord explicite de l'organisation.
  if (/^login\.microsoftonline\.com$/i.test(issuerUrl.hostname)
    && /\/(?:common|organizations|consumers)\/v2\.0\/?$/i.test(issuerUrl.pathname)) {
    throw new Error("TENANT_OIDC_NON_DEDIE");
  }

  let discoveryPromise;
  const configuration = () => {
    discoveryPromise ??= oidc.discovery(issuerUrl, clientId, clientSecret);
    return discoveryPromise;
  };

  return {
    issuer: issuerUrl.href.replace(/\/$/, ""),
    redirectUri: callback.href,
    generateVerifier: () => oidc.randomPKCECodeVerifier(),
    async authorizationUrl({ verifier, state, nonce }) {
      const config = await configuration();
      const challenge = await oidc.calculatePKCECodeChallenge(verifier);
      return oidc.buildAuthorizationUrl(config, {
        redirect_uri: callback.href,
        scope: "openid",
        response_type: "code",
        code_challenge: challenge,
        code_challenge_method: "S256",
        state,
        nonce,
      }).href;
    },
    async verifyCallback({ callbackUrl, verifier, state, nonce }) {
      const config = await configuration();
      const tokens = await oidc.authorizationCodeGrant(config, new URL(callbackUrl), {
        pkceCodeVerifier: verifier,
        expectedState: state,
        expectedNonce: nonce,
        idTokenExpected: true,
      });
      const claims = tokens.claims();
      if (!claims?.iss || !claims?.sub || claims.iss !== issuerUrl.href.replace(/\/$/, "")) {
        throw new Error("IDENTITE_OIDC_INVALIDE");
      }
      return { issuer: claims.iss, subject: claims.sub };
    },
  };
}
