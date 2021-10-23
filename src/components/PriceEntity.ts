import { MessageEmbed, CommandInteraction } from 'discord.js';
import { fetchTicker24Hrs } from '../utils/binance-api';
import getCryptoIconURL from '../utils/crypto-icons-api';

export default class PriceEntity {
  symbol: string;
  embedPromise: Promise<MessageEmbed | null>;

  constructor(symbol: string) {
    this.symbol = symbol;
    this.embedPromise = new Promise(async (resolve) => {
      resolve(await this.retrieve());
    });
  }

  async retrieve() {
    try {
      const apiSymbol = `${this.symbol.toUpperCase()}USDT`;
      const data = await fetchTicker24Hrs(apiSymbol);

      // Raw Info
      const percentage = parseFloat(data.priceChangePercent);
      const lastPrice = parseFloat(data.lastPrice);
      const highPrice = parseFloat(data.highPrice);
      const lowPrice = parseFloat(data.lowPrice);
      const percentageEmoji =
        percentage >= 0 ? ':green_square:' : ':red_square:';
      // Display
      const dThumbnail = getCryptoIconURL(this.symbol.toLowerCase());
      const dSymbol = `${this.symbol.toUpperCase()}/USDT`;
      const dPercentage = `${percentageEmoji} ${percentage}%`;
      const dPrice = `${lastPrice} USDT`;
      const dHighPrice = `${highPrice} USDT`;
      const dLowPrice = `${lowPrice} USDT`;

      return new MessageEmbed()
        .setThumbnail(dThumbnail)
        .setTitle(dSymbol)
        .setDescription(dPercentage)
        .addField('Price', dPrice, false)
        .addField('24 Hour Highest', dHighPrice, true)
        .addField('24 Hour Lowest', dLowPrice, true)
        .setTimestamp(new Date())
        .setFooter('Provided by Binance');
    } catch (e) {}

    return null;
  }

  async respond(interaction: CommandInteraction) {
    const embed = await this.embedPromise;

    if (embed) {
      interaction.reply({ embeds: [embed] });
    } else {
      interaction.reply('Market not found.');
      setTimeout(() => {
        interaction.deleteReply();
      }, 2000);
    }
  }
}
