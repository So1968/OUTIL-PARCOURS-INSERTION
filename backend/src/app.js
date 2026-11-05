import express from "express";
import helmet from "helmet";
import { listWritableCases, InvalidCaseDirectoryQuery, CaseDirectoryChanged } from "./caseDirectoryService.js";
import {
  readCaseReference, updateCaseReference, InvalidCaseReference,
  CaseReferenceUnavailable, CaseReferenceHistoryUnavailable,
} from "./caseReferenceService.js";
import { readCaseOverview, CaseAccessDenied, SecurityProviderUnavailable } from "./caseAccessService.js";
import { resolveSessionUserId } from "./sessions.js";
import { createAuthRouter } from "./authRouter.js";
import { issueCsrfToken, validCsrf } from "./csrf.js";
import {
  createSharedNote, correctSharedNote, validateSharedNote, readSharedNoteHistory, readSharedNotes,
  DossierVersionConflict, InvalidSharedNote, SharedNoteHistoryUnavailable,
} from "./sharedNoteService.js";
import { listOwnTasks, listOwnReminders, createOwnTask, updateOwnTask, WorkTaskAccessDenied, WorkTaskInvalid, WorkTaskConflict } from "./workTaskService.js";
import { listOwnEvents, createOwnEvent, updateOwnEvent, WorkEventDenied, WorkEventInvalid, WorkEventConflict } from "./workEventService.js";

