-- CreateTable
CREATE TABLE "CaseIdentity" (
    "caseId" TEXT NOT NULL,
    "dossierVersion" INTEGER NOT NULL,
    "lastName" VARCHAR(200),
    "firstName" VARCHAR(200),
    "insertisNumber" VARCHAR(255),
    "age" INTEGER,

    CONSTRAINT "CaseIdentity_pkey" PRIMARY KEY ("caseId")
);

-- CreateTable
CREATE TABLE "CaseIdentityRevision" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "dossierVersion" INTEGER NOT NULL,
    "previousLastName" VARCHAR(200),
    "previousFirstName" VARCHAR(200),
    "previousInsertisNumber" VARCHAR(255),
    "previousAge" INTEGER,
    "lastName" VARCHAR(200),
    "firstName" VARCHAR(200),
    "insertisNumber" VARCHAR(255),
    "age" INTEGER,
    "actorId" TEXT NOT NULL,
    "reason" VARCHAR(200) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseIdentityRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CaseIdentityRevision_caseId_dossierVersion_key" ON "CaseIdentityRevision"("caseId", "dossierVersion");

-- AddForeignKey
ALTER TABLE "CaseIdentity" ADD CONSTRAINT "CaseIdentity_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseIdentityRevision" ADD CONSTRAINT "CaseIdentityRevision_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseIdentityRevision" ADD CONSTRAINT "CaseIdentityRevision_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
