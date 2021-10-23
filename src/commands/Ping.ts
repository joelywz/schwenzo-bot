import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, Interaction } from 'discord.js';
import SchwenzoCommand from '../SchwenzoCommand';

export default class Ping implements SchwenzoCommand {
  data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with pong!');

  async execute(interaction: CommandInteraction) {
    await interaction.reply('Pong!');
  }
}
