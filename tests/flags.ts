'use strict';

import config from './config.json';
import { BotEvent } from '../src/socket/constants';
import { Permission } from '../src/socket/constants';
import Bot from '../src/structures/bot/Bot';

const bot = new Bot(config.token);
bot.connection.connect();

(async function (): Promise<void> {
  await bot.events.wait(BotEvent.Ready);

  const role = bot.guilds.get('702476896008405002')?.roles.get('706861476752785461');
  console.log(role?.permissions.has(Permission.Administrator), 'has permission');
})();

bot.events.on(BotEvent.Debug, console.log);