import APISerializer from './APISerializer';
import Cluster from '../../Cluster';
import { EndpointRoute, HttpMethod } from '../../socket/endpoints';
import Requests, { Params } from '../../socket/rateLimit/Requests';
import { Snowflake } from '../../types/types';
import ChannelUtils from '../../utils/ChannelUtils';
import { GatewayStruct } from '../BaseStruct';
import Emoji, { EmojiResolvable } from '../Emoji';
import Invite, { InviteOptions } from '../Invite';
import PermissionOverwrite from '../PermissionOverwrite';
import User from '../User';
import Bot from '../bot/Bot';
import Channel from '../channels/Channel';
import DMChannel from '../channels/DMChannel';
import GuildChannel, { GuildChannelOptions } from '../channels/GuildChannel';
import GuildTextChannel from '../channels/GuildTextChannel';
import { FetchGuildOptions } from '../controllers/BotGuildsController';
import { FetchInviteOptions } from '../controllers/GuildInvitesController';
import { FetchReactionUsersOptions } from '../controllers/ReactionUsersController';
import { Permissible, PermissionOverwriteFlags } from '../flags/PermissionFlags';
import Guild from '../guild/Guild';
import GuildEmoji, { CreateEmojiOptions, ModifyEmojiOptions } from '../guild/GuildEmoji';
import GuildPreview from '../guild/GuildPreview';
import Message, { MessageData, MessageEditData, MessageOptions } from '../message/Message';
import MessageEmbed from '../message/MessageEmbed';

/**
 * Creates all outgoing API requests
 */
class BotAPI {
  /**
   * The bot instance
   */
  private readonly bot: Bot;

  /**
   * The bot's token
   */
  private readonly token: string;

  /**
   * Manages all outgoing API requests
   */
  private readonly requests: Requests;

  constructor(bot: Bot, token: string) {
    this.bot = bot;
    this.token = token;

    this.requests = new Requests(this.bot, this.token);
  }

  /**
   * Fetches a channel by its ID
   * @param {Snowflake} channelId The ID of the channel you wish to fetch
   * @returns {Promise<Channel>}
   */
  public async fetchChannel(channelId: Snowflake): Promise<Channel> {
    const channel = await this.requests.send(EndpointRoute.Channel, { channelId }, HttpMethod.Get);

    return new Channel(this.bot, channel!);
  }

  /**
   * Fetches a guild channel by its ID
   * @param {Snowflake} channelId The ID of the guild channel you wish to fetch
   * @returns {Promise<GuildChannel>}
   */
  public async fetchGuildChannel(channelId: Snowflake): Promise<GuildChannel> {
    const channel = await this.fetchChannel(channelId);

    return ChannelUtils.createGuildChannel(this.bot, channel.structure);
  }

  /**
   * Fetches a DM channel by its ID
   * @param {Snowflake} channelId The ID of the DM channel you wish to fetch
   * @returns {Promise<DMChannel>}
   */
  public async fetchDMChannel(channelId: Snowflake): Promise<DMChannel> {
    const channel = await this.fetchChannel(channelId);

    return ChannelUtils.createDMChannel(this.bot, channel.structure);
  }

  /**
   * Updates a {@link GuildChannel}'s settings. Requires the {@link Permission.ManageChannels} permission for the guild
   * @param {Snowflake} channelId The ID of the modified channel
   * @param {GuildChannelOptions} options The modified channel's settings
   * @returns {Promise<GuildChannel>}
   */
  public async modifyGuildChannel(
    channelId: Snowflake,
    options: GuildChannelOptions,
  ): Promise<GuildChannel> {
    const channelData = await this.requests.send(
      EndpointRoute.Channel,
      { channelId },
      HttpMethod.Patch,
      APISerializer.guildChannelOptions(options),
    );

    return ChannelUtils.createGuildChannel(this.bot, channelData!);
  }

  /**
   * Deletes a {@link GuildChannel}, or closes a {@link DMChannel}.
   * Requires the {@link Permission.ManageChannels} permission for the guild
   * @param {Snowflake} channelId The ID of the channel
   * @returns {Promise<Channel>}
   */
  public async deleteChannel(channelId: Snowflake): Promise<Channel> {
    const channelData = await this.requests.send(
      EndpointRoute.Channel,
      { channelId },
      HttpMethod.Delete,
    );

    return ChannelUtils.create(this.bot, channelData!);
  }