export function createApp({
  privateDb = null,
  oidc = null,
  csrfSecret = null,
  enableSharedWrites = false,
  enableWorkTasks = false,
  clock = () => new Date(),
} = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.disable("etag");
  app.use(helmet());
  app.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });

  app.get("/healthz", (_req, res) => {
    res.status(200).json({ status: "ok", service: "artag-api-socle" });
  });

  // Readiness distincte de la vie du processus : ne déclarer le service
  // professionnel prêt que si PostgreSQL répond réellement.
  app.get("/readyz", async (_req, res) => {
    if (!privateDb?.$queryRaw) {
      return res.status(503).json({ status: "unavailable" });
    }
    try {
      await privateDb.$queryRaw`SELECT 1`;
      return res.status(200).json({ status: "ready" });
    } catch {
      return res.status(503).json({ status: "unavailable" });
    }
  });

  if (privateDb && oidc) {
    app.use("/auth", createAuthRouter({ db: privateDb, ...oidc }));
  }

  // Route de lecture contrôlée : compte actif, affectation dossier, audit.
  // Pas de données personnelles ni de notes dans cette réponse.
  if (privateDb) {
    app.get("/api/dossiers/:caseId/overview", async (req, res) => {
      try {
        const overview = await readCaseOverview({
          db: privateDb,
          caseId: req.params.caseId,
          session: req.headers.cookie,
          resolveVerifiedSubject: (cookieHeader) => resolveSessionUserId({
            db: privateDb, cookieHeader,
          }),
        });
        return res.status(200).json(overview);
      } catch (error) {
        if (error instanceof CaseAccessDenied) {
          return res.status(404).json({ error: "DOSSIER_INDISPONIBLE" });
        }
        if (error instanceof SecurityProviderUnavailable) {
          return res.status(503).json({ error: "AUTHENTIFICATION_SERVEUR_NON_CONFIGUREE" });
        }
        return res.status(503).json({ error: "SERVICE_INDISPONIBLE" });
      }
    });
  }

  // Les écritures ne s'activent JAMAIS sur la seule présence de la base :
  // il faut un SSO configuré, une origine HTTPS fixe, un secret CSRF robuste
  // et l'activation explicite du module dans la configuration du serveur.
  const canWrite = Boolean(privateDb && oidc && enableSharedWrites
    && typeof csrfSecret === "string" && csrfSecret.length >= 32
    && typeof oidc.origin === "string"
    && oidc.origin.startsWith("https://"));

  const canUseTasks = Boolean(privateDb && oidc && enableWorkTasks
    && typeof csrfSecret === "string" && csrfSecret.length >= 32
    && typeof oidc.origin === "string" && oidc.origin.startsWith("https://"));

  if (canWrite || canUseTasks) {
    app.get("/auth/csrf", async (req, res) => {
      try {
        const userId = await resolveSessionUserId({
          db: privateDb, cookieHeader: req.headers.cookie,
        });
        if (!userId) return res.status(401).json({ error: "SESSION_REQUISE" });
        const token = issueCsrfToken(csrfSecret, req.headers.cookie);
        if (!token) return res.status(401).json({ error: "SESSION_REQUISE" });
        return res.status(200).json({ token });
      } catch {
        return res.status(503).json({ error: "SERVICE_INDISPONIBLE" });
      }
    });

  }

  if (canWrite) {
    const handleReferenceError = (error, res) => {
      if (error instanceof CaseAccessDenied) return res.status(404).json({ error: "DOSSIER_INDISPONIBLE" });
      if (error instanceof DossierVersionConflict) return res.status(409).json({ error: "DOSSIER_MODIFIE_ENTRE_TEMPS" });
      if (error instanceof InvalidCaseReference) return res.status(422).json({ error: "REFERENCE_INVALIDE" });
      if (error instanceof CaseReferenceUnavailable) return res.status(409).json({ error: "REFERENCE_INDISPONIBLE" });
      if (error instanceof CaseReferenceHistoryUnavailable) return res.status(409).json({ error: "HISTORIQUE_REFERENCE_INDISPONIBLE" });
      return res.status(503).json({ error: "SERVICE_INDISPONIBLE" });
    };
    const referencePath = "/api/dossiers/:caseId/reference-artag";
    app.get(referencePath, async (req, res) => {
      try {
        if (Object.keys(req.query).some(key => key !== "beforeVersion")
          || (req.query.beforeVersion !== undefined && (typeof req.query.beforeVersion !== "string"
            || !/^[1-9][0-9]{0,9}$/.test(req.query.beforeVersion)))) throw new InvalidCaseReference();
        return res.status(200).json(await readCaseReference({
          db: privateDb, cookieHeader: req.headers.cookie, caseId: req.params.caseId,
          beforeVersion: req.query.beforeVersion === undefined ? undefined : Number(req.query.beforeVersion),
        }));
      } catch (error) { return handleReferenceError(error, res); }
    });
    app.patch(referencePath, express.json({ limit: "4kb", type: "application/json" }), async (req, res) => {
      if (!validCsrf({ secret: csrfSecret, cookieHeader: req.headers.cookie,
        csrfHeader: req.get("X-CSRF-Token"), origin: req.get("Origin"), allowedOrigin: oidc.origin })) {
        return res.status(403).json({ error: "CSRF_REFUSE" });
      }
      try {
        const keys = ["expectedVersion", "artagReference", "reason"];
        if (!req.body || Array.isArray(req.body) || Object.keys(req.body).length !== keys.length
          || !keys.every(key => Object.hasOwn(req.body, key)) || Object.keys(req.query).length) {
          throw new InvalidCaseReference();
        }
        return res.status(200).json(await updateCaseReference({
          db: privateDb, cookieHeader: req.headers.cookie, caseId: req.params.caseId,
          expectedVersion: req.body.expectedVersion, artagReference: req.body.artagReference, reason: req.body.reason,
        }));
      } catch (error) { return handleReferenceError(error, res); }
    });
    app.get("/api/mes-dossiers", async (req, res) => {
      try {
        if (Object.keys(req.query).some(key => key !== "before")) throw new InvalidCaseDirectoryQuery();
        return res.status(200).json(await listWritableCases({
          db: privateDb, cookieHeader: req.headers.cookie, before: req.query.before,
        }));
      } catch (error) {
        if (error instanceof CaseAccessDenied) return res.status(404).json({ error: "DOSSIER_INDISPONIBLE" });
        if (error instanceof InvalidCaseDirectoryQuery) return res.status(422).json({ error: "REQUETE_DOSSIERS_INVALIDE" });
        if (error instanceof CaseDirectoryChanged) return res.status(409).json({ error: "FILE_MODIFIEE_ENTRE_TEMPS" });
        return res.status(503).json({ error: "SERVICE_INDISPONIBLE" });
      }
    });
    const handleNoteError = (error, res) => {
      if (error instanceof CaseAccessDenied) {
        return res.status(404).json({ error: "DOSSIER_INDISPONIBLE" });
      }
      if (error instanceof DossierVersionConflict) {
        return res.status(409).json({ error: "DOSSIER_MODIFIE_ENTRE_TEMPS" });
      }
      if (error instanceof SharedNoteHistoryUnavailable) {
        return res.status(409).json({ error: "HISTORIQUE_NOTE_INDISPONIBLE" });
      }
      if (error instanceof InvalidSharedNote) {
        return res.status(422).json({ error: "NOTE_INVALIDE" });
      }
      return res.status(503).json({ error: "SERVICE_INDISPONIBLE" });
    };
    const noteMutation = (keys, operation, status = 200) => [
      // 4000 caractères peuvent dépasser 8 ko en JSON/UTF-8.
      express.json({ limit: "32kb", type: "application/json" }),
      async (req, res) => {
        if (!validCsrf({
          secret: csrfSecret,
          cookieHeader: req.headers.cookie,
          csrfHeader: req.get("X-CSRF-Token"),
          origin: req.get("Origin"),
          allowedOrigin: oidc.origin,
        })) {
          return res.status(403).json({ error: "CSRF_REFUSE" });
        }
        try {
          const bodyKeys = Object.keys(req.body || {});
          if (!req.body || Array.isArray(req.body) || bodyKeys.length !== keys.length
            || !keys.every(key => Object.hasOwn(req.body, key))) throw new InvalidSharedNote();
          const note = await operation({
            ...Object.fromEntries(keys.map(key => [key, req.body[key]])),
            db: privateDb, cookieHeader: req.headers.cookie,
            caseId: req.params.caseId, noteId: req.params.noteId,
          });
          return res.status(status).json(note);
        } catch (error) {
          return handleNoteError(error, res);
        }
      },
    ];
    const notesPath = "/api/dossiers/:caseId/notes-partagees";
    app.get(notesPath, async (req, res) => {
      try {
        if (Object.keys(req.query).some(key => key !== "offset")
          || (req.query.offset !== undefined && (typeof req.query.offset !== "string"
            || !/^(0|[1-9][0-9]{0,5})$/.test(req.query.offset)))) throw new InvalidSharedNote();
        return res.status(200).json(await readSharedNotes({
          db: privateDb, cookieHeader: req.headers.cookie, caseId: req.params.caseId,
          offset: req.query.offset === undefined ? 0 : Number(req.query.offset),
        }));
      } catch (error) {
        return handleNoteError(error, res);
      }
    });
    app.post(notesPath, ...noteMutation(["expectedVersion", "text"], createSharedNote, 201));
    app.patch(notesPath + "/:noteId",
      ...noteMutation(["expectedVersion", "text", "reason"], correctSharedNote));
    app.post(notesPath + "/:noteId/validation",
      ...noteMutation(["expectedVersion"], validateSharedNote));
    app.get(notesPath + "/:noteId/historique", async (req, res) => {
      try {
        if (Object.keys(req.query).some(key => key !== "beforeVersion")
          || (req.query.beforeVersion !== undefined && (typeof req.query.beforeVersion !== "string"
            || !/^[1-9][0-9]{0,9}$/.test(req.query.beforeVersion)))) throw new InvalidSharedNote();
        const history = await readSharedNoteHistory({
          db: privateDb, cookieHeader: req.headers.cookie,
          caseId: req.params.caseId, noteId: req.params.noteId,
          beforeVersion: req.query.beforeVersion === undefined ? undefined : Number(req.query.beforeVersion),
        });
        return res.status(200).json(history);
      } catch (error) {
        return handleNoteError(error, res);
      }
    });
  }

  // Tâches personnelles isolées : le serveur retrouve le propriétaire depuis
  // la session HttpOnly. Le corps de requête ne peut jamais choisir ownerId.
  if (canUseTasks) {
    const handleTaskError = (error, res) => {
      if (error instanceof WorkTaskAccessDenied) {
        return res.status(404).json({ error: "TACHE_INDISPONIBLE" });
      }
      if (error instanceof WorkTaskInvalid) {
        return res.status(422).json({ error: "TACHE_INVALIDE" });
      }
      if (error instanceof WorkTaskConflict) {
        return res.status(409).json({ error: "TACHE_MODIFIEE" });
      }
      return res.status(503).json({ error: "SERVICE_INDISPONIBLE" });
    };
    const csrfOk = req => validCsrf({
      secret: csrfSecret,
      cookieHeader: req.headers.cookie,
      csrfHeader: req.get("X-CSRF-Token"),
      origin: req.get("Origin"),
      allowedOrigin: oidc.origin,
    });

    // Le même verrou serveur, la même session et le même CSRF protègent
    // les repères de charge. Aucun champ nominatif n'est accepté.
    const handleEventError = (error, res) => {
      if (error instanceof WorkEventDenied) {
        return res.status(404).json({ error: "EVENEMENT_INDISPONIBLE" });
      }
      if (error instanceof WorkEventInvalid) {
        return res.status(422).json({ error: "EVENEMENT_INVALIDE" });
      }
      if (error instanceof WorkEventConflict) {
        return res.status(409).json({ error: "EVENEMENT_MODIFIE" });
      }
      return res.status(503).json({ error: "SERVICE_INDISPONIBLE" });
    };
    app.get("/api/mes-evenements", async (req, res) => {
      try {
        const { offset, day } = req.query;
        if (offset !== undefined && (typeof offset !== "string" || !/^\d{1,6}$/.test(offset))) {
          throw new WorkEventInvalid();
        }
        if (day !== undefined && typeof day !== "string") throw new WorkEventInvalid();
        const result = await listOwnEvents({
          db: privateDb, cookieHeader: req.headers.cookie, day,
          now: clock(), offset: offset ? Number(offset) : 0,
        });
        return res.status(200).json(result);
      } catch (error) {
        return handleEventError(error, res);
      }
    });
    app.post("/api/mes-evenements", express.json({ limit: "2kb", type: "application/json" }),
      async (req, res) => {
        if (!csrfOk(req)) return res.status(403).json({ error: "CSRF_REFUSE" });
        try {
          const result = await createOwnEvent({
            db: privateDb, cookieHeader: req.headers.cookie, input: req.body,
          });
          return res.status(result.created ? 201 : 200).json(result.event);
        } catch (error) {
          return handleEventError(error, res);
        }
      });
    app.patch("/api/mes-evenements/:eventId",
      express.json({ limit: "2kb", type: "application/json" }),
      async (req, res) => {
        if (!csrfOk(req)) return res.status(403).json({ error: "CSRF_REFUSE" });
        try {
          const keys = Object.keys(req.body || {});
          if (keys.length !== 2 || !keys.includes("expectedVersion") || !keys.includes("changes")) {
            throw new WorkEventInvalid();
          }
          const event = await updateOwnEvent({
            db: privateDb, cookieHeader: req.headers.cookie,
            eventId: req.params.eventId, expectedVersion: req.body.expectedVersion,
            changes: req.body.changes,
          });
          return res.status(200).json(event);
        } catch (error) {
          return handleEventError(error, res);
        }
      });

    app.get("/api/mes-taches", async (req, res) => {
      try {
        const offsetText = req.query.offset;
        if (offsetText !== undefined && (typeof offsetText !== "string" || !/^\d{1,6}$/.test(offsetText))) {
          return res.status(422).json({ error: "TACHE_INVALIDE" });
        }
        const result = await listOwnTasks({
          db: privateDb, cookieHeader: req.headers.cookie,
          offset: offsetText ? Number(offsetText) : 0,
        });
        return res.status(200).json(result);
      } catch (error) {
        return handleTaskError(error, res);
      }
    });

    // Rappel privé à consulter dans le bureau professionnel, jamais une
    // notification Outlook ou un transfert à un fournisseur externe.
    app.get("/api/mes-rappels", async (req, res) => {
      try {
        const offsetText = req.query.offset;
        if (offsetText !== undefined && (typeof offsetText !== "string" || !/^\d{1,6}$/.test(offsetText))) {
          return res.status(422).json({ error: "TACHE_INVALIDE" });
        }
        const result = await listOwnReminders({
          db: privateDb, cookieHeader: req.headers.cookie,
          now: clock(), offset: offsetText ? Number(offsetText) : 0,
        });
        return res.status(200).json(result);
      } catch (error) {
        return handleTaskError(error, res);
      }
    });

    app.post("/api/mes-taches",
      express.json({ limit: "4kb", type: "application/json" }),
      async (req, res) => {
        if (!csrfOk(req)) return res.status(403).json({ error: "CSRF_REFUSE" });
        try {
          const task = await createOwnTask({
            db: privateDb, cookieHeader: req.headers.cookie, input: req.body,
          });
          return res.status(201).json(task);
        } catch (error) {
          return handleTaskError(error, res);
        }
      });

    app.patch("/api/mes-taches/:taskId",
      express.json({ limit: "4kb", type: "application/json" }),
      async (req, res) => {
        if (!csrfOk(req)) return res.status(403).json({ error: "CSRF_REFUSE" });
        try {
          const keys = Object.keys(req.body || {});
          if (keys.length !== 2 || !keys.includes("expectedVersion") || !keys.includes("changes")) {
            throw new WorkTaskInvalid();
          }
          const task = await updateOwnTask({
            db: privateDb, cookieHeader: req.headers.cookie,
            taskId: req.params.taskId, expectedVersion: req.body.expectedVersion,
            changes: req.body.changes,
          });
          return res.status(200).json(task);
        } catch (error) {
          return handleTaskError(error, res);
        }
      });
  }

  // Les autres routes métier, notes réservées et intégrations restent fermées.
  app.use("/api", (_req, res) => {
    res.status(503).json({ error: "METIER_NON_ACTIVE" });
  });
  app.use((_req, res) => res.status(404).json({ error: "NOT_FOUND" }));
  app.use((_error, _req, res, _next) => {
    res.status(400).json({ error: "REQUETE_INVALIDE" });
  });
  return app;
}
