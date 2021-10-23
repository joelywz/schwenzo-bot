import SchwenzoBot from './SchwenzoBot';

const DATABASE_URL = process.env['DATABASE_URL'];
const TOKEN = process.env['TOKEN'];

if (!DATABASE_URL) {
  console.error('No database url provided.');
  process.exit();
}

if (!TOKEN) {
  console.error('No token provided.');
  process.exit();
}

const schwenzoBot = new SchwenzoBot(TOKEN);
