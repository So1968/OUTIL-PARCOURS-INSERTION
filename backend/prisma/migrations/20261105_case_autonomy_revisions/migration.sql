-- Socle autonomie : états et versions historiques ; aucune reprise automatique.
CREATE TABLE "CaseAutonomy" (
    "caseId" TEXT NOT NULL,
    "dossierVersion" INTEGER NOT NULL,
    "reponses" JSONB NOT NULL,
    CONSTRAINT "CaseAutonomy_pkey" PRIMARY KEY ("caseId")
);
CREATE TABLE "CaseAutonomyRevision" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "dossierVersion" INTEGER NOT NULL,
    "previousReponses" JSONB NOT NULL,
    "reponses" JSONB NOT NULL,
    "actorId" TEXT NOT NULL,
    "reason" VARCHAR(200) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CaseAutonomyRevision_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CaseAutonomyRevision_caseId_dossierVersion_key" ON "CaseAutonomyRevision"("caseId", "dossierVersion");
ALTER TABLE "CaseAutonomy" ADD CONSTRAINT "CaseAutonomy_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CaseAutonomyRevision" ADD CONSTRAINT "CaseAutonomyRevision_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CaseAutonomyRevision" ADD CONSTRAINT "CaseAutonomyRevision_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
