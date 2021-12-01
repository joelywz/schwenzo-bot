import ImageBlob from './components/ImageBlob';
import ImageLink from './components/ImageLink';
import MarketMonitor from './components/MarketMonitor/MarketMonitor';
import StatusPrice, { StatusMarket } from './components/StatusPrice';
import SchwenzoBot from './core/SchwenzoBot';

const DATABASE_URL = process.env['DATABASE_URL'] || null;
if (!DATABASE_URL) throw 'DATABASE_URL not found.';

const NODE_ENV = process.env['NODE_ENV'] || 'production';
NODE_ENV == 'production' ? production() : development();

function production() {
  console.info('\nRunning for production.\n');
  const TOKEN = process.env['TOKEN'] || null;
  if (!TOKEN) throw 'TOKEN not found.';

  initBot(TOKEN);
}

function development() {
  console.info('\nRunning for development.\n');
  const DEV_TOKEN = process.env['DEV_TOKEN'] || null;
  if (!DEV_TOKEN) throw 'DEV_TOKEN not found';

  initBot(DEV_TOKEN);
}

function initBot(token: string) {
  const IMAGE_BLOB_DIR = process.env['IMAGE_BLOB_DIR'];
  if (!IMAGE_BLOB_DIR) throw 'IMAGE_BLOB_DIR not found.';

  const bot = new SchwenzoBot(token);
  const imageBlob = new ImageBlob(IMAGE_BLOB_DIR);

  bot.addComponent('market-monitor', new MarketMonitor(bot.client));
  bot.addComponent('image-link', new ImageLink(bot.client, imageBlob, 256));
  bot.addComponent('status-price', new StatusPrice(bot.client, 15 * 1000));
  (bot.getComponent('status-price') as StatusPrice).addMarket("klima-dao", "KLIMA");
  (bot.getComponent('status-price') as StatusPrice).addMarket("wonderland", "TIME");
  (bot.getComponent('status-price') as StatusPrice).addMarket("hector-dao", "HEC");
}
