-- Structure uniquement : aucun contenu ni dossier individuel n'est inséré.
CREATE TABLE "CaseProfessionalReflection" (
    "caseId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "dossierVersion" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    CONSTRAINT "CaseProfessionalReflection_pkey" PRIMARY KEY ("caseId","ownerId")
);

CREATE TABLE "CaseProfessionalReflectionRevision" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "dossierVersion" INTEGER NOT NULL,
    "previousContent" JSONB NOT NULL,
    "content" JSONB NOT NULL,
    "reason" VARCHAR(200) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CaseProfessionalReflectionRevision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CaseProfReflectionRev_version_key"
ON "CaseProfessionalReflectionRevision"("caseId","ownerId","dossierVersion");

ALTER TABLE "CaseProfessionalReflection" ADD CONSTRAINT "CaseProfessionalReflection_caseId_fkey"
FOREIGN KEY ("caseId") REFERENCES "CaseFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CaseProfessionalReflection" ADD CONSTRAINT "CaseProfessionalReflection_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CaseProfessionalReflectionRevision" ADD CONSTRAINT "CaseProfessionalReflectionRevision_caseId_fkey"
FOREIGN KEY ("caseId") REFERENCES "CaseFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CaseProfessionalReflectionRevision" ADD CONSTRAINT "CaseProfessionalReflectionRevision_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
