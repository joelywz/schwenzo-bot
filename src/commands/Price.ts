import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import PriceEntity from '../components/PriceEntity';
import SchwenzoCommand from '../core/SchwenzoCommand';
import CacheManager from '../utils/cache-manager/CacheManager';

export default class Price implements SchwenzoCommand {
  data = new SlashCommandBuilder()
    .setName('price')
    .setDescription('Check the price of cypto.')
    .addStringOption((symbol) =>
      symbol
        .setName('symbol')
        .setDescription('Symbol of the market.')
        .setRequired(true)
    ) as SlashCommandBuilder;

  cacheManager = new CacheManager<PriceEntity>();

  async execute(interaction: CommandInteraction) {
    const symbol = interaction.options.getString('symbol', true).toUpperCase();

    let priceEntity = this.cacheManager.getCache(symbol, () => {
      return { t: new PriceEntity(symbol), duration: 10000 };
    });

    await priceEntity.respond(interaction);
  }
}
