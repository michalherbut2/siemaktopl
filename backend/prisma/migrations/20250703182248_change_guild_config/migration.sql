/*
  Warnings:

  - You are about to drop the `GuildSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `commands` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `enabled` on the `guilds` table. All the data in the column will be lost.
  - You are about to drop the column `prefix` on the `guilds` table. All the data in the column will be lost.
  - You are about to drop the column `timeoutLogChannelId` on the `guilds` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "GuildSettings_guildId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GuildSettings";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "commands";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "guild_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "timeoutLogEnabled" BOOLEAN NOT NULL DEFAULT false,
    "timeoutLogChannelId" TEXT,
    "timeoutLogMessageTemplate" TEXT DEFAULT '**{moderator}** timed out **{target}** for **{duration}**
**Reason:** {reason}',
    "banLogEnabled" BOOLEAN NOT NULL DEFAULT false,
    "banLogChannelId" TEXT,
    "banLogMessageTemplate" TEXT DEFAULT '**{moderator}** banned **{target}**
**Reason:** {reason}',
    "warnLogEnabled" BOOLEAN NOT NULL DEFAULT false,
    "warnLogChannelId" TEXT,
    "warnLogMessageTemplate" TEXT DEFAULT '**{moderator}** warned **{target}**
**Reason:** {reason}',
    "welcomeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "welcomeChannelId" TEXT,
    "welcomeMessageTemplate" TEXT DEFAULT 'Welcome to the server, **{user}**!',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "guild_configs_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "punishment_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "moderatorUserId" TEXT NOT NULL,
    "reason" TEXT,
    "durationSeconds" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "removedAt" DATETIME,
    "removedByUserId" TEXT,
    "removalReason" TEXT,
    "metadata" JSONB,
    CONSTRAINT "punishment_logs_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_guilds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_guilds" ("createdAt", "id", "name", "updatedAt") SELECT "createdAt", "id", "name", "updatedAt" FROM "guilds";
DROP TABLE "guilds";
ALTER TABLE "new_guilds" RENAME TO "guilds";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "guild_configs_guildId_key" ON "guild_configs"("guildId");

-- CreateIndex
CREATE INDEX "punishment_logs_guildId_type_idx" ON "punishment_logs"("guildId", "type");

-- CreateIndex
CREATE INDEX "punishment_logs_guildId_targetUserId_idx" ON "punishment_logs"("guildId", "targetUserId");

-- CreateIndex
CREATE INDEX "punishment_logs_guildId_moderatorUserId_idx" ON "punishment_logs"("guildId", "moderatorUserId");

-- CreateIndex
CREATE INDEX "punishment_logs_guildId_createdAt_idx" ON "punishment_logs"("guildId", "createdAt");

-- CreateIndex
CREATE INDEX "punishment_logs_guildId_type_createdAt_idx" ON "punishment_logs"("guildId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "punishment_logs_targetUserId_type_idx" ON "punishment_logs"("targetUserId", "type");

-- CreateIndex
CREATE INDEX "punishment_logs_moderatorUserId_type_idx" ON "punishment_logs"("moderatorUserId", "type");

-- CreateIndex
CREATE INDEX "punishment_logs_expiresAt_idx" ON "punishment_logs"("expiresAt");

-- CreateIndex
CREATE INDEX "punishment_logs_removedAt_idx" ON "punishment_logs"("removedAt");

-- CreateIndex
CREATE INDEX "punishment_logs_durationSeconds_idx" ON "punishment_logs"("durationSeconds");
