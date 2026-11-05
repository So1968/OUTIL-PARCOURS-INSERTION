-- CreateTable
CREATE TABLE "CaseCreationRequest" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "requestId" UUID NOT NULL,
    "caseId" TEXT NOT NULL,
    "referenceDigest" CHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseCreationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CaseCreationRequest_caseId_key" ON "CaseCreationRequest"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "CaseCreationRequest_actorId_requestId_key" ON "CaseCreationRequest"("actorId", "requestId");

-- AddForeignKey
ALTER TABLE "CaseCreationRequest" ADD CONSTRAINT "CaseCreationRequest_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseCreationRequest" ADD CONSTRAINT "CaseCreationRequest_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
