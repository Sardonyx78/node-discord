'use strict';

import { BotEvent } from '../../src/socket/constants';
import Bot from '../../src/structures/bot/Bot';
import Member from '../../src/structures/member/Member';
import config from '../config.json';

const bot = new Bot(config.token);
bot.connection.connect();

(async function (): Promise<void> {
  bot.events.on(BotEvent.GuildMemberAdd, (member: Member) => {
    console.log(member.id, member.user?.username, member.nick, member.guild.name);
  });

  await bot.events.wait(BotEvent.Ready);
})();

bot.events.on(BotEvent.Debug, console.log);