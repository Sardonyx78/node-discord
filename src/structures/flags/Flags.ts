/**
 * Manager class responsible for retrieving data off of bit-wise flags
 * @template T
 */
class Flags<T extends number> {
  /**
   * Integer of the flags
   */
  private readonly flags: number;

  constructor(permissions: number) {
    this.flags = permissions;
  }

  /**
   * Whether a specific flag is included in this instance's flags
   * @param {PermissionFlagTypes} flag The flag to check if included
   * @returns {boolean}
   */
  public has(flag: T): boolean {
    return (this.flags & flag) === flag;
  }
}

export default Flags;