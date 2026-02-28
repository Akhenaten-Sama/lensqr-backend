import axios from 'axios';
import { AdjutorClient } from '../../../src/integrations/adjutor/adjutor.client';
import { AdjutorService } from '../../../src/integrations/adjutor/adjutor.service';
import { KarmaLookupResponse } from '../../../src/integrations/adjutor/adjutor.types';

jest.mock('../../../src/integrations/adjutor/adjutor.client');
jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AdjutorService', () => {
  let adjutorService: AdjutorService;
  let mockClient: jest.Mocked<AdjutorClient>;

  beforeEach(() => {
    mockClient = new AdjutorClient('', '') as jest.Mocked<AdjutorClient>;
    adjutorService = new AdjutorService(mockClient);
  });

  describe('isBlacklisted', () => {
    it('returns true when Adjutor returns data for the identity (blacklisted user)', async () => {
      const response: KarmaLookupResponse = {
        status: 'success',
        message: 'Identity found',
        data: {
          karma_identity: 'blacklisted@example.com',
          total_amount_loaned: '50000',
          total_amount_repaid: '0',
          karma_type: { karma: 'LOAN_DEFAULT' },
          karma_date: '2024-01-01',
          reporting_entity: { name: 'Lender A', email: 'lender@a.com' },
        },
      };

      mockClient.get = jest.fn().mockResolvedValue(response);

      const result = await adjutorService.isBlacklisted('blacklisted@example.com');

      expect(result).toBe(true);
      expect(mockClient.get).toHaveBeenCalledWith(
        '/v2/verification/karma/blacklisted%40example.com',
      );
    });

    it('returns false when Adjutor returns null data (clean user)', async () => {
      const response: KarmaLookupResponse = {
        status: 'success',
        message: 'Identity not found',
        data: null,
      };

      mockClient.get = jest.fn().mockResolvedValue(response);

      const result = await adjutorService.isBlacklisted('clean@example.com');

      expect(result).toBe(false);
    });

    it('returns false when Adjutor responds with 404 (identity not in system)', async () => {
      const axiosError = {
        isAxiosError: true,
        response: { status: 404 },
        message: 'Not Found',
      };

      mockedAxios.isAxiosError.mockReturnValue(true);
      mockClient.get = jest.fn().mockRejectedValue(axiosError);

      const result = await adjutorService.isBlacklisted('unknown@example.com');

      expect(result).toBe(false);
    });
  });
});
