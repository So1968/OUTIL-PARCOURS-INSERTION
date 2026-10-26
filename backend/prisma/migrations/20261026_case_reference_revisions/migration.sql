-- CreateTable
CREATE TABLE "CaseReferenceRevision" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "dossierVersion" INTEGER NOT NULL,
    "previousReference" VARCHAR(80),
    "artagReference" VARCHAR(80) NOT NULL,
    "actorId" TEXT NOT NULL,
    "reason" VARCHAR(200) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseReferenceRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CaseReferenceRevision_caseId_dossierVersion_key" ON "CaseReferenceRevision"("caseId", "dossierVersion");

-- AddForeignKey
ALTER TABLE "CaseReferenceRevision" ADD CONSTRAINT "CaseReferenceRevision_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseReferenceRevision" ADD CONSTRAINT "CaseReferenceRevision_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
