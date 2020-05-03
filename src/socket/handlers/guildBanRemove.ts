import User from '../../structures/User';
import Bot from '../../structures/bot/Bot';
import Guild from '../../structures/guild/Guild';
import { Payload } from '../BotSocketShard';
import { GatewayEvents } from '../constants';

export const run = ({ d }: Payload, bot: Bot): void => {
  const guild = Guild.find(bot, d.guild_id);

  const user = new User(bot, d.user);

  // TODO: Guild bans cluster field. Remove user from that cluster

  bot.events.emit(GatewayEvents.GuildBanRemove, guild, user);
};

export const name = GatewayEvents.GuildBanRemove;
