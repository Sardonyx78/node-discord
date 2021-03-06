'use strict';

import { MessageCreate } from './MessageCreate';
import { MessageDelete } from './MessageDelete';
import { Bot } from '../../../src/bot';
import { BotEvent } from '../../../src/socket';
import config from '../../config.json';

const bot = new Bot(config.token);
bot.connection.connect();

(async function (): Promise<void> {
  await bot.events.wait(BotEvent.Ready);

  new MessageCreate(bot);
  new MessageDelete(bot);
})();

bot.events.on(BotEvent.Debug, console.log);
