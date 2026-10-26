-- AlterTable
ALTER TABLE "CaseFile" ADD COLUMN     "artagReference" VARCHAR(80);

-- CreateIndex
CREATE UNIQUE INDEX "CaseFile_artagReference_key" ON "CaseFile"("artagReference");
