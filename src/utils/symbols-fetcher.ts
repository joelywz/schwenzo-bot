// Script should be execcuted independently to generate an array
// of symbols available in binance

import axios from 'axios';
import fs from 'fs';
import path from 'path';

(async () => {
  const response = await axios.get(
    'https://api.binance.com/api/v3/exchangeInfo'
  );
  const data = response.data as { [keys: string]: any };
  let rawSymbols: Object[] = data['symbols'];

  let symbols = rawSymbols.map((symbol: any) => symbol['symbol']);
  let symbolsString = "export default ['" + symbols.join("','") + "']";

  fs.writeFile(path.join(__dirname, 'symbols.ts'), symbolsString, (err) => {
    if (err) {
      console.log('error occured');
    } else {
      console.log('Fetched');
    }
  });
})();
