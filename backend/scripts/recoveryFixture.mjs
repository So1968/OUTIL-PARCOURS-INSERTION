import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";

// JAMAIS de sauvegarde de production : uniquement la base éphémère GitHub CI.
// Ce programme ne lit ni comptes ni secrets institutionnels ; il vérifie une
// empreinte de quelques objets strictement fictifs.
export function ensureEphemeralRecoveryTarget(env = process.env) {
  if (env.ARTAG_DB_INTEGRATION_TEST !== "1" ||
      env.ARTAG_RECOVERY_REHEARSAL !== "1" ||
      env.NODE_ENV === "production") {
    throw new Error("RECETTE_EPHEMERE_REQUISE");
  }
  let url;
  try { url = new URL(env.DATABASE_URL); }
  catch { throw new Error("CIBLE_RECETTE_INVALIDE"); }
  if (!["postgresql:", "postgres:"].includes(url.protocol) ||
      !["127.0.0.1", "localhost"].includes(url.hostname) ||
      url.port !== "5432" ||
      !["/artag_ci_demo", "/artag_ci_restore"].includes(url.pathname) ||
      url.searchParams.get("schema") !== "public") {
    throw new Error("CIBLE_RECETTE_INVALIDE");
  }
  return url.pathname.slice(1);
}

const userId = "00000000-0000-4000-8000-000000000047";
const taskIds = [
  "00000000-0000-4000-8000-000000000048",
  "00000000-0000-4000-8000-000000000049",
];
const eventRequestId = "00000000-0000-4000-8000-000000000050";
const caseId = "00000000-0000-4000-8000-000000000051";

async function seed(db, env) {
  if (ensureEphemeralRecoveryTarget(env) !== "artag_ci_demo") {
    throw new Error("SEMIS_AUTORISE_SUR_BASE_ORIGINE_UNIQUEMENT");
  }
  // Le schéma est déployé par les migrations dans GitHub Actions, jamais ici.
  await db.userAccount.create({
    data: {
      id: userId, email: "recovery-fixture" + String.fromCharCode(64) + "example.org",
      role: "APPUI_TNS", enabled: true,
    },
  });
  await db.workTask.createMany({ data: [
    {
      id: taskIds[0], ownerId: userId, title: "Action de recette fictive",
      dueDate: new Date("2026-10-28T00:00:00Z"),
      reminderDaysBefore: 2, estimatedMinutes: 20, status: "A_FAIRE",
    },
    {
      id: taskIds[1], ownerId: userId, title: "Action terminée fictive",
      dueDate: new Date("2026-10-22T00:00:00Z"),
      reminderDaysBefore: 1, estimatedMinutes: 15, status: "FAIT",
    },
  ] });
  await db.workEvent.create({
    data: {
      ownerId: userId, requestId: eventRequestId,
      day: new Date("2026-10-23T00:00:00Z"),
      kind: "APPEL", state: "EFFECTUE", minutes: 10,
    },
  });
  await db.caseFile.create({ data: { id: caseId, artagReference: "ARTAG-RECETTE-FICTIVE" } });
  await db.auditEvent.create({
    data: { actorId: userId, eventType: "RECOVERY_FIXTURE", purpose: "Recette fictive de restauration" },
  });
}

async function snapshot(db) {
  const [user, tasks, events, auditCount, caseFile] = await Promise.all([
    db.userAccount.findUnique({
      where: { id: userId }, select: { id: true, role: true, enabled: true },
    }),
    db.workTask.findMany({
      where: { ownerId: userId },
      select: {
        id: true, title: true, dueDate: true, estimatedMinutes: true,
        reminderDaysBefore: true, status: true,
      },
      orderBy: { id: "asc" },
    }),
    db.workEvent.findMany({
      where: { ownerId: userId },
      select: { requestId: true, day: true, kind: true, state: true, minutes: true },
      orderBy: { requestId: "asc" },
    }),
    db.auditEvent.count({
      where: { actorId: userId, eventType: "RECOVERY_FIXTURE" },
    }),
    db.caseFile.findUnique({ where: { id: caseId }, select: { id: true, artagReference: true } }),
  ]);
  if (!user?.enabled || user.role !== "APPUI_TNS" ||
      tasks.length !== 2 || events.length !== 1 || auditCount !== 1 ||
      tasks[0].id !== taskIds[0] || tasks[1].id !== taskIds[1] ||
      events[0].requestId !== eventRequestId || caseFile?.artagReference !== "ARTAG-RECETTE-FICTIVE") {
    throw new Error("DONNEES_FICTIVES_ABSENTES_OU_CORROMPUES");
  }
  return { user, tasks, events, auditCount, caseFile };
}

export function fingerprint(data) {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex");
}

async function main() {
  const target = ensureEphemeralRecoveryTarget(process.env);
  const action = process.argv[2];
  if (!["seed", "checksum"].includes(action) || process.argv.length !== 3) {
    throw new Error("ACTION_RECETTE_INVALIDE");
  }
  if (action === "seed" && target !== "artag_ci_demo") {
    throw new Error("SEMIS_AUTORISE_SUR_BASE_ORIGINE_UNIQUEMENT");
  }
  const db = new PrismaClient();
  try {
    await db.$connect();
    if (action === "seed") await seed(db, process.env);
    const result = fingerprint(await snapshot(db));
    // Seulement une empreinte de données fictives. Jamais d'URL SQL ou de contenu.
    process.stdout.write(result + "\n");
  } finally {
    await db.$disconnect();
  }
}
main().catch(() => {
  // Ne pas afficher l'URL SQL ni les valeurs Prisma en cas d'erreur.
  process.stderr.write("Échec de la recette de récupération fictive.\n");
  process.exitCode = 1;
});
