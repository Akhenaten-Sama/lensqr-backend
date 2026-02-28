import crypto from 'crypto';

export class TokenHelper {
  /**
   * Generates a faux auth token.
   * Format: base64(userId).32-byte-random-hex
   * The userId is encoded in the token so auth middleware can extract it
   * without a DB lookup on the first pass.
   */
  static generate(userId: string): string {
    const random = crypto.randomBytes(32).toString('hex');
    const payload = Buffer.from(userId).toString('base64');
    return `${payload}.${random}`;
  }

  /**
   * Extracts the userId embedded in the token.
   * Returns null if the token is malformed.
   */
  static extractUserId(token: string): string | null {
    try {
      const [payloadB64] = token.split('.');
      if (!payloadB64) return null;
      return Buffer.from(payloadB64, 'base64').toString('utf8');
    } catch {
      return null;
    }
  }
}