  /**
   * Deletes a {@link GuildChannel}.
   * Requires the {@link Permission.ManageChannels} permission for the guild
   * @param {Snowflake} channelId The ID of the guild channel you wish to delete
   * @returns {Promise<GuildChannel>}
   */
  public async deleteGuildChannel(channelId: Snowflake): Promise<GuildChannel> {
    const channel = await this.deleteChannel(channelId);

    if (!(channel instanceof GuildChannel)) {
      throw new TypeError('The deleted channel is a DM channel');
    }

    return channel;
  }

  /**
   * Fetches a message in a text channel by their IDs
   * @param {Snowflake} channelId The ID of the channel that contains the message
   * @param {Snowflake} messageId The ID of the message you wish to fetch
   * @returns {Promise<Message>}
   */
  public async fetchMessage(channelId: Snowflake, messageId: Snowflake): Promise<Message> {
    const message = await this.requests.send(
      EndpointRoute.ChannelMessage,
      { channelId, messageId },
      HttpMethod.Get,
    );

    const channel = await this.bot.channels.get(channelId);

    if (!(channel instanceof DMChannel || channel instanceof GuildTextChannel)) {
      throw new TypeError('The channel is not a valid text channel');
    }

    return new Message(this.bot, message!, channel);
  }

  // TODO: Add the ability to send files and attachments
  /**
   * Posts a message to a {@link GuildTextChannel} or {@link DMChannel}.
   * If operating on a {@link GuildTextChannel}, this requires the {@link Permission.SendMessages} permission.
   * If the {@link MessageOptions.tts} field is set to true, the {@link Permission.SendTTSMessages} permission is required
   * @param {Snowflake} channelId The ID of the channel to send the message in
   * @param {string | MessageData | MessageEmbed} data The message data.
   * Can be:
   * 1. Raw content to be sent as a message
   * @example ```typescript
   * channel.sendMessage('Hello World!');
   * ```
   * 2. A {@link MessageData} object, containing content and/or embed
   * @example ```typescript
   * channel.sendMessage({ content: 'Hello World!', embed: { title: 'My Embed!' } });
   * ```
   * 3. A {@link MessageEmbed} instance
   * @param {MessageOptions} options The message's options
   * @returns {Promise<Message>}
   */
  public async sendMessage(
    channelId: Snowflake,
    data: string | MessageData | MessageEmbed,
    options?: MessageOptions,
  ): Promise<Message> {
    // Default params to be sent in the request
    const params: Params = { ...options };

    if (typeof data === 'string') {
      // The params should only include the raw content
      params['content'] = data;
    } else if (data instanceof MessageEmbed) {
      // The params should only include the given embed structure
      params['embed'] = data.structure;
    } else {
      // The params should include all given data fields
      Object.assign(params, APISerializer.messageData(data));
    }

    const messageData = await this.requests.send(
      EndpointRoute.ChannelMessages,
      { channelId },
      HttpMethod.Post,
      params,
    );

    const channel = await this.bot.channels.get(channelId);

    if (!(channel instanceof DMChannel || channel instanceof GuildTextChannel)) {
      throw new TypeError('The channel is not a valid text channel');
    }

    return new Message(this.bot, messageData!, channel);
  }

  /**
   * Creates a reaction for a message. This method requires the {@link Permission.ReadMessageHistory} permission to be present on the Bot. Additionally, if nobody else has reacted to the message using this emoji, this method requires the {@link Permission.AddReactions} permission to be present on the Bot.
   * @param {Snowflake} channelId The ID of the channel containing the message
   * @param {Snowflake} messageId The ID of the message to react to
   * @param {string} emoji The emoji to react with to the message
   * @returns {Promise<void>}
   */
  public async addMessageReaction(
    channelId: Snowflake,
    messageId: Snowflake,
    emoji: EmojiResolvable,
  ): Promise<void> {
    const identifier = Emoji.resolve(this.bot.emojis, emoji);

    if (!identifier) {
      throw new Error(
        `Invalid emoji for addMessageReaction request to channel (${channelId}) message (${messageId}) emoji (${emoji})`,
      );
    }

    await this.requests.send(
      EndpointRoute.ChannelMessagesReactionsEmojiUser,
      { channelId, messageId, emoji: encodeURI(identifier) },
      HttpMethod.Put,
    );
  }

