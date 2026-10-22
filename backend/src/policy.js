// Contrat de décision côté serveur : ces rôles ne proviennent jamais du navigateur.
// Aucun accès individuel n'est accordé par le seul intitulé de rôle.
export const ROLES = Object.freeze({
  REFERENTE: "REFERENTE",
  APPUI_TNS: "APPUI_TNS",
  ACCUEIL: "ACCUEIL",
  RELAIS_LOGEMENT: "RELAIS_LOGEMENT",
  DIRECTION: "DIRECTION",
  GOUVERNANCE: "GOUVERNANCE",
  ADMIN_TECHNIQUE: "ADMIN_TECHNIQUE",
  DEMONSTRATION: "DEMONSTRATION",
});

export const CAPABILITIES = Object.freeze({
  SHARED_READ: "shared:read",
  SHARED_WRITE: "shared:write",
  TNS_READ: "tns:read",
  TNS_WRITE: "tns:write",
  RESERVED_READ: "reserved:read",
  RESERVED_WRITE: "reserved:write",
});

const INDIVIDUAL_ACCESS_ROLES = new Set([
  ROLES.REFERENTE, ROLES.APPUI_TNS, ROLES.ACCUEIL,
  ROLES.RELAIS_LOGEMENT, ROLES.DIRECTION,
]);

const CAPABILITIES_ALLOWED_BY_ROLE = Object.freeze({
  [ROLES.REFERENTE]: new Set(Object.values(CAPABILITIES)),
  [ROLES.APPUI_TNS]: new Set([CAPABILITIES.TNS_READ, CAPABILITIES.TNS_WRITE, CAPABILITIES.SHARED_READ]),
  [ROLES.ACCUEIL]: new Set([CAPABILITIES.SHARED_READ]),
  [ROLES.RELAIS_LOGEMENT]: new Set([CAPABILITIES.SHARED_READ]),
  [ROLES.DIRECTION]: new Set([CAPABILITIES.SHARED_READ]),
});

function hasValidIdentity(actor) {
  return Boolean(actor && actor.enabled === true
    && typeof actor.id === "string" && actor.id.trim()
    && typeof actor.role === "string"
    && INDIVIDUAL_ACCESS_ROLES.has(actor.role));
}

function eligibleAssignment(actor, dossier, scope) {
  if (!Array.isArray(dossier.assignments)) return false;
  return dossier.assignments.some((assignment) =>
    assignment.userId === actor.id
      && assignment.capability === scope
      && assignment.active === true);
}

function validTemporaryGrant(actor, dossier, scope, now) {
  if (scope !== CAPABILITIES.SHARED_READ) return false;
  if (!Array.isArray(dossier.grants)) return false;
  const timestamp = now.getTime();
  if (!Number.isFinite(timestamp)) return false;
  return dossier.grants.some((grant) => {
    if (grant.userId !== actor.id || grant.capability !== scope
      || grant.revokedAt || !grant.reason?.trim()
      || typeof grant.approvedBy !== "string" || !grant.approvedBy.trim()
      || grant.approvedBy === actor.id) return false;
    const from = new Date(grant.startsAt).getTime();
    const to = new Date(grant.expiresAt).getTime();
    return Number.isFinite(from) && Number.isFinite(to) && from <= timestamp && timestamp < to;
  });
}

/**
 * Pré-requis à toute route future : actor provient d'une session vérifiée côté serveur,
 * dossier est chargé depuis PostgreSQL (affectations et accès vérifiés, non fournis par le client).
 * Aucun rôle ne donne à lui seul un accès au dossier.
 */
export function canAccessCase({ actor, dossier, capability, noteAuthorId, now = new Date() } = {}) {
  if (!hasValidIdentity(actor) || !dossier?.id || !Object.values(CAPABILITIES).includes(capability)) {
    return false;
  }
  if (!CAPABILITIES_ALLOWED_BY_ROLE[actor.role]?.has(capability)) return false;

  const isReferent = actor.role === ROLES.REFERENTE && dossier.referentId === actor.id;
  const isAssigned = eligibleAssignment(actor, dossier, capability);
  const hasGrant = validTemporaryGrant(actor, dossier, capability, now);

  if (capability === CAPABILITIES.RESERVED_READ || capability === CAPABILITIES.RESERVED_WRITE) {
    // Même la direction et l'administrateur technique ne peuvent pas lire les notes d'autrui.
    return actor.role === ROLES.REFERENTE
      && noteAuthorId === actor.id
      && (isReferent || isAssigned);
  }

  // La direction ne peut pas élargir son accès par une affectation
  // ordinaire : seul un accès ponctuel, motivé et approuvé est recevable.
  if (actor.role === ROLES.DIRECTION) {
    return capability === CAPABILITIES.SHARED_READ && hasGrant;
  }

  // L'appui TNS reste sur ses seuls dossiers et seuls champs explicitement affectés.
  if (actor.role === ROLES.APPUI_TNS && capability === CAPABILITIES.SHARED_READ) {
    return isAssigned;
  }

  return isReferent || isAssigned || hasGrant;
}

// Indicateurs agrégés uniquement, indépendants des dossiers individuels.
// La suppression des identifiants doit être garantie par le service de calcul.
export function canReadAggregates(actor) {
  return Boolean(actor?.enabled === true && typeof actor.id === "string" && actor.id.trim()
    && [ROLES.DIRECTION, ROLES.GOUVERNANCE].includes(actor.role));
}
