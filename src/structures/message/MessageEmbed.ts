import Message from './Message';
import { Dimensions } from '../../types/types';
import BaseStruct, { GatewayStruct } from '../BaseStruct';
import Timestamp from '../Timestamp';

/**
 * Embed types are "loosely defined" and, for the most part, are not used by our clients for rendering. Embed attributes power what is rendered. Embed types should be considered deprecated and might be removed in a future API version.
 */
export enum MessageEmbedTypes {
  Rich = 'rich',
  Image = 'image',
  Video = 'video',
  Gifv = 'gifv',
  Article = 'article',
  Link = 'link',
}

/**
 * Message embed footer data
 */
export interface MessageEmbedFooter {
  /**
   * Footer text
   */
  text: string;

  /**
   * URL of footer icon (only supports http(s) and attachments)
   */
  iconURL: string | undefined;

  /**
   * A proxied URL of footer icon
   */
  proxyIconURL: string | undefined;
}

/**
 * Message embed image data
 */
export interface MessageEmbedImage {
  /**
   * Source URL of image (only supports http(s) and attachments)
   */
  url: string | undefined;

  /**
   * A proxied URL of the image
   */
  proxyURL: string | undefined;

  /**
   * {@link Dimensions} object containing the dimensions of the image
   */
  dimensions: Partial<Dimensions>;
}

/**
 * Message embed thumbnail data
 */
export interface MessageEmbedThumbnail {
  /**
   * Source URL of thumbnail (only supports http(s) and attachments)
   */
  url: string | undefined;

  /**
   * A proxied URL of the thumbnail
   */
  proxyURL: string | undefined;

  /**
   * {@link Dimensions} object containing the dimensions of the thumbnail image
   */
  dimensions: Partial<Dimensions>;
}

/**
 * Message embed video data
 */
export interface MessageEmbedVideo {
  /**
   * Source URL of the video
   */
  url: string | undefined;

  /**
   * {@link Dimensions} object containing the dimensions of the video
   */
  dimensions: Partial<Dimensions>;
}

/**
 * Message embed provider data
 */
export interface MessageEmbedProvider {
  /**
   * Name of the provider
   */
  name: string | undefined;

  /**
   * URL of the provider
   */
  url: string | undefined;
}

/**
 * Message embed author data
 */
export interface MessageEmbedAuthor {
  /**
   * Name of the author
   */
  name: string | undefined;

  /**
   * URL of the author
   */
  url: string | undefined;

  /**
   * URL of the author's icon (only supports http(s) and attachments)
   */
  iconURL: string | undefined;

  /**
   * A proxied URL of the author's icon
   */
  proxyIconURL: string | undefined;
}

/**
 * Message embed field
 */
export interface MessageEmbedField {
  /**
   * Name of the embed field
   */
  name: string;

  /**
   * The text content of the embed field
   */
  content: string;

  /**
   * Whether or not this field should be displayed inline
   */
  inline: boolean | undefined;
}

// TODO: Link this description to a guide page about Discord message embeds
/**
 * Represents an embed contained in a {@link Message}
 */
class MessageEmbed extends BaseStruct {
  /**
   * The {@link Message} associated to this embed
   */
  public message: Message;

  /**
   * Title of this embed
   */
  public title: string | undefined;

  /**
   * Type of this embed (always "rich" for webhook embeds)
   */
  public type: MessageEmbedTypes | undefined;

  /**
   * Description of this embed
   */
  public description: string | undefined;

  /**
   * URL of this embed
   */
  public url: string | undefined;

  /**
   * Timestamp of this embed's content
   */
  public timestamp: Timestamp | undefined;

  /**
   * Color code of the embed
   */
  public color: number | undefined;

  /**
   * {@link MessageEmbedFooter} object containing this embed's footer data
   */
  public footer: MessageEmbedFooter | undefined;

  /**
   * {@link MessageEmbedImage} object containing this embed's image data
   */
  public image: MessageEmbedImage | undefined;

  /**
   * {@link MessageEmbedThumbnail} object containing this embed's thumbnail data
   */
  public thumbnail: MessageEmbedThumbnail | undefined;

  /**
   * {@link MessageEmbedVideo} object containing this embed's video data
   */
  public video: MessageEmbedVideo | undefined;

  /**
   * {@link MessageEmbedProvider} object containing this embed's provider data
   */
  public provider: MessageEmbedProvider | undefined;

  /**
   * {@link MessageEmbedFooter} object containing this embed's author data
   */
  public author: MessageEmbedAuthor | undefined;

  /**
   * {@link MessageEmbedField} array containing this embed's fields
   */
  public fields: MessageEmbedField[] | undefined;

  constructor(message: Message, embed: GatewayStruct) {
    super(message.bot);

    this.message = message;

    this.init(embed);
  }

  /**
   * @ignore
   * @param {GatewayStruct} embed The embed data
   * @returns {this}
   */
  public init(embed: GatewayStruct): this {
    this.title = embed.title;
    this.type = embed.type;
    this.description = embed.description;
    this.url = embed.url;
    this.timestamp = new Timestamp(embed.timestamp);
    this.color = embed.color;

    this.footer = {
      text: embed.footer.text,
      iconURL: embed.footer.icon_url,
      proxyIconURL: embed.footer.proxy_icon_url,
    };

    this.image = {
      url: embed.image.url,
      proxyURL: embed.image.proxy_url,
      dimensions: MessageEmbed.getDimensions(embed.image),
    };

    this.thumbnail = {
      url: embed.thumbnail.url,
      proxyURL: embed.thumbnail.proxy_url,
      dimensions: MessageEmbed.getDimensions(embed.thumbnail),
    };

    this.video = {
      url: embed.video.url,
      dimensions: MessageEmbed.getDimensions(embed.video),
    };

    this.provider = {
      name: embed.video.name,
      url: embed.video.url,
    };

    this.author = {
      name: embed.author.name,
      url: embed.author.url,
      iconURL: embed.author.icon_url,
      proxyIconURL: embed.author.proxy_icon_url,
    };

    this.fields = embed.fields.map((field: GatewayStruct) => ({
      name: field.name,
      content: field.value,
      inline: field.inline,
    }));

    return this;
  }

  private static getDimensions(struct: { height: number; width: number }): Dimensions {
    return {
      height: struct.height,
      width: struct.width,
    };
  }
}

export default MessageEmbed;
