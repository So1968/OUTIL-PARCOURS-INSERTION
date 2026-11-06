-- Schéma uniquement ; les tâches personnelles existantes conservent caseId NULL.
-- Restrict prévient la transformation silencieuse d'une tâche rattachée en tâche libre.
ALTER TABLE "WorkTask" ADD COLUMN "caseId" TEXT;
CREATE INDEX "WorkTask_ownerId_caseId_idx" ON "WorkTask"("ownerId","caseId");
ALTER TABLE "WorkTask" ADD CONSTRAINT "WorkTask_caseId_fkey"
FOREIGN KEY ("caseId") REFERENCES "CaseFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
