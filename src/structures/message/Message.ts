import MessageAttachment from './MessageAttachment';
import MessageEmbed from './MessageEmbed';
import MessageMentions from './MessageMentions';
import MessageReaction from './MessageReaction';
import Cluster from '../../Cluster';
import { Snowflake, TEMP, TextBasedChannel } from '../../types';
import BaseStruct, { GatewayStruct } from '../BaseStruct';
import Timestamp from '../Timestamp';
import User from '../User';
import Bot from '../bot/Bot';
import Guild from '../guild/Guild';
import Member from '../member/Member';

/**
 * The type of a message
 */
enum MessageTypes {
  Default,
  RecipientAdd,
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

export interface PartialMessage {
  id: Snowflake;
  guild?: Guild;
  channel: TextBasedChannel;
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
  public id!: Snowflake;

  /**
   * The guild the message was sent in. Possibly null if message was sent over a DM
   */
  public guild: Guild | undefined;

  /**
   * The channel the message was sent in
   */
  public channel: TextBasedChannel;

  /**
   * The author of this message.
   * Might not be a valid {@link User} object if message was generated by a webhook
   */
  public author!: User;

  /**
   * The member properties for this message's author.
   * Might not exist if message was sent over a DM
   */
  public member: Member | undefined;

  /**
   * The content of the message
   */
  public content!: string;

  /**
   * Timestamp of when this message was sent
   */
  public sentAt!: Timestamp;

  /**
   * Timestamp of when this message was edited.
   * Possibly null if message has not been edited
   */
  public editedAt!: Timestamp | null;

  /**
   * Whether this was a TTS message
   */
  public tts!: boolean;

  /**
   * Whether this message mentions everyone
   */
  public mentionsEveryone!: boolean;

  /**
   * All types of mentionable instances mentioned in this message
   */
  public mentions!: MessageMentions;

  /**
   * {@link Cluster} of all {@link MessageAttachment}s attached to this message
   */
  public attachments!: Cluster<Snowflake, MessageAttachment>;

  /**
   * All embedded content associated to this message
   */
  public embeds!: MessageEmbed[];

  /**
   * {@link Cluster} of all {@link MessageReaction} added to this message.
   * The reactions are mapped by the emoji name or emoji ID.
   */
  public reactions: Cluster<string, MessageReaction>;

  /**
   * Used for validating a message was sent
   */
  public nonce: number | string | undefined;

  /**
   * Whether this message is pinned
   */
  public pinned!: boolean;

  /**
   * The Webhook ID in case this message was generated by a Webhook
   */
  public webhookId: TEMP | undefined;

  /**
   * The type of the message
   */
  public type!: MessageTypes;

  public activity: TEMP | undefined;

  public application: TEMP | undefined;

  public messageReference: TEMP | undefined;

  public flags: TEMP | undefined;

  constructor(bot: Bot, message: GatewayStruct, channel: TextBasedChannel) {
    super(bot);

    this.channel = channel;

    this.reactions = new Cluster<Snowflake, MessageReaction>();

    this.init(message);
  }

  /**
   * @ignore
   * @param {GatewayStruct} message The message data
   * @returns {this}
   */
  public init(message: GatewayStruct): this {
    if (message.guild_id) {
      this.guild = this.bot.guilds.get(message.guild_id);
    }

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

    if (message.reactions) {
      this.reactions.merge(
        message.reactions.map((reaction: GatewayStruct) => [
          reaction.emoji.id,
          new MessageReaction(this, reaction),
        ]),
      );
    }

    this.nonce = message.nonce;
    this.pinned = message.pinned;
    this.type = message.type;

    return this;
  }
}

export default Message;
