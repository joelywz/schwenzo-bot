import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import SchwenzoCommand from '../core/SchwenzoCommand';

export default class Ping implements SchwenzoCommand {
  data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with pong!');

  async execute(interaction: CommandInteraction) {
    await interaction.reply('Pong!');
  }
}
