-- Drop legacy index
DROP INDEX IF EXISTS "Document_documentHash_idx";

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "evaluationCid" VARCHAR(64),
ADD COLUMN     "evaluationHash" VARCHAR(64),
ADD COLUMN     "minutesCid" VARCHAR(64),
ADD COLUMN     "minutesHash" VARCHAR(64);

-- Drop legacy columns
ALTER TABLE "Document" DROP COLUMN IF EXISTS "documentHash",
DROP COLUMN IF EXISTS "documentCid";

-- Create new indexes
CREATE INDEX "Document_minutesHash_idx" ON "Document"("minutesHash");
CREATE INDEX "Document_evaluationHash_idx" ON "Document"("evaluationHash");
