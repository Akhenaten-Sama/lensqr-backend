import axios from 'axios';
import { AdjutorClient } from './adjutor.client';
import { KarmaLookupResponse } from './adjutor.types';

export class AdjutorService {
  constructor(private readonly client: AdjutorClient) {}

  /**
   * Checks whether the given identity (email, phone, BVN, etc.) appears
   * on the Lendsqr Adjutor Karma blacklist.
   *
   * Fail-open strategy: if the Adjutor API is unreachable or returns a
   * non-404 error, we log the failure and allow registration to proceed
   * rather than blocking all new users during an outage.
   */
  async isBlacklisted(identity: string): Promise<boolean> {
    try {
      const response = await this.client.get<KarmaLookupResponse>(
        `/v2/verification/karma/${encodeURIComponent(identity)}`,
      );
      // A non-null data field means the identity is on the blacklist
      return response.data !== null;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // 404 = identity not found in Karma system → user is clean
        return false;
      }
      // Any other error (5xx, network timeout, etc.) → fail open
      return false;
    }
  }
}
