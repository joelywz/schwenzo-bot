import fs from 'fs';
import path from 'path';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import SchwenzoCommand from '../core/SchwenzoCommand';
import dotenv from 'dotenv';

importEnv();

const deployType = process.argv.slice(2)[0];
deployType == 'global' ? deployGlobal() : deployDev();

async function deployDev() {
  console.info('Running command deployment for development.');
  const DEV_TOKEN = process.env['DEV_TOKEN'];
  const DEV_GUILD_ID = process.env['DEV_GUILD_ID'];
  const DEV_APP_ID = process.env['DEV_APP_ID'];

  if (!DEV_TOKEN) throw new Error('DEV_TOKEN not found.');
  if (!DEV_GUILD_ID) throw new Error('DEV_GUILD_ID not found.');
  if (!DEV_APP_ID) throw new Error('DEV_APP_ID not found.');

  console.info(`DEV_TOKEN: ${DEV_TOKEN}`);
  console.info(`DEV_GUILD_ID: ${DEV_GUILD_ID}`);
  console.info(`DEV_APP_ID: ${DEV_APP_ID}`);

  const applicationCommand = Routes.applicationGuildCommands(
    DEV_APP_ID,
    DEV_GUILD_ID
  );
  const commands = await generateCommands();

  await deployCommands(DEV_TOKEN, commands, applicationCommand);
  console.info('Succesfully deployed commands!');
}

async function deployGlobal() {
  console.info('Running command deployment globally.');
  const TOKEN = process.env['TOKEN'];
  const APP_ID = process.env['APP_ID'];

  if (!TOKEN) throw new Error('TOKEN not found.');
  if (!APP_ID) throw new Error('APP_ID not found.');

  console.info(`TOKEN: ${TOKEN}`);
  console.info(`APP_ID: ${APP_ID}`);

  const applicationCommand = Routes.applicationCommands(APP_ID);
  const commands = await generateCommands();

  await deployCommands(TOKEN, commands, applicationCommand);
  console.info('Succesfully deployed commands!');
}

function importEnv() {
  try {
    dotenv.config({
      path: path.join(__dirname, '../../.env'),
    });
  } catch {}
}

async function generateCommands() {
  const COMMANDS_PATH = path.join(__dirname, '../commands');
  const commands: any[] = [];
  const commandFiles = fs
    .readdirSync(COMMANDS_PATH)
    .filter((filename) => filename.endsWith('.ts') || filename.endsWith('js'));

  for (const filename of commandFiles) {
    await import(`${COMMANDS_PATH}/${filename}`).then((a) => {
      const command = new a.default() as SchwenzoCommand;
      commands.push(command.data.toJSON());
    });
  }
  return commands;
}

async function deployCommands(token: string, commands: any[], appCmd: any) {
  console.info(`Token: ${token}`);
  const rest = new REST({ version: '9' }).setToken(token);
  try {
    await rest.put(appCmd, {
      body: commands,
    });
    console.log('Successfully registered application commands.');
  } catch (err) {
    console.error(err);
  }
}
