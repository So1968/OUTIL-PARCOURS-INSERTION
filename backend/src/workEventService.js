import { resolveSessionUserId } from "./sessions.js";
import { professionalDay } from "./workTaskService.js";

// Enregistrement minimal pour mesurer la charge, pas un dossier usager.
// Aucun champ de note, nom, identifiant Insertis ou description libre.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TYPES = new Set(["IMPREVU", "APPEL", "RENDEZ_VOUS", "ENTRETIEN", "RELANCE", "ADMINISTRATIF"]);
const STATES = new Set(["PREVU", "EFFECTUE", "ANNULE"]);
const ROLES = new Set(["REFERENTE", "APPUI_TNS", "ACCUEIL", "RELAIS_LOGEMENT"]);

export class WorkEventDenied extends Error {
  constructor() { super("EVENEMENT_INDISPONIBLE"); this.name = "WorkEventDenied"; }
}
export class WorkEventInvalid extends Error {
  constructor() { super("EVENEMENT_INVALIDE"); this.name = "WorkEventInvalid"; }
}
export class WorkEventConflict extends Error {
  constructor() { super("EVENEMENT_MODIFIE"); this.name = "WorkEventConflict"; }
}

function dateOnly(day) {
  if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    throw new WorkEventInvalid();
  }
  const parsed = new Date(day + "T00:00:00.000Z");
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== day) {
    throw new WorkEventInvalid();
  }
  return parsed;
}
function validateMinutes(minutes) {
  if (!Number.isSafeInteger(minutes) || minutes < 1 || minutes > 600) {
    throw new WorkEventInvalid();
  }
  return minutes;
}
function selectEvent() {
  return {
    id: true, day: true, kind: true, state: true, minutes: true,
    version: true, updatedAt: true,
  };
}
function serialize(row) {
  return {
    ...row,
    day: row.day.toISOString().slice(0, 10),
  };
}
async function owner(db, cookieHeader) {
  if (!db?.$transaction || !db?.webSession || !db?.workEvent || !db?.userAccount) {
    throw new WorkEventDenied();
  }
  const id = await resolveSessionUserId({ db, cookieHeader });
  if (!UUID.test(id || "")) throw new WorkEventDenied();
  return id;
}
async function authorize(tx, id) {
  const user = await tx.userAccount.findUnique({
    where: { id }, select: { enabled: true, role: true },
  });
  if (!user?.enabled || !ROLES.has(user.role)) throw new WorkEventDenied();
}
function createFields(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)
    || Object.keys(input).length !== 5
    || !["requestId", "day", "kind", "state", "minutes"]
      .every(key => Object.hasOwn(input, key))) throw new WorkEventInvalid();
  if (!UUID.test(input.requestId) || !TYPES.has(input.kind) || !STATES.has(input.state)
    || input.state === "ANNULE") throw new WorkEventInvalid();
  return {
    requestId: input.requestId,
    day: dateOnly(input.day),
    kind: input.kind, state: input.state,
    minutes: validateMinutes(input.minutes),
  };
}
function updateFields(changes) {
  if (!changes || typeof changes !== "object" || Array.isArray(changes)
    || !Object.keys(changes).length
    || Object.keys(changes).some(k => !["state", "minutes"].includes(k))) {
    throw new WorkEventInvalid();
  }
  const fields = {};
  if (Object.hasOwn(changes, "state")) {
    if (!STATES.has(changes.state)) throw new WorkEventInvalid();
    fields.state = changes.state;
  }
  if (Object.hasOwn(changes, "minutes")) fields.minutes = validateMinutes(changes.minutes);
  return fields;
}

export async function listOwnEvents({ db, cookieHeader, day, offset = 0, now = new Date() } = {}) {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000) {
    throw new WorkEventInvalid();
  }
  const date = dateOnly(day ?? professionalDay(now));
  const ownerId = await owner(db, cookieHeader);
  return db.$transaction(async tx => {
    await authorize(tx, ownerId);
    const rows = await tx.workEvent.findMany({
      where: { ownerId, day: date },
      select: selectEvent(),
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      skip: offset, take: 101,
    });
    await tx.auditEvent.create({ data: {
      actorId: ownerId,
      eventType: "WORK_EVENT_DAY_READ",
      purpose: "Consultation des repères de charge personnels",
    } });
    return {
      day: date.toISOString().slice(0, 10),
      events: rows.slice(0, 100).map(serialize),
      nextOffset: rows.length > 100 ? offset + 100 : null,
    };
  }, { isolationLevel: "Serializable" });
}

export async function createOwnEvent({ db, cookieHeader, input } = {}) {
  const data = createFields(input);
  const ownerId = await owner(db, cookieHeader);
  return db.$transaction(async tx => {
    await authorize(tx, ownerId);
    // UNIQUE(ownerId, requestId) : doublon réseau retourné sans créer une
    // nouvelle activité ni une deuxième charge dans le plan quotidien.
    const result = await tx.workEvent.createMany({
      data: [{ ...data, ownerId }], skipDuplicates: true,
    });
    const row = await tx.workEvent.findUnique({
      where: { ownerId_requestId: { ownerId, requestId: data.requestId } },
      select: { ...selectEvent(), requestId: true },
    });
    if (!row) throw new WorkEventConflict();
    if (row.kind !== data.kind || row.state !== data.state
      || row.minutes !== data.minutes || row.day.getTime() !== data.day.getTime()) {
      if (result.count === 0) throw new WorkEventConflict();
    }
    await tx.auditEvent.create({ data: {
      actorId: ownerId,
      eventType: result.count === 1 ? "WORK_EVENT_CREATED" : "WORK_EVENT_REPLAYED",
      purpose: "Saisie express personnelle sans information nominative",
    } });
    const { requestId: _unused, ...publicEvent } = row;
    return { event: serialize(publicEvent), created: result.count === 1 };
  }, { isolationLevel: "Serializable" });
}

export async function updateOwnEvent({
  db, cookieHeader, eventId, expectedVersion, changes,
} = {}) {
  if (typeof eventId !== "string" || !UUID.test(eventId)) throw new WorkEventDenied();
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0) {
    throw new WorkEventInvalid();
  }
  const data = updateFields(changes);
  const ownerId = await owner(db, cookieHeader);
  return db.$transaction(async tx => {
    await authorize(tx, ownerId);
    const current = await tx.workEvent.findFirst({
      where: { id: eventId, ownerId }, select: { version: true, state: true },
    });
    if (!current) throw new WorkEventDenied();
    if (current.version !== expectedVersion) throw new WorkEventConflict();
    if (current.state === "ANNULE" && data.state !== "ANNULE") {
      throw new WorkEventConflict();
    }
    const changed = await tx.workEvent.updateMany({
      where: { id: eventId, ownerId, version: expectedVersion },
      data: { ...data, version: { increment: 1 } },
    });
    if (changed.count !== 1) throw new WorkEventConflict();
    const row = await tx.workEvent.findFirst({
      where: { id: eventId, ownerId }, select: selectEvent(),
    });
    if (!row) throw new WorkEventDenied();
    await tx.auditEvent.create({ data: {
      actorId: ownerId,
      eventType: "WORK_EVENT_UPDATED",
      purpose: "Correction ou annulation d'un repère de charge",
    } });
    return serialize(row);
  }, { isolationLevel: "Serializable" });
}
