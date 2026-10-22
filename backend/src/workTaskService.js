import { resolveSessionUserId } from "./sessions.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const ROLES = new Set(["REFERENTE", "APPUI_TNS", "ACCUEIL", "RELAIS_LOGEMENT"]);
const STATUSES = new Set(["A_FAIRE", "EN_COURS", "EN_ATTENTE", "FAIT"]);
const FIELDS = new Set(["title", "dueDate", "reminderDaysBefore", "estimatedMinutes", "status"]);

export class WorkTaskAccessDenied extends Error {
  constructor() { super("TACHE_INDISPONIBLE"); this.name = "WorkTaskAccessDenied"; }
}
export class WorkTaskInvalid extends Error {
  constructor() { super("TACHE_INVALIDE"); this.name = "WorkTaskInvalid"; }
}
export class WorkTaskConflict extends Error {
  constructor() { super("TACHE_MODIFIEE"); this.name = "WorkTaskConflict"; }
}

function parseDay(value) {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || !DAY.test(value)) throw new WorkTaskInvalid();
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new WorkTaskInvalid();
  }
  return parsed;
}

function validFields(input, { create = false } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)
    || Object.keys(input).some(key => !FIELDS.has(key))) throw new WorkTaskInvalid();
  if (create && !Object.hasOwn(input, "title")) throw new WorkTaskInvalid();
  if (!create && Object.keys(input).length === 0) throw new WorkTaskInvalid();
  const data = {};
  if (Object.hasOwn(input, "title")) {
    if (typeof input.title !== "string" || !input.title.trim() || input.title.length > 200) {
      throw new WorkTaskInvalid();
    }
    data.title = input.title.trim();
  }
  if (Object.hasOwn(input, "dueDate")) data.dueDate = parseDay(input.dueDate);
  if (Object.hasOwn(input, "reminderDaysBefore")) {
    if (![0, 1, 2, 7].includes(input.reminderDaysBefore)) throw new WorkTaskInvalid();
    data.reminderDaysBefore = input.reminderDaysBefore;
  }
  if (Object.hasOwn(input, "estimatedMinutes")) {
    const n = input.estimatedMinutes;
    if (n !== null && (!Number.isInteger(n) || n < 1 || n > 600)) throw new WorkTaskInvalid();
    data.estimatedMinutes = n;
  }
  if (Object.hasOwn(input, "status")) {
    if (!STATUSES.has(input.status)) throw new WorkTaskInvalid();
    data.status = input.status;
  }
  return data;
}

const taskSelect = {
  id: true, title: true, dueDate: true, reminderDaysBefore: true,
  estimatedMinutes: true, status: true, version: true, updatedAt: true,
};
function exposed(task) {
  return {
    ...task,
    dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null,
  };
}

async function getOwner(db, cookieHeader) {
  if (!db?.$transaction || !db?.webSession || !db?.userAccount || !db?.workTask) {
    throw new WorkTaskAccessDenied();
  }
  const userId = await resolveSessionUserId({ db, cookieHeader });
  // La clé provient d'une session PostgreSQL liée au compte, pas d'une entrée
  // cliente. Ne pas supposer un format externe pour l'ID institutionnel.
  if (typeof userId !== "string" || !UUID.test(userId)) throw new WorkTaskAccessDenied();
  return userId;
}

async function authorizedActor(tx, ownerId) {
  const actor = await tx.userAccount.findUnique({
    where: { id: ownerId }, select: { id: true, role: true, enabled: true },
  });
  if (!actor?.enabled || !ROLES.has(actor.role)) throw new WorkTaskAccessDenied();
  return actor;
}

/** Liste strictement personnelle, paginée. Jamais de tâches d'un autre compte. */
export async function listOwnTasks({ db, cookieHeader, offset = 0 } = {}) {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000) throw new WorkTaskInvalid();
  const ownerId = await getOwner(db, cookieHeader);
  return db.$transaction(async tx => {
    await authorizedActor(tx, ownerId);
    const rows = await tx.workTask.findMany({
      where: { ownerId }, select: taskSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: offset, take: 101,
    });
    await tx.auditEvent.create({
      data: { actorId: ownerId, eventType: "WORK_TASK_LIST_READ", purpose: "Lecture de la liste personnelle de tâches" },
    });
    return { tasks: rows.slice(0, 100).map(exposed), nextOffset: rows.length > 100 ? offset + 100 : null };
  }, { isolationLevel: "Serializable" });
}

export async function createOwnTask({ db, cookieHeader, input } = {}) {
  const data = validFields(input, { create: true });
  const ownerId = await getOwner(db, cookieHeader);
  return db.$transaction(async tx => {
    await authorizedActor(tx, ownerId);
    const task = await tx.workTask.create({ data: { ...data, ownerId }, select: taskSelect });
    await tx.auditEvent.create({
      data: { actorId: ownerId, eventType: "WORK_TASK_CREATED", purpose: "Création d'une tâche personnelle" },
    });
    return exposed(task);
  }, { isolationLevel: "Serializable" });
}

export async function updateOwnTask({ db, cookieHeader, taskId, expectedVersion, changes } = {}) {
  if (typeof taskId !== "string" || !UUID.test(taskId)) throw new WorkTaskAccessDenied();
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0) throw new WorkTaskInvalid();
  const data = validFields(changes);
  const ownerId = await getOwner(db, cookieHeader);
  return db.$transaction(async tx => {
    await authorizedActor(tx, ownerId);
    const current = await tx.workTask.findFirst({
      where: { id: taskId, ownerId }, select: { id: true, version: true },
    });
    if (!current) throw new WorkTaskAccessDenied();
    if (current.version !== expectedVersion) throw new WorkTaskConflict();
    const result = await tx.workTask.updateMany({
      where: { id: taskId, ownerId, version: expectedVersion },
      data: { ...data, version: { increment: 1 } },
    });
    if (result.count !== 1) throw new WorkTaskConflict();
    const task = await tx.workTask.findFirst({
      where: { id: taskId, ownerId }, select: taskSelect,
    });
    if (!task) throw new WorkTaskAccessDenied();
    await tx.auditEvent.create({
      data: { actorId: ownerId, eventType: "WORK_TASK_UPDATED", purpose: "Mise à jour d'une tâche personnelle" },
    });
    return exposed(task);
  }, { isolationLevel: "Serializable" });
}
