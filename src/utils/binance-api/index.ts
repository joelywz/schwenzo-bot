import axios from 'axios';

export interface Ticker24Hrs {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: string;
  closeTime: string;
  firstId: string;
  lastId: string;
  count: string;
}

export async function fetchTicker24Hrs(symbol: string): Promise<Ticker24Hrs> {
  const response = await axios.get(
    'https://api.binance.com/api/v3/ticker/24hr',
    {
      params: {
        symbol,
      },
    }
  );

  return response.data as Ticker24Hrs;
}

export async function marketDoesExist(symbol: string): Promise<boolean> {
  try {
    await axios.get(`https://api.binance.com/api/v3/exchangeInfo`, {
      params: {
        symbol,
      },
    });
    return true;
  } catch (e) {
    return false;
  }
}

export function beautifyPrice(price: string, suffix: string) {
  return parseFloat(price).toString() + ` ${suffix}`;
}

// symbol: CAKEUSDT,
// priceChange: 015000000,
// priceChangePercent: 0763,
// weightedAvgPrice: 19'75199907,
// prevClosePrice: 1966000000,
// lastPrice: 1982000000,
// lastQty: 1630000000,
// bidPrice: 1981000000,
// bidQty: 50171000000,
// askPrice: 1982000000,
// askQty: 40165000000,
// openPrice: 1967000000,
// highPrice: 1991000000,
// lowPrice: 1950000000,
// volume: 136926658000000,
// quoteVolume: 2704575221090000,
// openTime: 1634390819040,
// closeTime: 1634477219040,
// firstId: 43101030,
// lastId: 43144539,
// count: 43510
