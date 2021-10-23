import Collection from '@discordjs/collection';
import {
  Client,
  Intents,
  Interaction,
  Message,
  MessageEmbed,
} from 'discord.js';
import SchwenzoCommand from './SchwenzoCommand';
import path from 'path';
import fs from 'fs';
import MarketMonitor from './components/MarketMonitor/MarketMonitor';
import SchwenzoError from './utils/SchwenzoError';
import { Prisma, PrismaClient } from '.prisma/client';
import ImageLink from './components/ImageLink';
import ImageBlob from './components/ImageBlob';

export interface SchwenzoClient extends Client {
  commands: Collection<string, SchwenzoCommand>;
  marketMonitor: MarketMonitor;
  imageLink: ImageLink;
  imageBlob: ImageBlob;
  prisma: PrismaClient;
}

export default class SchwenzoBot {
  client: SchwenzoClient;

  constructor(
    token: string,
    intents: number[] = [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
  ) {
    const IMAGE_BLOB_DIR = process.env['IMAGE_BLOB_DIR'] || './images';

    this.client = new Client({ intents }) as SchwenzoClient;
    // Init database
    this.client.prisma = new PrismaClient();
    // Bind client event to class functions
    this.client.once('ready', this.onReady.bind(this));
    this.client.on('interactionCreate', this.onInteractionCreate.bind(this));
    this.client.on('messageCreate', this.onMessageCreate.bind(this));
    this.client.on('error', this.onError.bind(this));
    // Commands Import
    this.client.commands = new Collection();
    this.importCommands();
    // Initialize schwenzo cores
    this.client.marketMonitor = new MarketMonitor(this.client);
    this.client.imageBlob = new ImageBlob(IMAGE_BLOB_DIR, this.client);
    this.client.imageLink = new ImageLink(this.client);
    // Start Bot
    this.client.login(token);
  }

  private async onReady() {
    console.info('Schwenzo Bot is ready!');
    this.client.marketMonitor.loadFromDb();
    this.client.imageLink.loadFromDb();
  }

  private async onInteractionCreate(interaction: Interaction) {
    if (!interaction.isCommand()) return;

    // Command Execution
    const command = this.client.commands.get(interaction.commandName);
    try {
      await command?.execute(interaction);
    } catch (error) {
      const err = error as SchwenzoError;
      if (!err.message) console.error(error);
      const { message = 'There was an error while executing this command!' } =
        err;

      const payload = {
        content: message,
        embeds: [],
        ephemeral: true,
      };

      if (!interaction.replied) await interaction.reply(payload);
      else await interaction.editReply(payload);

      setTimeout(async () => {
        if (!interaction.ephemeral) await interaction.deleteReply();
      }, 3000);
    }
  }

  private async onMessageCreate(message: Message) {
    this.client.imageLink.onMessage(message);
  }

  private onError(error: Error) {
    console.error(`Client Error! ${error}`);
  }

  private async importCommands() {
    // Get all the file names in commands folder
    const commandFiles = fs
      .readdirSync(path.join(__dirname, 'commands'))
      .filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

    // Register commands to the client
    for (const file of commandFiles) {
      const i = await import(`./commands/${file}`);
      const command = new i.default() as SchwenzoCommand;
      console.info(`Importing command "${command.data.name}"`);
      this.client.commands.set(command.data.name, command);
    }
  }
}