  /**
   * Deletes a reaction a user reacted with.
   * If no `userId` argument was provided, the Bot will remove its own reaction.
   * @param {Snowflake} channelId The ID of the channel containing the message
   * @param {Snowflake} messageId The ID of the message to react to
   * @param {EmojiResolvable} emoji The emoji to delete from the message
   * @param {Snowflake} userId The ID of the user of which reaction should be removed
   * @returns {Promise<void>}
   */
  public async removeMessageReaction(
    channelId: Snowflake,
    messageId: Snowflake,
    emoji: EmojiResolvable,
    userId: Snowflake = '@me',
  ): Promise<void> {
    const identifier = Emoji.resolve(this.bot.emojis, emoji);

    if (!identifier) {
      throw new Error(
        `Invalid emoji for removeMessageReaction request to channel (${channelId}) message (${messageId}) emoji (${emoji}) user ${userId}`,
      );
    }

    await this.requests.send(
      EndpointRoute.ChannelMessagesReactionsEmojiUser,
      {
        channelId,
        messageId,
        emoji: encodeURI(identifier),
        userId,
      },
      HttpMethod.Delete,
    );
  }

  /**
   * Fetches a list of users that reacted with a particular emoji on a message
   * @param {Snowflake} channelId The ID of the channel that contains the message
   * @param {Snowflake} messageId The ID of the message
   * @param {string} emoji The emoji the users reacted with
   * @param {FetchReactionUsersOptions} options A set of options for this operation
   * @returns {Promise<Cluster<Snowflake, User>>}
   */
  public async fetchReactionUsers(
    channelId: Snowflake,
    messageId: Snowflake,
    emoji: string,
    options?: FetchReactionUsersOptions,
  ): Promise<Cluster<Snowflake, User>> {
    const users = (await this.requests.send(
      EndpointRoute.ChannelMessagesReactionsEmoji,
      {
        channelId,
        messageId,
        emoji,
      },
      HttpMethod.Get,
      APISerializer.fetchReactionUsersOptions(options),
    )) as GatewayStruct[];

    return new Cluster<Snowflake, User>(users.map(user => [user.id, new User(this.bot, user)]));
  }

  /**
   * Removes all reactions on a message. This method requires the {@link Permission.ManageMessages} permission to be present on the Bot
   * @param {Snowflake} channelId The ID of the channel containing the message
   * @param {Snowflake} messageId The ID of the message of which to remove all reactions
   * @returns {Promise<void>}
   */
  public async removeMessageReactions(channelId: Snowflake, messageId: Snowflake): Promise<void> {
    await this.requests.send(
      EndpointRoute.ChannelMessagesReactions,
      {
        channelId,
        messageId,
      },
      HttpMethod.Delete,
    );
  }

  /**
   * Deletes all reactions for an emoji. This method requires the {@link Permission.ManageMessages} permission ot be present on the Bot.
   * @param {Snowflake} channelId The ID of the channel containing the message
   * @param {Snowflake} messageId The ID of the message of which to remove all reactions for a given emoji
   * @param {EmojiResolvable} emoji The reaction emoji you wish to delete
   * @returns {Promise<void>}
   */
  public async removeMessageReactionsEmoji(
    channelId: Snowflake,
    messageId: Snowflake,
    emoji: EmojiResolvable,
  ): Promise<void> {
    const identifier = Emoji.resolve(this.bot.emojis, emoji);

    if (!identifier) {
      throw new Error(
        `Invalid emoji for removeMessageReactionsEmoji request to channel (${channelId}) message (${messageId}) emoji (${emoji})`,
      );
    }

    await this.requests.send(
      EndpointRoute.ChannelMessagesReactionsEmoji,
      {
        channelId,
        messageId,
        emoji: encodeURI(identifier),
      },
      HttpMethod.Delete,
    );
  }

