import { ActivityTypes } from "discord.js/typings/enums";
import Component from "../core/Component";
import { SchwenzoClient } from "../core/SchwenzoBot";
import CoinGecko from 'coingecko-api';

export class StatusMarket {
  id: string;
  name: string;
  coingecko: CoinGecko;
  price: number = 0;

  constructor(id: string, name: string, coingecko: CoinGecko) {
    this.id = id;
    this.name = name;
    this.coingecko = coingecko;
  }

  async retrieve() {
    try {
      const { data } = await this.coingecko.coins.fetch(this.id, {
        market_data: true,
      })
      this.price = data.market_data.current_price.usd;
    } catch (e) {
      this.price = 0;
    }
  }
}


export default class StatusPrice extends Component{
  
  statusIndex: number = 0;
  markets: StatusMarket[] = [];
  readonly coingecko: CoinGecko = new CoinGecko();
  readonly interval: number;

  constructor(client: SchwenzoClient, interval: number) {
    super(client)
    this.interval = interval;
    this.updatePrice = this.updatePrice.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
  }

  onReady(): void | Promise<void> {
    this.updatePrice();
    setInterval(() => {
      this.updatePrice();
    }, this.interval);

    setInterval(() => {
      this.updateStatus()
    }, 5000)
  }

  addMarket(id: string, name: string) {
    this.markets.push(new StatusMarket(id, name, this.coingecko));
  }

  async updatePrice() {
    for (const statusMarket of this.markets) {
      statusMarket.retrieve();
    }
  }

  updateStatus() {

    const market = this.markets[this.statusIndex];

    const text: string = `${market.name} @ ${market.price}$`;

    this.client.user?.setActivity(text, {
      type: ActivityTypes.WATCHING,
    });


    if (this.statusIndex == this.markets.length - 1) {
      this.statusIndex = 0
      return;
    }

    this.statusIndex++;
  }

}