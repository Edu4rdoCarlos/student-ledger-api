-- CreateEnum
CREATE TYPE "DefenseEventType" AS ENUM ('CANCELED', 'RESCHEDULED');

-- CreateTable
CREATE TABLE "DefenseEvent" (
    "id" TEXT NOT NULL,
    "type" "DefenseEventType" NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "defenseId" TEXT NOT NULL,

    CONSTRAINT "DefenseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DefenseEvent_defenseId_idx" ON "DefenseEvent"("defenseId");

-- CreateIndex
CREATE INDEX "DefenseEvent_type_idx" ON "DefenseEvent"("type");

-- AddForeignKey
ALTER TABLE "DefenseEvent" ADD CONSTRAINT "DefenseEvent_defenseId_fkey" FOREIGN KEY ("defenseId") REFERENCES "Defense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