  /**
   * Edits a previously sent message.
   * The fields `content`, `embed` and `flags` can be edited by the original message author. Other users can only edit `flags` and only if they have the {@link Permission.ManageMessages} permission in the corresponding channel.
   * @param {Snowflake} channelId The ID of the channel that contains the message you wish to edit
   * @param {Snowflake} messageId The ID of the message you wish to edit
   * @param {string | MessageEditData} data The updated message data.
   * Can be:
   * 1. Raw content to be edited to
   * @example ```typescript
   * message.edit('Updated content!');
   * ```
   * 2. A {@link MessageEditData} object, containing any of the fields
   * @example ```typescript
   * message.edit({ content: 'Updated content!', embed: { title: 'My Embed!' } });
   * ```
   * @returns {Promise<Message>}
   */
  public async editMessage(
    channelId: Snowflake,
    messageId: Snowflake,
    data: string | MessageEditData,
  ): Promise<Message> {
    const params: Params = {};

    if (typeof data === 'string') {
      // The given data is the new message content
      params['content'] = data;
    } else {
      // The given data should be passed to the endpoint
      Object.assign(params, { ...APISerializer.messageData(data), flags: data.flags?.bits });
    }

    const messageData = await this.requests.send(
      EndpointRoute.ChannelMessage,
      { channelId, messageId },
      HttpMethod.Patch,
      params,
    );

    const channel = await this.bot.channels.get(channelId);

    if (!(channel instanceof GuildTextChannel)) {
      throw new TypeError('The channel is not a valid text channel');
    }

    return new Message(this.bot, messageData!, channel);
  }

  /**
   * Deletes a message.
   * If operating on a {@link GuildChannel} and trying to delete a message that was not sent by the current user, this endpoint requires the {@link Permission.ManageMessages} permission
   * @param {Snowflake} channelId The ID of the channel that contains the message you wish to delete
   * @param {Snowflake} messageId The ID of the message you wish to delete
   * @returns {Promise<void>}
   */
  public async deleteMessage(channelId: Snowflake, messageId: Snowflake): Promise<void> {
    await this.requests.send(
      EndpointRoute.ChannelMessage,
      { channelId, messageId },
      HttpMethod.Delete,
    );
  }

  /**
   * Deletes multiple messages in a single request.
   * Requires the {@link Permission.ManageMessages} permission
   * @param {Snowflake} channelId The channel ID that contains the messages you wish to delete
   * @param {Snowflake[]} messages An array of the messages IDs you wish to delete
   * @returns {Promise<void>}
   */
  public async bulkDeleteMessages(channelId: Snowflake, messages: Snowflake[]): Promise<void> {
    await this.requests.send(
      EndpointRoute.ChannelMessagesBulkDelete,
      { channelId },
      HttpMethod.Post,
      {
        messages,
      },
    );
  }

  /**
   * Modifies the channel permission overwrites for a member or a role.
   * Requires the {@link Permission.ManageRoles} permission
   * @param {Snowflake} channelId The ID of the channel for which to overwrite the permissions
   * @param {Permissible} permissible Data for the member or role
   * @param {PermissionOverwriteFlags} flags The permissions you wish to modify
   * @returns {Promise<void>}
   */
  public async modifyGuildChannelPermissions(
    channelId: Snowflake,
    permissible: Permissible,
    flags: PermissionOverwriteFlags,
  ): Promise<PermissionOverwrite> {
    const params = APISerializer.guildChannelPermissions(permissible, flags);

    await this.requests.send(
      EndpointRoute.ChannelPermissionsOverwrite,
      { channelId, overwriteId: permissible.id },
      HttpMethod.Put,
      params,
    );

    const channel = await this.bot.channels.get(channelId);

    if (!(channel instanceof GuildChannel)) {
      throw new TypeError('The channel is not a guild channel');
    }

    return new PermissionOverwrite(this.bot, { ...params, id: permissible.id }, channel);
  }

  /**
   * Fetches a list of invites for a channel.
   * Requires the {@link Permission.ManageChannels} permission
   * @param {Snowflake} channelId The ID of the channel to fetch invites in
   * @returns {Promise<Cluster<string, Invite>>}
   */
  public async fetchChannelInvites(channelId: Snowflake): Promise<Cluster<string, Invite>> {
    const invites = (await this.requests.send(
      EndpointRoute.ChannelInvites,
      { channelId },
      HttpMethod.Get,
    )) as GatewayStruct[];

    return new Cluster<string, Invite>(
      invites.map(invite => [invite.code, new Invite(this.bot, invite)]),
    );
  }

  /**
   * Creates a new invite for a guild channel.
   * Requires the {@link Permission.CreateInstantInvite} permission
   * @param {Snowflake} channelId The ID of the channel to create the invite for
   * @param {InviteOptions} options The new invite options
   * @returns {Promise<Invite>}
   */
  public async createChannelInvite(channelId: Snowflake, options?: InviteOptions): Promise<Invite> {
    const invite = await this.requests.send(
      EndpointRoute.ChannelInvites,
      { channelId },
      HttpMethod.Post,
      APISerializer.inviteOptions(options),
    );

    return new Invite(this.bot, invite!);
  }

