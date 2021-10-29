import { PrismaClient } from '@prisma/client';
import { Client, Message, MessageEmbed } from 'discord.js';
import Binance from 'node-binance-api';
import { SchwenzoClient } from '../../core/SchwenzoBot';
import { marketDoesExist } from '../../utils/binance-api';
import SchwenzoError from '../../utils/SchwenzoError';
import Component from '../../core/Component';
import LivePrice from './LivePrice';

export enum MarketMonitorError {
  MonitorNotFound = 0,
  MonitorAlreadyExist = 1,
  MarketDoesNotExist = 2,
  MarketAlreadyExist = 3,
}

interface MarketMonitorMessage extends Message {
  watchList: LivePrice[];
}

export default class MarketMonitor extends Component {
  private db: Db;
  private livePrices: LivePrice[] = [];
  private binance: Binance;
  private messages: MarketMonitorMessage[] = [];

  constructor(client: SchwenzoClient) {
    super(client);
    this.db = new Db(this.client.prisma);
    this.binance = new Binance({
      log: () => null,
    });

    this.updatePrices();
    setInterval(this.updateMessages.bind(this), 5000);
  }

  async onReady() {
    await this.loadFromDb();
  }

  // DB Manipulations
  async loadFromDb() {
    const marketMonitors = await this.db.getMarketMonitors();

    let count = 0;
    // Register Message
    for (const monitor of marketMonitors) {
      try {
        await this.registerMessage(
          monitor.guildId,
          monitor.channelId,
          monitor.messageId,
          false
        );

        const promises = [];
        // Register Live Prices
        for (const livePrice of monitor.livePrices) {
          promises.push(this.watch(monitor.guildId, livePrice.symbol, false));
        }

        await Promise.all(promises);
        const message = this.getMarketMonitorMessage(monitor.guildId);
        if (message) this.sortWatchList(message);
        count++;
      } catch (e) {
        await this.db.deleteMonitorMessage(monitor.guildId);
      }
    }
    console.info(`MarketMonitor: Loaded ${count} monitor(s) from database.`);
  }

  private updatePrices() {
    this.binance.websockets.miniTicker((markets) => {
      if (!this.livePrices) return;
      for (const l of this.livePrices) {
        if (!markets[l.getSymbol() + 'USDT']) continue;
        const market = markets[l.getSymbol() + 'USDT'];
        l.setClose(parseFloat(market['close']));
      }
    });
  }

  private async updateMessages() {
    for (const message of this.messages) {
      if (!message.guildId) continue;
      if (!message.watchList) continue;
      try {
        await message.edit({
          embeds: [this.generateEmbed(message.watchList)],
        });
      } catch (e) {
        const err = e as Error;
        console.error(
          `Market Monitor: (${err.message}) Message for ${message.guildId} failed to update, attempting to re-register message.`
        );
        await this.retryMessage(message);
      }
    }
  }

  async registerMessage(
    guildId: string,
    channelId: string,
    messageId: string,
    save: boolean = true
  ) {
    console.info(
      `Market Monitor: Attempting to register a message from Guild ID: ${guildId}`
    );

    // Check if monitor already exist in server
    if (this.doesMessageExist(guildId))
      throw new SchwenzoError(
        MarketMonitorError.MonitorAlreadyExist,
        'A monitor already exists in the server.'
      );

    // Fetch message from client
    const message = await this.fetchMessageFromClient(
      guildId,
      channelId,
      messageId
    );

    // Convert to MarketMonitorMessage
    const monitorMessage = this.toMarketMonitorMessage(message);

    // Push to memory to keep track
    this.messages.push(monitorMessage);

    // Save to database
    if (save) {
      try {
        await this.db.saveMonitorMessage(monitorMessage);
        console.info(
          `Market Monitor: Saved message info from Guild ID: ${guildId}`
        );
      } catch (e) {
        console.info(
          `Market Monitor: Failed to save message info from Guild ID: ${guildId}`
        );
      }
    }

    console.info(
      `Market Monitor: Sucessfully registered message from Guild ID: ${guildId}`
    );
    return monitorMessage;
  }

