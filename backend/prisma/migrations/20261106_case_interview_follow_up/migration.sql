-- Trace de l'entretien : jour civil explicitement saisi, sans note libre.
-- La tâche de suite, lorsqu'elle existe, partage le même dossier et le même auteur
-- au niveau du service transactionnel.
CREATE TABLE "CaseInterview" (
    "id" TEXT NOT NULL,
    "requestId" UUID NOT NULL,
    "caseId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "interviewDay" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CaseInterview_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CaseInterview_ownerId_requestId_key" ON "CaseInterview"("ownerId","requestId");
CREATE INDEX "CaseInterview_caseId_ownerId_interviewDay_idx" ON "CaseInterview"("caseId","ownerId","interviewDay");
ALTER TABLE "CaseInterview" ADD CONSTRAINT "CaseInterview_caseId_fkey"
FOREIGN KEY ("caseId") REFERENCES "CaseFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CaseInterview" ADD CONSTRAINT "CaseInterview_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkTask" ADD COLUMN "interviewId" TEXT;
CREATE UNIQUE INDEX "WorkTask_interviewId_key" ON "WorkTask"("interviewId");
ALTER TABLE "WorkTask" ADD CONSTRAINT "WorkTask_interviewId_fkey"
FOREIGN KEY ("interviewId") REFERENCES "CaseInterview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
