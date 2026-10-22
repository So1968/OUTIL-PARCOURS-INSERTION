// Contrats d'intégration : aucun appel réseau, aucun transfert, aucune clé dans le dépôt.
// L'activation exigera un serveur privé, une autorisation ARTAG et celle du service.
export const SYSTEMS = Object.freeze({
  INSERTIS: "INSERTIS",
  MON_SUIVI_SOCIAL: "MON_SUIVI_SOCIAL",
  OUTLOOK: "OUTLOOK",
  ONEDRIVE: "ONEDRIVE",
});

export const OPERATIONS = Object.freeze({
  PREPARE_TRACE: "PREPARE_TRACE",
  READ_CALENDAR: "READ_CALENDAR",
  WRITE_CALENDAR: "WRITE_CALENDAR",
  LINK_DOCUMENT: "LINK_DOCUMENT",
  READ_CASE: "READ_CASE",
  WRITE_CASE: "WRITE_CASE",
});

const EXPECTED_OPERATIONS = Object.freeze({
  [SYSTEMS.INSERTIS]: new Set([OPERATIONS.PREPARE_TRACE, OPERATIONS.READ_CASE, OPERATIONS.WRITE_CASE]),
  [SYSTEMS.MON_SUIVI_SOCIAL]: new Set([OPERATIONS.PREPARE_TRACE, OPERATIONS.READ_CASE, OPERATIONS.WRITE_CASE]),
  [SYSTEMS.OUTLOOK]: new Set([OPERATIONS.READ_CALENDAR, OPERATIONS.WRITE_CALENDAR]),
  [SYSTEMS.ONEDRIVE]: new Set([OPERATIONS.LINK_DOCUMENT]),
});

export class ExternalIntegrationDisabled extends Error {
  constructor() {
    super("INTEGRATION_NON_ACTIVEE");
    this.name = "ExternalIntegrationDisabled";
  }
}

export class IntegrationApprovalMissing extends Error {
  constructor() {
    super("AUTORISATIONS_INCOMPLETES");
    this.name = "IntegrationApprovalMissing";
  }
}

export class UnsupportedIntegrationOperation extends Error {
  constructor() {
    super("OPERATION_NON_DOCUMENTEE");
    this.name = "UnsupportedIntegrationOperation";
  }
}

/**
 * Garde-fou de préparation des intégrations, indépendant du navigateur.
 * Le simple drapeau `enabled` n'autorise PAS un transfert de données.
 *
 * Les approbations ne doivent être chargées que d'un registre institutionnel
 * serveur, pas d'un corps JSON contrôlable par l'utilisateur.
 */
export function assertIntegrationApproved({
  system, operation, config, now = new Date(),
} = {}) {
  if (!Object.values(SYSTEMS).includes(system)
      || !EXPECTED_OPERATIONS[system]?.has(operation)) {
    throw new UnsupportedIntegrationOperation();
  }
  if (config?.enabled !== true) {
    throw new ExternalIntegrationDisabled();
  }
  if (config.system !== system
      || config.approvedByArtag !== true
      || config.approvedByProvider !== true
      || config.securityReviewPassed !== true
      || typeof config.legalBasisRef !== "string"
      || !config.legalBasisRef.trim()
      || typeof config.validUntil !== "string"
      || !Number.isFinite(new Date(config.validUntil).getTime())
      || new Date(config.validUntil) <= now
      || !Array.isArray(config.allowedOperations)
      || !config.allowedOperations.includes(operation)) {
    throw new IntegrationApprovalMissing();
  }
  return true;
}

/**
 * Tous les connecteurs restent des coquilles non opérationnelles. Même
 * une configuration simulant une approbation complète ne transmet rien.
 */
export async function invokeExternalIntegration(_request) {
  throw new ExternalIntegrationDisabled();
}
