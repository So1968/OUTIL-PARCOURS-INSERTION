import express from "express";
import helmet from "helmet";
import { readCaseOverview, CaseAccessDenied, SecurityProviderUnavailable } from "./caseAccessService.js";
import { resolveSessionUserId } from "./sessions.js";
import { createAuthRouter } from "./authRouter.js";
import { issueCsrfToken, validCsrf } from "./csrf.js";
import { createSharedNote, DossierVersionConflict, InvalidSharedNote } from "./sharedNoteService.js";

export function createApp({
  privateDb = null,
  oidc = null,
  csrfSecret = null,
  enableSharedWrites = false,
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

  if (canWrite) {
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
