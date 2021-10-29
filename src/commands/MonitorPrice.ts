import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, Interaction, MessageEmbed } from 'discord.js';
import MarketMonitor from '../components/MarketMonitor/MarketMonitor';
import { SchwenzoClient } from '../core/SchwenzoBot';
import SchwenzoCommand from '../core/SchwenzoCommand';

export default class Ping implements SchwenzoCommand {
  marketMonitor: MarketMonitor | null = null;
  data = new SlashCommandBuilder()
    .setName('monitor')
    .setDescription('Monitor price')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Add a market to be monitored.')
        .addStringOption((option) =>
          option
            .setName('symbol')
            .setDescription('Symbol of the market, BTC, ETH, ADA etc.')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Remove a market from monitoring list.')
        .addStringOption((option) =>
          option
            .setName('symbol')
            .setDescription('Symbol of the market, BTC, ETH, ADA etc.')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('start')
        .setDescription('Start monitoring market in this curent channel.')
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('stop').setDescription('Stop monitoring market')
    ) as SlashCommandBuilder;

  async execute(interaction: CommandInteraction) {
    if (!this.marketMonitor) {
      this.marketMonitor = (interaction.client as SchwenzoClient).getComponent(
        'market-monitor'
      ) as MarketMonitor;
    }
    if (!this.marketMonitor) interaction.reply('An error occured');

    const subcommand = interaction.options.getSubcommand(true);

    switch (subcommand) {
      case 'add':
        await this.add(interaction);
        break;
      case 'remove':
        await this.remove(interaction);
        break;
      case 'start':
        await this.start(interaction);
        break;
      case 'stop':
        await this.stop(interaction);
        break;
    }
  }

  async add(interaction: CommandInteraction) {
    if (!interaction.guildId) throw new Error();
    if (!this.marketMonitor) throw new Error();

    // Obtain symbol field
    const symbol = interaction.options.getString('symbol', true);

    // Try to add symbol to monitor
    await this.marketMonitor.watch(interaction.guildId, symbol);

    // Success reply
    await interaction.reply({
      content: `Successfully added ${symbol.toUpperCase()}/USDT to monitor list.`,
      ephemeral: true,
    });
  }

  async remove(interaction: CommandInteraction) {
    if (!interaction.guildId) throw new Error();
    if (!this.marketMonitor) throw new Error();

    // Obtain symbol field
    const symbol = interaction.options.getString('symbol', true);

    // Try to remove symbol
    await this.marketMonitor.unwatch(interaction.guildId, symbol);

    // Success reply
    await interaction.reply({
      content: `Successfully removed ${symbol}/USDT from monitor list.`,
      ephemeral: true,
    });
  }

  async start(interaction: CommandInteraction) {
    if (!interaction.guildId) return interaction.reply('An error occured');
    if (!this.marketMonitor) return interaction.reply('An error occured');

    // Create monitor
    if (!interaction.channel) throw new Error();

    // Link Monitor
    await interaction.reply({
      embeds: [new MessageEmbed().setTitle('Loading...')],
    });
    const message = await interaction.fetchReply();
    await this.marketMonitor.registerMessage(
      interaction.guildId,
      interaction.channelId,
      message.id
    );
  }

  async stop(interaction: CommandInteraction) {
    if (!interaction.guildId) throw new Error();
    if (!this.marketMonitor) throw new Error();

    await this.marketMonitor.unregisterMessage(interaction.guildId);
    interaction.reply({
      content: 'Monitor has been removed!',
      ephemeral: true,
    });
  }
}
