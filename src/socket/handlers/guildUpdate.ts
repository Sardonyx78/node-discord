import Bot from '../../structures/bot/Bot';
import Guild from '../../structures/guild/Guild';
import { Payload } from '../BotSocketShard';
import { BotEvent } from '../constants';

export default ({ d }: Payload, bot: Bot): void => {
  const { id } = d;

  const guild = Guild.find(bot, id);

  if (!guild) return;

  const { before, after } = guild.update(d);

  bot.events.emit(BotEvent.GuildUpdate, before, after);
};