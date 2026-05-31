import { createReservation } from './bookingService';
import { adminDb } from '@/lib/firebase/admin';

jest.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: jest.fn(),
  },
}));

describe('bookingService', () => {
  describe('createReservation', () => {
    it('throws an error if availability check fails', async () => {
      const mockGet = jest.fn();
      const mockWhere = jest.fn().mockReturnThis();
      const mockDoc = jest.fn().mockReturnThis();
      const mockCollection = jest.fn().mockReturnThis();

      // Setup the chain
      (adminDb!.collection as jest.Mock).mockImplementation(mockCollection);
      mockCollection.mockImplementation(() => ({
        doc: mockDoc,
        where: mockWhere,
        get: mockGet,
      }));
      mockDoc.mockImplementation(() => ({
        collection: mockCollection,
        get: mockGet,
      }));
      mockWhere.mockImplementation(() => ({
        where: mockWhere,
        get: mockGet,
      }));

      // 1st get: serviceDoc
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({ capacity: 2, name: 'Test Service' }),
      });

      // 2nd get: companyDoc
      mockGet.mockResolvedValueOnce({
        data: () => ({ bookingConfig: { syncSource: 'native' } }),
      });

      // 3rd get: snapshot
      mockGet.mockResolvedValueOnce({
        docs: [
          { data: () => ({ partySize: 2 }) }
        ],
      });

      const request = {
        companyId: 'company123',
        serviceId: 'service456',
        date: '2023-10-27',
        time: '14:00',
        customerName: 'John Doe',
        partySize: 2, // 2 (existing) + 2 (requested) > 2 (capacity) => available: false
      };

      await expect(createReservation(request)).rejects.toThrow('Reservation failed: capacity_reached');
    });
  });
});