  async unregisterMessage(guildId: string, save: boolean = true) {
    console.info(
      `Market Monitor: Attempting to unregister a message from Guild ID: ${guildId}`
    );
    const monitorMessage = this.getMarketMonitorMessage(guildId);

    if (!monitorMessage) {
      throw new Error("You don't even have an active monitor!");
    }

    // Attempt to delete monitor message
    try {
      await monitorMessage.delete();
    } catch (e) {}

    // Remove from memory
    this.messages = this.messages.filter(
      (message) => message.guildId != guildId
    );

    // Update database
    if (save) {
      await this.db.deleteMonitorMessage(guildId);
    }

    console.info(
      `Market Monitor: Succesfully unregistered a message from Guild ID: ${guildId}`
    );
  }

  async retryMessage(message: MarketMonitorMessage) {
    // Remove message from messages
    const guildId = message.guildId;
    const channelId = message.channelId;
    const messageId = message.id;

    if (!guildId) return;

    // Register
    try {
      console.info(`Market Monitor: Unregistering Message...`);
      await this.unregisterMessage(guildId);
      console.info(`Market Monitor: Re-registering Message...`);
      await this.registerMessage(guildId, channelId, messageId);
    } catch (e) {
      const error = e as Error;
      if (error.message)
        console.error(
          `Market Monitor: (${error.message}) Removed from database.`
        );
    }
  }

  async watch(guildId: string, symbol: string, save: boolean = true) {
    symbol = symbol.toUpperCase();

    // Obtain monitor message
    const monitorMessage = this.getMarketMonitorMessage(guildId);
    if (!monitorMessage)
      throw new SchwenzoError(
        MarketMonitorError.MonitorNotFound,
        'You need to start monitoring before adding a market.'
      );

    // Check if maximum filed reached
    if (monitorMessage.watchList.length >= 25)
      throw new Error('Maximum market reached.');

    // Check if market exist
    if (!(await marketDoesExist(symbol + 'USDT')))
      throw new SchwenzoError(
        MarketMonitorError.MarketDoesNotExist,
        'Market does not exist.'
      );

    // New LivePrice
    for (const lp of monitorMessage.watchList) {
      if (lp.getSymbol() == symbol)
        throw new SchwenzoError(
          MarketMonitorError.MarketAlreadyExist,
          `${symbol}/USDT is already in the list you dummy.`
        );
    }

    const lp = this.getLivePrice(symbol);

    // Fetch price from web if not being updated
    // setTimeout(async () => {
    //   if (lp.getClosingPrice() == null) {
    //     const response = await fetchTicker24Hrs(`${symbol}USDT`);
    //     lp.setClose(parseFloat(response.lastPrice));
    //   }
    // }, 5000);

    // Save to Database
    if (save) {
      try {
        await this.db.saveLivePrice(lp, guildId);
      } catch (e) {}
    }

    monitorMessage.watchList.push(this.getLivePrice(symbol));
    this.sortWatchList(monitorMessage);
  }

  async unwatch(guildId: string, symbol: string) {
    symbol = symbol.toUpperCase();

    // Obtain monitor message
    const monitorMessage = this.getMarketMonitorMessage(guildId);
    if (!monitorMessage)
      throw new SchwenzoError(
        MarketMonitorError.MonitorNotFound,
        `How am I supposed to remove a market when nothing is being monitored you dummy!`
      );

    // Remove LivePrice if exist
    for (const lp of monitorMessage.watchList) {
      if (lp.getSymbol() == symbol) {
        monitorMessage.watchList = monitorMessage.watchList.filter(
          (livePrice) => livePrice.getSymbol() != symbol
        );
        try {
          await this.db.deleteLivePrice(symbol, guildId);
        } catch (e) {}
        return;
      }
    }

    // LivePrice doesnt exist
    throw new SchwenzoError(
      MarketMonitorError.MarketDoesNotExist,
      `The market is not even in the monitor list.`
    );
  }

