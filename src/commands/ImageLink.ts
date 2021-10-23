import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, MessageEmbed } from 'discord.js';
import SchwenzoCommand from '../SchwenzoCommand';
import { SchwenzoClient } from '../SchwenzoBot';

export default class Ping implements SchwenzoCommand {
  data = new SlashCommandBuilder()
    .setName('image-link')
    .setDescription('Link a message to an image')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Link a message to an image')
        .addStringOption((option) =>
          option
            .setName('message')
            .setDescription('Message to be linked')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('image-url')
            .setDescription('Image of the url')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Unlink a message to an image')
        .addStringOption((option) =>
          option
            .setName('message')
            .setDescription('Message of the linked image')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('list')
        .setDescription('Show the list of linked messages.')
    ) as SlashCommandBuilder;

  async execute(interaction: CommandInteraction) {
    const subcommand = interaction.options.getSubcommand(true);

    switch (subcommand) {
      case 'add':
        await this.add(interaction);
        break;
      case 'remove':
        await this.remove(interaction);
        break;
      case 'list':
        await this.list(interaction);
        break;
    }
  }

  async add(interaction: CommandInteraction) {
    await interaction.reply(`Linking image...`);
    const client = interaction.client as SchwenzoClient;
    if (!client.imageLink) throw new Error();
    if (!interaction.guildId) throw new Error();

    const message = interaction.options.getString('message', true);
    const url = interaction.options.getString('image-url', true);

    await client.imageLink.add(interaction.guildId, message, url);
    interaction.editReply(`Image linked to "${message}"`);
  }

  async remove(interaction: CommandInteraction) {
    await interaction.reply(`Unlinking image...`);
    const client = interaction.client as SchwenzoClient;
    if (!client.imageLink) throw new Error();
    if (!interaction.guildId) throw new Error();

    const message = interaction.options.getString('message', true);

    await client.imageLink.remove(interaction.guildId, message);
    await interaction.editReply(`Image unlinked from "${message}"`);
  }

  async list(interaction: CommandInteraction) {
    await interaction.reply(`Listing linked images...`);
    const client = interaction.client as SchwenzoClient;
    if (!client.imageLink) throw new Error();
    if (!interaction.guildId) throw new Error();

    const messages = client.imageLink.getLinkMessages(interaction.guildId);
    const embed = new MessageEmbed().setTitle('Linked Images');
    let description = '';

    if (messages.length == 0) {
      description = 'No linked images found.';
    } else {
      messages.map((m) => {
        description += `- ${m}\n`;
      });
    }

    embed.setDescription(description);

    await interaction.followUp({
      embeds: [embed],
    });
  }
}