  /**
   * Deletes a channel permission overwrite for a user or role in a guild channel.
   * Requires the {@link Permission.ManageRoles} permission
   * @param {Snowflake} channelId The ID of the channel that contains the permission overwrite you wish to delete
   * @param {Snowflake} permissible The ID of the user or role you wish to delete from the channel's permission overwrites
   * @returns {Promise<void>}
   */
  public async deleteGuildChannelPermission(
    channelId: Snowflake,
    permissible: Snowflake,
  ): Promise<void> {
    await this.requests.send(
      EndpointRoute.ChannelPermissionsOverwrite,
      { channelId, overwriteId: permissible },
      HttpMethod.Delete,
    );
  }

  /**
   * Posts a typing indicator for a specified text channel.
   * Useful when the bot is responding to a command and expects the computation to take a few seconds.
   * This method may be called to let the user know that the bot is processing their message.
   * @param {Snowflake} channelId The ID of the text channel to trigger typing in
   * @returns {Promise<void>}
   */
  public async triggerTextChannelTyping(channelId: Snowflake): Promise<void> {
    await this.requests.send(EndpointRoute.ChannelTyping, { channelId }, HttpMethod.Post);
  }

  /**
   * Fetches all pinned messages in a text channel
   * @param {Snowflake} channelId The ID of the channel
   * @returns {Promise<Cluster<Snowflake, Message>>}
   */
  public async fetchChannelPins(channelId: Snowflake): Promise<Cluster<Snowflake, Message>> {
    const pins = (await this.requests.send(
      EndpointRoute.ChannelPins,
      { channelId },
      HttpMethod.Get,
    )) as GatewayStruct[];

    const channel = await this.bot.channels.get(channelId);

    if (!(channel instanceof DMChannel || channel instanceof GuildTextChannel)) {
      throw new TypeError('The channel is not a valid text channel');
    }

    return new Cluster<Snowflake, Message>(
      pins.map(pin => [pin.id, new Message(this.bot, pin, channel)]),
    );
  }

  /**
   * Pins a message in a text channel.
   * Requires the {@link Permission.ManageMessages} permission
   * @param {Snowflake} channelId The ID of the channel that contains the message you wish to pin
   * @param {Snowflake} messageId The ID of the message you wish to pin
   * @returns {Promise<void>}
   */
  public async pinMessage(channelId: Snowflake, messageId: Snowflake): Promise<void> {
    await this.requests.send(
      EndpointRoute.ChannelPinsMessage,
      { channelId, messageId },
      HttpMethod.Put,
    );
  }

  /**
   * Unpins a message in a text channel.
   * Requires the {@link Permission.ManageMessages} permission
   * @param {Snowflake} channelId The ID of the channel that contains the message you wish to unpin
   * @param {Snowflake} messageId The ID of the message you wish to unpin
   * @returns {Promise<void>}
   */
  public async unpinMessage(channelId: Snowflake, messageId: Snowflake): Promise<void> {
    await this.requests.send(
      EndpointRoute.ChannelPinsMessage,
      { channelId, messageId },
      HttpMethod.Delete,
    );
  }

  /**
   * Fetches all emojis in a guild
   * @param {Snowflake} guildId The ID of the guild
   * @returns {Promise<Cluster<Snowflake, GuildEmoji>>}
   */
  public async fetchGuildEmojis(guildId: Snowflake): Promise<Cluster<Snowflake, GuildEmoji>> {
    const emojis = (await this.requests.send(
      EndpointRoute.GuildEmojis,
      { guildId },
      HttpMethod.Get,
    )) as GatewayStruct[];

    const guild = await this.bot.guilds.get(guildId);

    return new Cluster<Snowflake, GuildEmoji>(
      emojis.map(emoji => [emoji.id, new GuildEmoji(this.bot, emoji, guild)]),
    );
  }

  /**
   * Fetches an emoji in a given guild
   * @param {Snowflake} guildId The ID of the guild
   * @param {Snowflake} emojiId The ID of the emoji
   * @returns {Promise<GuildEmoji>}
   */
  public async fetchGuildEmoji(guildId: Snowflake, emojiId: Snowflake): Promise<GuildEmoji> {
    const emoji = await this.requests.send(
      EndpointRoute.GuildEmoji,
      { guildId, emojiId },
      HttpMethod.Get,
    );

    const guild = await this.bot.guilds.get(guildId);

    return new GuildEmoji(this.bot, emoji!, guild);
  }

