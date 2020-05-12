/* eslint-disable @typescript-eslint/no-non-null-assertion */

import MessageAttachment from './MessageAttachment';
import MessageEmbed from './MessageEmbed';
import MessageMentions from './MessageMentions';
import Cluster from '../../Cluster';
import { Snowflake } from '../../types';
import BaseStruct, { GatewayStruct } from '../BaseStruct';
import Member from '../Member';
import Timestamp from '../Timestamp';
import User from '../User';
import Bot from '../bot/Bot';
import DMChannel from '../channels/DMChannel';
import GuildTextChannel from '../channels/GuildTextChannel';
import Guild from '../guild/Guild';

/**
 * The type of a message
 */
enum MessageTypes {
  Default,
  ReceipientAdd,
  RecipientRemove,
  Call,
  ChannelNameChange,
  ChannelIconChange,
  ChannelPinnedMessage,
  GuildMemberJoin,
  UserPremiumGuildSubscription,
  UserPremiumGuildSubscriptionTier1,
  UserPremiumGuildSubscriptionTier2,
  UserPremiumGuildSubscriptionTier3,
  ChannelFollowAdd,
  GuildDiscoveryDisqualified,
  GuildDiscoveryRequalified,
}

/**
 * Represents a message sent in a {@link TextChannel} within Discord
 * @class
 * @extends BaseStruct
 */
class Message extends BaseStruct {
  /**
   * The message's ID
   */
  public id: Snowflake;

  /**
   * The guild the message was sent in. Possibly null if message was sent over a DM
   */
  public guild?: Guild;

  /**
   * The channel the message was sent in
   */
  public channel: GuildTextChannel | DMChannel; // | DMChannel;

  /**
   * The author of this message.
   * Might not be a valid {@link User} object if message was generated by a webhook
   */
  public author: User;

  /**
   * The member properties for this message's author.
   * Might not exist if message was sent over a DM
   */
  public member?: Member;

  /**
   * The content of the message
   */
  public content: string;

  /**
   * Timestamp of when this message was sent
   */
  public sentAt: Timestamp;

  /**
   * Timestamp of when this message was edited.
   * Possibly null if message has not been edited
   */
  public editedAt: Timestamp | null;

  /**
   * Whether this was a TTS message
   */
  public tts: boolean;

  /**
   * Whether this message mentions everyone
   */
  public mentionsEveryone: boolean;

  /**
   * All types of mentionable instances mentioned in this message
   */
  public mentions: MessageMentions;

  /**
   * {@link Cluster} of all {@link MessageAttachment}s attached to this message
   */
  public attachments: Cluster<Snowflake, MessageAttachment>;

  /**
   * All embedded content associated to this message
   */
  public embeds: MessageEmbed[];

  // public reactions?: MessageReaction;

  /**
   * Used for validating a message was sent
   */
  public nonce?: number | string;

  /**
   * Whether this message is pinned
   */
  public pinned: boolean;

  /**
   * The Webhook ID in case this message was generated by a Webhook
   */
  public webhookId?: undefined;

  /**
   * The type of the message
   */
  public type: MessageTypes;

  public activity?: undefined;

  public application?: undefined;

  public messageReference?: undefined;

  public flags?: undefined;

  constructor(bot: Bot, message: GatewayStruct, channel: GuildTextChannel | DMChannel) {
    super(bot);

    if (message.guild_id) {
      this.guild = this.bot.guilds.get(message.guild_id);
    }
    this.channel = channel;
    this.id = message.id;
    this.author = new User(this.bot, message.author);
    this.content = message.content;
    this.sentAt = new Timestamp(message.timestamp);
    this.editedAt = message.edited_timestamp ? new Timestamp(message.edited_timestamp) : null;
    this.tts = message.tts;
    this.mentionsEveryone = message.mention_everyone;

    this.mentions = new MessageMentions(this, {
      users: message.mentions,
      roles: message.mention_roles,
      crosspostedChannels: message.mention_channels,
    });

    this.attachments = new Cluster<Snowflake, MessageAttachment>(
      message.attachments.map((attachment: GatewayStruct) => [
        attachment.id,
        new MessageAttachment(this, attachment),
      ]),
    );

    this.embeds = message.embeds.map((embed: GatewayStruct) => new MessageEmbed(this, embed));
    this.nonce = message.nonce;
    this.pinned = message.pinned;
    this.type = message.type;
  }
}

export default Message;
