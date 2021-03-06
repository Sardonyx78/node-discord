import fs from 'fs';
import util from 'util';
import mime from 'mime-types';

const readFile = util.promisify(fs.readFile);

/**
 * Represents an image being sent to the Discord API as Image Data
 * https://discord.com/developers/docs/reference#image-data
 */
export class ImageURI {
  /**
   * The path of the image
   */
  private readonly path: string;

  /**
   * @param {string} path The image path
   * @example ```typescript
   * const image = new ImageURI('./image.png');
   * ```
   */
  constructor(path: string) {
    this.path = path;
  }

  /**
   * Returns the image mime and base64 data as a formatted string
   * @returns {string}
   */
  public async stringify(): Promise<string> {
    const { image, mime } = this;

    if (!mime) {
      throw new Error(`Invalid mime type for image ${this.path}`);
    }

    return `data:${mime};base64,${await image}`;
  }

  /**
   * Returns the image as base64
   * @type {string}
   */
  private get image(): Promise<string> {
    return readFile(this.path, { encoding: 'base64' });
  }

  /**
   * Returns the mime type of the image
   * @type {string | boolean}
   */
  private get mime(): string | false {
    return mime.lookup(this.path);
  }
}
