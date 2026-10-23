-- Nouvelle clé de requête facultative : compatibilité avec les tâches existantes.
-- Une clé unique évite qu'un renvoi réseau crée une deuxième tâche.
ALTER TABLE "WorkTask" ADD COLUMN "requestId" VARCHAR(80);
CREATE UNIQUE INDEX "WorkTask_ownerId_requestId_key"
  ON "WorkTask"("ownerId", "requestId");