  getMarketMonitorMessage(guildId: string): MarketMonitorMessage | null {
    for (const m of this.messages) {
      if (m.guildId == guildId) {
        return m;
      }
    }
    return null;
  }

  private getLivePrice(symbol: string) {
    for (const lp of this.livePrices) {
      if (lp.getSymbol() == symbol) return lp;
    }

    const lp = new LivePrice(symbol);
    this.livePrices.push(lp);
    return lp;
  }

  private async fetchMessageFromClient(
    guildId: string,
    channelId: string,
    messageId: string
  ): Promise<Message> {
    // Fetch Message using
    const guild = await this.client.guilds.fetch(guildId);
    if (!guild) throw new Error('Guild does not exist.');
    const channel = await guild.channels.fetch(channelId);
    if (!channel) throw new Error('Channel does not exist!');
    if (!channel.isText()) throw new Error('Channel is not a text channel!');
    const message = await channel.messages.fetch(messageId);
    if (!message) throw new Error('Message not found.');

    return message;
  }

  private toMarketMonitorMessage(message: Message): MarketMonitorMessage {
    const monitorMessage = message as MarketMonitorMessage;
    if (!monitorMessage.watchList) {
      monitorMessage.watchList = [];
    }
    return monitorMessage;
  }

  private doesMessageExist(guildId: string) {
    for (const m of this.messages) {
      if (!m.guildId)
        throw new Error('Internal error occured when finding messages.');
      const _guildId = m.guildId;
      if (guildId == _guildId) return true;
    }

    return false;
  }

  private generateEmbed(watchList: LivePrice[]) {
    const embed = new MessageEmbed();
    embed.setTitle('Crypto Market Monitor');

    if (watchList.length == 0) {
      embed.setDescription(
        'Monitor list is currently empty, use "/monitor add" to add a market.'
      );
      return embed;
    }

    for (const livePrice of watchList) {
      const dSymbol = livePrice.getSymbol() + '/USDT';
      const dPrice = livePrice.getClosingPrice();
      if (dPrice) embed.addField(dSymbol, dPrice.toString(), false);
      else embed.addField(dSymbol, 'Loading...', false);
    }
    embed.setFooter(`Last Updated ${new Date()}`);

    return embed;
  }

  private sortWatchList(message: MarketMonitorMessage) {
    message.watchList.sort((a, b) => {
      if (a.getSymbol() < b.getSymbol()) return -1;
      return 1;
    });
  }
}

class Db {
  prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async deleteMonitorMessage(guildId: string) {
    try {
      await this.prisma.livePrice.deleteMany({
        where: {
          guildId,
        },
      });
    } catch (e) {}

    try {
      await this.prisma.marketMonitor.delete({
        where: {
          guildId,
        },
      });
    } catch (e) {}
  }

  async saveMonitorMessage(monitorMessage: MarketMonitorMessage) {
    if (!monitorMessage.guildId) throw 'Error';

    await this.prisma.marketMonitor.create({
      data: {
        guildId: monitorMessage.guildId,
        channelId: monitorMessage.channelId,
        messageId: monitorMessage.id,
      },
    });
  }
  async deleteLivePrice(symbol: string, guildId: string) {
    await this.prisma.livePrice.deleteMany({
      where: {
        guildId,
        symbol,
      },
    });
  }

  async saveLivePrice(livePrice: LivePrice, guildId: string) {
    await this.prisma.livePrice.create({
      data: {
        symbol: livePrice.getSymbol(),
        guildId: guildId,
      },
    });
  }

  async getMarketMonitors() {
    return await this.prisma.marketMonitor.findMany({
      include: {
        livePrices: true,
      },
    });
  }
}
