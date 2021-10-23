-- CreateTable
CREATE TABLE "MarketMonitor" (
    "guildId" TEXT NOT NULL PRIMARY KEY,
    "channelId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "LivePrice" (
    "symbol" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    CONSTRAINT "LivePrice_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "MarketMonitor" ("guildId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketMonitor_guildId_key" ON "MarketMonitor"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketMonitor_channelId_key" ON "MarketMonitor"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketMonitor_messageId_key" ON "MarketMonitor"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "LivePrice_symbol_guildId_key" ON "LivePrice"("symbol", "guildId");
