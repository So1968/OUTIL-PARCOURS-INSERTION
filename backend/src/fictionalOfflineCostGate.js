/**
 * Barrière de démonstration pour le budget IA : aucun fournisseur payant,
 * aucun hébergement cloud et aucun téléchargement ne sont lancés par ce lot.
 *
 * Cette barrière est une ATTESTATION HUMAINE, pas une lecture fiable de la
 * configuration du processus Ollama distinct. Le service Ollama doit être
 * configuré séparément pour refuser ses fonctions cloud.
 *
 * Le booléen n'est PAS une permission institutionnelle, ni une protection de
 * données réelles. Le scénario autorisé reste fixé dans le code source.
 */
export const FICTIONAL_LOCAL_COST_POLICY = Object.freeze({
  mode: "LOCAL_ONLY_FICTIONAL_DEMO",
  remoteProviderConfigured: false,
  paidModelApiAllowed: false,
  downloadsAllowed: false,
  subscriptionRequiredByDemo: false,
  perRequestBillingConfigured: false,
  cloudServerConfigurationAutomaticallyVerified: false,
  hardwareAndElectricityCostsPossible: true,
});

export function checkFictionalOfflineGate({
  enabled = false,
  fictionalOnlyAcknowledged = false,
  offlineOnlyAcknowledged = false,
} = {}) {
  const approved = enabled === true
    && fictionalOnlyAcknowledged === true
    && offlineOnlyAcknowledged === true;
  return Object.freeze({
    status: approved ? "ESSAI_LOCAL_EXPLICITEMENT_AUTORISE" : "ESSAI_LOCAL_BLOQUE",
    permitted: approved,
    localOnlyAttested: offlineOnlyAcknowledged === true,
    cloudServerConfigurationVerified: false,
    paidModelApiAllowed: false,
    perRequestBillingConfigured: false,
  });
}
