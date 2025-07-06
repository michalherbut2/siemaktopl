/*
  Warnings:

  - You are about to drop the column `banLogChannelId` on the `guild_configs` table. All the data in the column will be lost.
  - You are about to drop the column `banLogEnabled` on the `guild_configs` table. All the data in the column will be lost.
  - You are about to drop the column `banLogMessageTemplate` on the `guild_configs` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `guild_configs` table. All the data in the column will be lost.
  - You are about to drop the column `guildId` on the `guild_configs` table. All the data in the column will be lost.
  - You are about to drop the column `timeoutLogAddTemplate` on the `guild_configs` table. All the data in the column will be lost.
  - You are about to drop the column `timeoutLogChannelId` on the `guild_configs` table. All the data in the column will be lost.
  - You are about to drop the column `timeoutLogEnabled` on the `guild_configs` table. All the data in the column will be lost.
  - You are about to drop the column `timeoutLogRemoveTemplate` on the `guild_configs` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `guild_configs` table. All the data in the column will be lost.
  - You are about to drop the column `warnLogChannelId` on the `guild_configs` table. All the data in the column will be lost.
  - You are about to drop the column `warnLogEnabled` on the `guild_configs` table. All the data in the column will be lost.
  - You are about to drop the column `warnLogMessageTemplate` on the `guild_configs` table. All the data in the column will be lost.
  - You are about to drop the column `welcomeChannelId` on the `guild_configs` table. All the data in the column will be lost.
  - You are about to drop the column `welcomeEnabled` on the `guild_configs` table. All the data in the column will be lost.
  - You are about to drop the column `welcomeMessageTemplate` on the `guild_configs` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `guilds` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `guilds` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `punishment_logs` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `punishment_logs` table. All the data in the column will be lost.
  - You are about to drop the column `guildId` on the `punishment_logs` table. All the data in the column will be lost.
  - You are about to drop the column `moderatorUserId` on the `punishment_logs` table. All the data in the column will be lost.
  - You are about to drop the column `removedAt` on the `punishment_logs` table. All the data in the column will be lost.
  - You are about to drop the column `removedByUserId` on the `punishment_logs` table. All the data in the column will be lost.
  - You are about to drop the column `targetUserId` on the `punishment_logs` table. All the data in the column will be lost.
  - You are about to drop the column `accessToken` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - Added the required column `guild_id` to the `guild_configs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `guild_configs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `guilds` table without a default value. This is not possible if the table is not empty.
  - Added the required column `executor_id` to the `punishment_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guild_id` to the `punishment_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target_id` to the `punishment_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_guild_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guild_id" TEXT NOT NULL,
    "timeout_log_enabled" BOOLEAN NOT NULL DEFAULT false,
    "timeout_log_channel_id" TEXT,
    "timeout_log_add_template" TEXT DEFAULT '{target} w końcu **dostał przerwę** od {executor} na {timestamp} za **{reason}**.',
    "timeout_log_remove_template" TEXT DEFAULT 'niestety {executorId}, jak zbój, zasłużonej **pozbawił przerwy** Czcigodnego {targetId}.',
    "ban_log_enabled" BOOLEAN NOT NULL DEFAULT false,
    "ban_log_channel_id" TEXT,
    "ban_log_message_template" TEXT DEFAULT '**{moderator}** banned **{target}**
**Reason:** {reason}',
    "warn_log_enabled" BOOLEAN NOT NULL DEFAULT false,
    "warn_log_channel_id" TEXT,
    "warn_log_message_template" TEXT DEFAULT '**{moderator}** warned **{target}**
**Reason:** {reason}',
    "welcome_enabled" BOOLEAN NOT NULL DEFAULT false,
    "welcome_channel_id" TEXT,
    "welcome_message_template" TEXT DEFAULT 'Welcome to the server, **{user}**!',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "guild_configs_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_guild_configs" ("id") SELECT "id" FROM "guild_configs";
DROP TABLE "guild_configs";
ALTER TABLE "new_guild_configs" RENAME TO "guild_configs";
CREATE UNIQUE INDEX "guild_configs_guild_id_key" ON "guild_configs"("guild_id");
CREATE TABLE "new_guilds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_guilds" ("icon", "id", "name") SELECT "icon", "id", "name" FROM "guilds";
DROP TABLE "guilds";
ALTER TABLE "new_guilds" RENAME TO "guilds";
CREATE TABLE "new_punishment_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guild_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "executor_id" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" DATETIME,
    "removed_at" DATETIME,
    "removed_by_user_id" TEXT,
    CONSTRAINT "punishment_logs_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_punishment_logs" ("id", "reason", "type") SELECT "id", "reason", "type" FROM "punishment_logs";
DROP TABLE "punishment_logs";
ALTER TABLE "new_punishment_logs" RENAME TO "punishment_logs";
CREATE INDEX "punishment_logs_guild_id_type_idx" ON "punishment_logs"("guild_id", "type");
CREATE INDEX "punishment_logs_guild_id_target_id_idx" ON "punishment_logs"("guild_id", "target_id");
CREATE INDEX "punishment_logs_guild_id_executor_id_idx" ON "punishment_logs"("guild_id", "executor_id");
CREATE INDEX "punishment_logs_guild_id_created_at_idx" ON "punishment_logs"("guild_id", "created_at");
CREATE INDEX "punishment_logs_guild_id_type_created_at_idx" ON "punishment_logs"("guild_id", "type", "created_at");
CREATE INDEX "punishment_logs_target_id_type_idx" ON "punishment_logs"("target_id", "type");
CREATE INDEX "punishment_logs_executor_id_type_idx" ON "punishment_logs"("executor_id", "type");
CREATE INDEX "punishment_logs_expires_at_idx" ON "punishment_logs"("expires_at");
CREATE INDEX "punishment_logs_removed_at_idx" ON "punishment_logs"("removed_at");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "avatar" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_users" ("avatar", "id", "username") SELECT "avatar", "id", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
