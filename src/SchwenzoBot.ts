import Collection from '@discordjs/collection';
import { Client, Intents, Interaction, Message } from 'discord.js';
import SchwenzoCommand from './SchwenzoCommand';
import path from 'path';
import fs from 'fs';
import SchwenzoError from './utils/SchwenzoError';
import { PrismaClient } from '.prisma/client';
import ImageBlob from './components/ImageBlob';
import Component from './components/Component';

export interface SchwenzoClient extends Client {
  commands: Collection<string, SchwenzoCommand>;
  imageBlob: ImageBlob;
  prisma: PrismaClient;
  getComponent<T extends Component>(key: string): T | null;
}

export default class SchwenzoBot {
  client: SchwenzoClient;
  private components: { [key: string]: Component } = {};
  private loading: Promise<void>;
  private resolveLoading: (() => void) | null = null;

  constructor(
    token: string,
    intents: number[] = [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
  ) {
    const IMAGE_BLOB_DIR = process.env['IMAGE_BLOB_DIR'] || './images';

    this.loading = new Promise((resolve) => {
      this.resolveLoading = resolve;
    });
    this.client = new Client({ intents }) as SchwenzoClient;
    // Init database
    this.client.prisma = new PrismaClient();
    // Bind client event to class functions
    this.client.getComponent = this.getComponent.bind(this);
    this.client.once('ready', this.onReady.bind(this));
    this.client.on('interactionCreate', this.onInteractionCreate.bind(this));
    this.client.on('messageCreate', this.onMessageCreate.bind(this));
    this.client.on('error', this.onError.bind(this));
    // Commands Import
    this.client.commands = new Collection();
    this.importCommands();
    // Initialize Schwenzo Components
    this.client.imageBlob = new ImageBlob(IMAGE_BLOB_DIR, this.client);
    // Start Bot
    this.client.login(token);
  }

  private async onReady() {
    console.info('Schwenzo Bot is ready!');
    if (this.resolveLoading) this.resolveLoading();
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
    Object.keys(this.components).map(async (key) => {
      await this.components[key].onMessage(message);
    });
  }

  private onError(error: Error) {
    console.error(`Client Error! ${error}`);
  }

  async addComponent(key: string, component: Component) {
    this.components[key] = component;
    await this.loading;
    await component.onReady();
  }

  getComponent<T extends Component>(key: string): T | null {
    const component = this.components[key];
    if (!component) return null;

    return component as T;
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
