import Bot from '../../structures/bot/Bot';
import DMChannel from '../../structures/channels/DMChannel';
import GuildTextChannel from '../../structures/channels/GuildTextChannel';
import Message, { PartialMessage } from '../../structures/message/Message';
import ChannelUtils from '../../utils/ChannelUtils';
import { Payload } from '../BotSocketShard';
import { BotEvents, GatewayEvents } from '../constants';

export const run = ({ d }: Payload, bot: Bot): void => {
  const { id, guild_id: guildId, channel_id: channelId } = d;

  const channel = ChannelUtils.find(bot, guildId, channelId);

  // Channel should be either GuildTextChannel or DMChannel
  if (!channel || (!(channel instanceof GuildTextChannel) && !(channel instanceof DMChannel)))
    return;

  const guild = channel instanceof GuildTextChannel ? channel.guild : undefined;

  const message: Message | PartialMessage = channel.messages.get(id) || {
    id,
    guild,
    channel,
  };

  channel.messages.delete(message.id);

  bot.events.emit(BotEvents.MessageDelete, message);
};

export const name = GatewayEvents.MessageDelete;
