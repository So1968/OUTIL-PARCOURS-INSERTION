import express from "express";
import helmet from "helmet";
import { readCaseOverview, CaseAccessDenied, SecurityProviderUnavailable } from "./caseAccessService.js";
import { resolveSessionUserId } from "./sessions.js";
import { createAuthRouter } from "./authRouter.js";

export function createApp({ privateDb = null, oidc = null } = {}) {
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

  // Cette route est absente si le serveur n'injecte pas explicitement
  // une instance PostgreSQL de confiance. Jamais de rôle depuis le client.
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
        res.status(200).json(overview);
      } catch (error) {
        if (error instanceof CaseAccessDenied) {
          res.status(404).json({ error: "DOSSIER_INDISPONIBLE" });
        } else if (error instanceof SecurityProviderUnavailable) {
          res.status(503).json({ error: "AUTHENTIFICATION_SERVEUR_NON_CONFIGUREE" });
        } else {
          res.status(503).json({ error: "SERVICE_INDISPONIBLE" });
        }
      }
    });
  }

  // Les autres routes métier et toutes les écritures sont inactives.
  app.use("/api", (_req, res) => {
    res.status(503).json({ error: "METIER_NON_ACTIVE" });
  });

  app.use((_req, res) => res.status(404).json({ error: "NOT_FOUND" }));
  return app;
}
