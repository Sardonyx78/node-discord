import { Bot } from '../../bot';
import { ChannelUtils } from '../../structures/channels/utils';
import { Payload } from '../BotSocketShard';
import { BotEvent } from '../constants';

export default async ({ d }: Payload, bot: Bot): Promise<void> => {
  const channel = await ChannelUtils.create(bot, d);

  ChannelUtils.cache(bot, channel);

  bot.events.emit(BotEvent.ChannelCreate, channel);
};
