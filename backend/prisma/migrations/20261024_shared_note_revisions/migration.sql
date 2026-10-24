-- Première fondation de l'historique des versions métier des notes partagées.
-- Aucune donnée existante n'est modifiée ni recopiée.
CREATE TABLE "SharedNoteRevision" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "actorId" TEXT NOT NULL,
    "reason" VARCHAR(200) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SharedNoteRevision_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SharedNoteRevision_noteId_version_key" ON "SharedNoteRevision"("noteId", "version");
CREATE INDEX "SharedNoteRevision_caseId_createdAt_idx" ON "SharedNoteRevision"("caseId", "createdAt");
ALTER TABLE "SharedNoteRevision" ADD CONSTRAINT "SharedNoteRevision_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "SharedNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SharedNoteRevision" ADD CONSTRAINT "SharedNoteRevision_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SharedNoteRevision" ADD CONSTRAINT "SharedNoteRevision_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
