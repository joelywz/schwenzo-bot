# Schwenzo Bot

## Features
- Monitor cryptocurrency prices.
- Link images to messages.

## Node
```npm run dev```  
To start the bot in a development environment.

```npm run deploy-commands```  
To deploy commands to development guild.

```npm run deploy-commands:global```  
To deploy commands globablly

```npm run build```  
To build the source.

```npm start```  
To start the bot in a production environment.

## Environment Variables

### Production
```DATABASE_URL```  
URL of the the database to be stored.

```IMAGE_BLOB_DIR```  
Directory of the images to be stored.

```TOKEN```  
Token of the discord bot.

```APP_ID```  
App ID of the discord bot for deploying commands globally.

### Development
```DATABASE_URL```  
URL of the the database to be stored.

```IMAGE_BLOB_DIR```  
Directory of the images to be stored.

```DEV_TOKEN```  
Token of the discord bot.

```DEV_APP_ID```  
App ID of the discord bot for deploying commands to a guild.

```DEV_GUILD_ID```  
Guild ID for deploying commands to a guild.
