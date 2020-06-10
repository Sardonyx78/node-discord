'use strict';

import { BotEvents } from '../../../src/socket/constants';
import Bot from '../../../src/structures/bot/Bot';
import Guild from '../../../src/structures/guild/Guild';
import config from '../../config.json';

const bot = new Bot(config.token);
bot.connection.connect();

bot.events.on(BotEvents.Ready, () => {
  const guild = bot.guilds.last;

  console.log(guild instanceof Guild);
  console.log(guild?.id, 'GUILD ID');

  console.log(guild?.channels.first?.id, 'GUILD FIRST CHANNEL ID');

  console.log(guild?.emojis);
});

bot.events.on(BotEvents.Debug, console.log);
