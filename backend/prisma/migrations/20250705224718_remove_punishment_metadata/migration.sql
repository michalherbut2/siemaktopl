/*
  Warnings:

  - You are about to drop the column `metadata` on the `punishment_logs` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_punishment_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "moderatorUserId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "removedAt" DATETIME,
    "removedByUserId" TEXT,
    "removalReason" TEXT,
    CONSTRAINT "punishment_logs_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_punishment_logs" ("createdAt", "expiresAt", "guildId", "id", "moderatorUserId", "reason", "removalReason", "removedAt", "removedByUserId", "targetUserId", "type") SELECT "createdAt", "expiresAt", "guildId", "id", "moderatorUserId", "reason", "removalReason", "removedAt", "removedByUserId", "targetUserId", "type" FROM "punishment_logs";
DROP TABLE "punishment_logs";
ALTER TABLE "new_punishment_logs" RENAME TO "punishment_logs";
CREATE INDEX "punishment_logs_guildId_type_idx" ON "punishment_logs"("guildId", "type");
CREATE INDEX "punishment_logs_guildId_targetUserId_idx" ON "punishment_logs"("guildId", "targetUserId");
CREATE INDEX "punishment_logs_guildId_moderatorUserId_idx" ON "punishment_logs"("guildId", "moderatorUserId");
CREATE INDEX "punishment_logs_guildId_createdAt_idx" ON "punishment_logs"("guildId", "createdAt");
CREATE INDEX "punishment_logs_guildId_type_createdAt_idx" ON "punishment_logs"("guildId", "type", "createdAt");
CREATE INDEX "punishment_logs_targetUserId_type_idx" ON "punishment_logs"("targetUserId", "type");
CREATE INDEX "punishment_logs_moderatorUserId_type_idx" ON "punishment_logs"("moderatorUserId", "type");
CREATE INDEX "punishment_logs_expiresAt_idx" ON "punishment_logs"("expiresAt");
CREATE INDEX "punishment_logs_removedAt_idx" ON "punishment_logs"("removedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
