import SchwenzoBot from './SchwenzoBot';

const DATABASE_URL = process.env['DATABASE_URL'] || null;
if (!DATABASE_URL) throw 'DATABASE_URL not found.';

const NODE_ENV = process.env['NODE_ENV'] || 'production';
NODE_ENV == 'production' ? production() : development();

function production() {
  console.info('\nRunning for production.\n');
  const TOKEN = process.env['TOKEN'] || null;
  if (!TOKEN) throw 'TOKEN not found.';

  new SchwenzoBot(TOKEN);
}

function development() {
  console.info('\nRunning for development.\n');
  const DEV_TOKEN = process.env['DEV_TOKEN'] || null;
  if (!DEV_TOKEN) throw 'DEV_TOKEN not found';

  new SchwenzoBot(DEV_TOKEN);
}
