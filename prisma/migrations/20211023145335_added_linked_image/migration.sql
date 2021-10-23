-- CreateTable
CREATE TABLE "LinkedImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "path" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "LinkedImage_id_key" ON "LinkedImage"("id");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedImage_path_key" ON "LinkedImage"("path");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedImage_guildId_message_key" ON "LinkedImage"("guildId", "message");
