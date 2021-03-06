import { Timestamp } from './Timestamp';
import { User } from './User';
import { BaseStruct, GatewayStruct } from './base';
import { GuildChannel } from './channels';
import { Guild } from './guild';
import { Bot } from '../bot';
import { Snowflake } from '../types';

export type InviteCode = string;

/**
 * Returned from the {@link INVITE_DELETE} event when the invite has not been cached
 */
export interface PartialInvite {
  /**
   * The ID of the channel this invite is for
   */
  channelId: Snowflake;

  /**
   * The guild this invite is for
   */
  guild: Guild | undefined;

  /**
   * The invite code (unique ID)
   */
  code: InviteCode;
}

export interface InviteMax {
  /**
   * Duration (in seconds) after which the invite expires
   */
  age: number;

  /**
   * Maximum number of times this invite can be used
   */
  uses: number;
}

/**
 * Options used when creating new invites for channels
 */
export interface InviteOptions {
  /**
   * The maximum data for the new invite
   */
  max?: Partial<InviteMax>;

  /**
   * Whether this invite only grants temporary membership
   */
  temporary?: boolean;

  /**
   * If true, don't try to reuse a similar invite (useful for creating many unique one time use invites)
   */
  unique?: boolean;
}

export class Invite extends BaseStruct {
  /**
   * The channel this invite is for
   */
  public channel: GuildChannel | undefined;

  /**
   * The invite code (unique ID)
   */
  public code!: InviteCode;

  /**
   * The timestamp of when the invite was created
   */
  public createdAt!: Timestamp;

  /**
   * The guild this invite is for
   */
  public guild: Guild | undefined;

  /**
   * The user who created the invite
   */
  public inviter: User | undefined;

  /**
   * {@link InviteMax} object containing the invite's maximum age and maximum uses
   */
  public max!: InviteMax;

  /**
   * Whether this invite grants temporary membership
   */
  public temporary!: boolean;

  /**
   * Number of times this invite has been used
   */
  public uses!: number;

  constructor(bot: Bot, invite: GatewayStruct, guild?: Guild) {
    super(bot, invite);

    this.init(invite, guild);
  }

  /**
   * @ignore
   * @param {GatewayStruct} invite The invite data
   * @param {Guild} guild The guild this invite is for
   * @returns {this}
   */
  public init(invite: GatewayStruct, guild?: Guild): this {
    this.code = invite.code;
    this.createdAt = new Timestamp(invite.created_at);

    if (guild) {
      this.guild = guild;
    } else if (invite.guild) {
      this.guild = this.bot.guilds.cache.get(invite.guild.id);
    }

    if (this.guild && invite.channel) {
      this.channel = this.guild.channels.cache.get(invite.channel.id);
    }

    if (invite.inviter) {
      this.inviter = new User(this.bot, invite.inviter);
    }

    this.max = {
      age: invite.max_age,
      uses: invite.max_uses,
    };

    this.temporary = invite.temporary;
    this.uses = invite.uses;

    return this;
  }

  /**
   * The code this invite stores.
   * Servers as an identifier for this invite
   * @type {string}
   */
  public get id(): string {
    return this.code;
  }
}
