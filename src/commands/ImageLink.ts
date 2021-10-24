import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, MessageEmbed } from 'discord.js';
import SchwenzoCommand from '../core/SchwenzoCommand';
import { SchwenzoClient } from '../core/SchwenzoBot';
import ImageLinkComponent from '../components/ImageLink';

export default class ImageLink implements SchwenzoCommand {
  imageLink: ImageLinkComponent | null = null;
  client: SchwenzoClient | null = null;
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
    const client = interaction.client as SchwenzoClient;
    if (!this.imageLink) {
      this.imageLink = client.getComponent<ImageLinkComponent>('image-link');

      if (!this.imageLink) throw new Error('Internal error.');
    }

    if (!interaction.guildId) throw new Error('GuildId not found.');

    switch (subcommand) {
      case 'add':
        await this.add(interaction, this.imageLink, interaction.guildId);
        break;
      case 'remove':
        await this.remove(interaction, this.imageLink, interaction.guildId);
        break;
      case 'list':
        await this.list(interaction, this.imageLink, interaction.guildId);
        break;
    }
  }

  async add(
    interaction: CommandInteraction,
    imageLink: ImageLinkComponent,
    guildId: string
  ) {
    await interaction.reply(`Linking image...`);

    const message = interaction.options.getString('message', true);
    const url = interaction.options.getString('image-url', true);

    await imageLink.add(guildId, message, url);
    interaction.editReply(`Image linked to "${message}"`);
  }

  async remove(
    interaction: CommandInteraction,
    imageLink: ImageLinkComponent,
    guildId: string
  ) {
    await interaction.reply(`Unlinking image...`);
    const message = interaction.options.getString('message', true);
    await imageLink.remove(guildId, message);
    await interaction.editReply(`Image unlinked from "${message}"`);
  }

  async list(
    interaction: CommandInteraction,
    imageLink: ImageLinkComponent,
    guildId: string
  ) {
    await interaction.reply(`Listing linked images...`);

    const messages = imageLink.getLinkMessages(guildId);
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
