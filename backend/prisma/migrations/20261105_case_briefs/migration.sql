-- Deux blocs métier courts, sans aucune donnée individuelle ou reprise de base.
CREATE TYPE "CaseBriefKind" AS ENUM ('SYNTHESE_COURTE', 'NOTE_CONTINUITE');

CREATE TABLE "CaseBrief" (
    "caseId" TEXT NOT NULL,
    "kind" "CaseBriefKind" NOT NULL,
    "dossierVersion" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    CONSTRAINT "CaseBrief_pkey" PRIMARY KEY ("caseId","kind")
);

CREATE TABLE "CaseBriefRevision" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "kind" "CaseBriefKind" NOT NULL,
    "dossierVersion" INTEGER NOT NULL,
    "previousContent" JSONB NOT NULL,
    "content" JSONB NOT NULL,
    "actorId" TEXT NOT NULL,
    "reason" VARCHAR(200) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CaseBriefRevision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CaseBriefRevision_caseId_kind_dossierVersion_key" ON "CaseBriefRevision"("caseId", "kind", "dossierVersion");

ALTER TABLE "CaseBrief" ADD CONSTRAINT "CaseBrief_caseId_fkey"
  FOREIGN KEY ("caseId") REFERENCES "CaseFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CaseBriefRevision" ADD CONSTRAINT "CaseBriefRevision_caseId_fkey"
  FOREIGN KEY ("caseId") REFERENCES "CaseFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CaseBriefRevision" ADD CONSTRAINT "CaseBriefRevision_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
