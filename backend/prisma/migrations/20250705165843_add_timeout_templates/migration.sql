/*
  Warnings:

  - You are about to drop the column `timeoutLogMessageTemplate` on the `guild_configs` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_guild_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "timeoutLogEnabled" BOOLEAN NOT NULL DEFAULT false,
    "timeoutLogChannelId" TEXT,
    "timeoutAddTemplate" TEXT DEFAULT '{target} w końcu **dostał przerwę** od {executor} na {timestamp} za **{reason}**.',
    "timeoutRemoveTemplate" TEXT DEFAULT 'niestety {executorId}, jak zbój, zasłużonej **pozbawił przerwy** Czcigodnego {targetId}.',
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
INSERT INTO "new_guild_configs" ("banLogChannelId", "banLogEnabled", "banLogMessageTemplate", "createdAt", "guildId", "id", "timeoutLogChannelId", "timeoutLogEnabled", "updatedAt", "warnLogChannelId", "warnLogEnabled", "warnLogMessageTemplate", "welcomeChannelId", "welcomeEnabled", "welcomeMessageTemplate") SELECT "banLogChannelId", "banLogEnabled", "banLogMessageTemplate", "createdAt", "guildId", "id", "timeoutLogChannelId", "timeoutLogEnabled", "updatedAt", "warnLogChannelId", "warnLogEnabled", "warnLogMessageTemplate", "welcomeChannelId", "welcomeEnabled", "welcomeMessageTemplate" FROM "guild_configs";
DROP TABLE "guild_configs";
ALTER TABLE "new_guild_configs" RENAME TO "guild_configs";
CREATE UNIQUE INDEX "guild_configs_guildId_key" ON "guild_configs"("guildId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
