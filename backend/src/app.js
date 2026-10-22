import express from "express";
import helmet from "helmet";

export function createApp() {
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

  // AUCUNE route de dossier n'est exposée sans session authentifiée,
  // contrôle ACL, traçabilité, base de données et validation ARTAG.
  app.use("/api", (_req, res) => {
    res.status(503).json({ error: "METIER_NON_ACTIVE" });
  });

  app.use((_req, res) => res.status(404).json({ error: "NOT_FOUND" }));
  return app;
}
