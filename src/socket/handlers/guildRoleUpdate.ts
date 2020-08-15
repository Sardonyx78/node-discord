import { Bot } from '../../structures';
import { Payload } from '../BotSocketShard';
import { BotEvent } from '../constants';

export default async ({ d }: Payload, bot: Bot): Promise<void> => {
  const { guild_id: guildId } = d;

  const guild = await bot.guilds.get(guildId);

  // TODO: get or fetch the role
  const role = guild.roles.cache.get(d.role.id);

  if (!role) return;

  const { before, after } = role.update(d.role);

  bot.events.emit(BotEvent.GuildRoleUpdate, before, after);
};
