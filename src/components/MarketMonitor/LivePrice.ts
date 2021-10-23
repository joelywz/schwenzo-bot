import Binance from 'node-binance-api';

export default class LivePrice {
  private symbol: string;
  private price: number | null;
  constructor(symbol: string) {
    this.symbol = symbol;
    this.price = null;
  }

  setClose(price: number) {
    this.price = price;
  }

  getClosingPrice() {
    return this.price;
  }

  getSymbol() {
    return this.symbol;
  }
}