  /**
   * Creates a new emoji for a guild.
   * Requires the {@link Permission.ManageEmojis} permission
   * @param {Snowflake} guildId The ID of the guild
   * @param {CreateEmojiOptions} options The options for the new emoji
   * @returns {Promise<GuildEmoji>}
   */
  public async createGuildEmoji(
    guildId: Snowflake,
    options: CreateEmojiOptions,
  ): Promise<GuildEmoji> {
    const emoji = await this.requests.send(
      EndpointRoute.GuildEmojis,
      { guildId },
      HttpMethod.Post,
      APISerializer.emojiOptions(options),
    );

    const guild = await this.bot.guilds.get(guildId);

    return new GuildEmoji(this.bot, emoji!, guild);
  }

  /**
   * Modifies a given guild emoji.
   * Requires the {@link Permission.ManageEmojis} permission
   * @param {Snowflake} guildId The ID of the guild
   * @param {Snowflake} emojiId The ID of the emoji
   * @param {ModifyEmojiOptions} options The options for the updated emoji
   * @returns {Promise<GuildEmoji>} The updated emoji
   */
  public async modifyGuildEmoji(
    guildId: Snowflake,
    emojiId: Snowflake,
    options: ModifyEmojiOptions,
  ): Promise<GuildEmoji> {
    const emoji = await this.requests.send(
      EndpointRoute.GuildEmoji,
      { guildId, emojiId },
      HttpMethod.Patch,
      APISerializer.emojiOptions(options),
    );

    const guild = await this.bot.guilds.get(guildId);

    return new GuildEmoji(this.bot, emoji!, guild);
  }

  /**
   * Deletes a given guild emoji
   * @param {Snowflake} guildId The ID of the guild
   * @param {Snowflake} emojiId The ID of the emoji to delete
   * @returns {Promise<void>}
   */
  public async deleteGuildEmoji(guildId: Snowflake, emojiId: Snowflake): Promise<void> {
    await this.requests.send(EndpointRoute.GuildEmoji, { guildId, emojiId }, HttpMethod.Delete);
  }

  /**
   * Fetches a guild by its ID and additional options
   * @param {Snowflake} guildId The ID of the guild
   * @param {FetchGuildOptions} options The additional options for the fetch operation
   * @returns {Promise<Guild>}
   */
  public async fetchGuild(guildId: Snowflake, options?: FetchGuildOptions): Promise<Guild> {
    const guild = await this.requests.send(
      EndpointRoute.Guild,
      { guildId },
      HttpMethod.Get,
      APISerializer.fetchGuildOptions(options),
    );

    return new Guild(this.bot, guild!);
  }

  /**
   * Fetches a guild preview by its guild ID.
   * This is only available for public guilds
   * @param {Snowflake} guildId The ID of the guild
   * @returns {Promise<GuildPreview>}
   */
  public async fetchGuildPreview(guildId: Snowflake): Promise<GuildPreview> {
    const preview = await this.requests.send(
      EndpointRoute.GuildPreview,
      { guildId },
      HttpMethod.Get,
    );

    return new GuildPreview(this.bot, preview!);
  }

  /**
   * Fetches an invite by its invite code
   * @param {string} inviteCode The invite code
   * @param {FetchInviteOptions} options An additional set of options for the invite
   * @returns {Promise<Invite>}
   */
  public async fetchInvite(inviteCode: string, options?: FetchInviteOptions): Promise<Invite> {
    const invite = await this.requests.send(
      EndpointRoute.Invite,
      { inviteCode },
      HttpMethod.Get,
      APISerializer.fetchInviteOptions(options),
    );

    return new Invite(this.bot, invite!);
  }

  /**
   * Deletes an invite by its invite code.
   * Requires the {@link Permission.ManageChannels} permission on the channel this invite belongs to, or {@link Permission.ManageGuild} to remove any invite across the guild
   * @param {string} inviteCode The invite code
   * @returns {Promise<Invite>}
   */
  public async deleteInvite(inviteCode: string): Promise<Invite> {
    const invite = await this.requests.send(
      EndpointRoute.Invite,
      { inviteCode },
      HttpMethod.Delete,
    );

    return new Invite(this.bot, invite!);
  }
}

export default BotAPI;
