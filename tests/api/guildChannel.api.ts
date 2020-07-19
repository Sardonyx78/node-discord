'use strict';

import { BotEvent, Permission } from '../../src/socket/constants';
import Bot from '../../src/structures/bot/Bot';
import PermissionFlags, { PermissibleType } from '../../src/structures/flags/PermissionFlags';
import config from '../config.json';

const bot = new Bot(config.token);
bot.connection.connect();

(async function (): Promise<void> {
  await bot.events.wait(BotEvent.Ready);

  const guildChannel = bot.guilds.get('702476896008405002')?.channels.get('721781755060813914');
  if (!guildChannel) return;

  await guildChannel
    .modify({
      name: guildChannel.name + 'a',
      topic: guildChannel.topic ? guildChannel.topic + 'a' : 'a',
    })
    .catch(() => console.log('Rate limit reached for channel modification'));

  guildChannel.modifyPermissions(
    {
      id: bot.user!.id,
      type: PermissibleType.Member,
    },
    {
      allow: PermissionFlags.build(Permission.SendMessages, Permission.AddReactions),
      deny: PermissionFlags.build(Permission.AttachFiles),
    },
  );

  await bot.events.wait(BotEvent.ChannelUpdate);

  console.log(guildChannel.permissions.get(bot.user!.id)?.allow.has(Permission.AttachFiles)); // expected: false

  console.log('Modified permissions');

  // Create a new invite in the guild channel
  const invite = await guildChannel.createInvite({
    max: {
      age: 15,
      uses: 3,
    },
    unique: true,
  });

  console.log(invite.code, 'newly generated invite code');

  // Delete the overwritten permissions of the bot's user
  guildChannel.deletePermission(bot.user!.id);

  await bot.events.wait(BotEvent.ChannelUpdate);

  console.log(guildChannel.permissions.has(bot.user!.id)); // expected: false
})();

bot.events.on(BotEvent.Debug, console.log);
