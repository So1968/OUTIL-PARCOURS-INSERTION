import express from "express";
import helmet from "helmet";
import { readCaseOverview, CaseAccessDenied, SecurityProviderUnavailable } from "./caseAccessService.js";
import { resolveSessionUserId } from "./sessions.js";
import { createAuthRouter } from "./authRouter.js";
import { issueCsrfToken, validCsrf } from "./csrf.js";
import { createSharedNote, DossierVersionConflict, InvalidSharedNote } from "./sharedNoteService.js";
import { listOwnTasks, createOwnTask, updateOwnTask, WorkTaskAccessDenied, WorkTaskInvalid, WorkTaskConflict } from "./workTaskService.js";

export function createApp({
  privateDb = null,
  oidc = null,
  csrfSecret = null,
  enableSharedWrites = false,
  enableWorkTasks = false,
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
    app.post("/api/dossiers/:caseId/notes-partagees",
      express.json({ limit: "8kb", type: "application/json" }),
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
          const note = await createSharedNote({
            db: privateDb,
            cookieHeader: req.headers.cookie,
            caseId: req.params.caseId,
            expectedVersion: req.body?.expectedVersion,
            text: req.body?.text,
          });
          return res.status(201).json(note);
        } catch (error) {
          if (error instanceof CaseAccessDenied) {
            return res.status(404).json({ error: "DOSSIER_INDISPONIBLE" });
          }
          if (error instanceof DossierVersionConflict) {
            return res.status(409).json({ error: "DOSSIER_MODIFIE_ENTRE_TEMPS" });
          }
          if (error instanceof InvalidSharedNote) {
            return res.status(422).json({ error: "NOTE_INVALIDE" });
          }
          return res.status(503).json({ error: "SERVICE_INDISPONIBLE" });
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

    app.get("/api/mes-taches", async (req, res) => {
      try {
        const offsetText = req.query.offset;
        if (offsetText !== undefined && (typeof offsetText !== "string" || !/^\\d{1,6}$/.test(offsetText))) {
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
