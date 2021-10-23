import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

export default abstract class SchwenzoCommand {
  abstract data: SlashCommandBuilder;
  abstract execute: (i: CommandInteraction) => Promise<any>;
}
