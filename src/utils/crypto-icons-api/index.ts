export default function getCryptoIconURL(symbol: string) {
  symbol = symbol.toLowerCase();
  return `https://api.coinicons.net/icon/${symbol}/128x128`;
}
