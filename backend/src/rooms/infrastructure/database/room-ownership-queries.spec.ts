import type { EntityManager } from 'typeorm';
import { executeTransferRoomOwnership } from './room-ownership-queries';

describe('executeTransferRoomOwnership', () => {
  const input = { roomId: 'r1', expectedOwnerId: 't1', newOwnerId: 't2', transferredById: 't1' };
  const manager = (query: jest.Mock) => ({ query }) as unknown as EntityManager;

  it('returns early for missing rooms, changed ownership and same-owner transfers', async () => {
    await expect(
      executeTransferRoomOwnership(manager(jest.fn().mockResolvedValue([])), input),
    ).resolves.toEqual({ status: 'not_found' });
    await expect(
      executeTransferRoomOwnership(
        manager(jest.fn().mockResolvedValue([{ tutorId: 'other' }])),
        input,
      ),
    ).resolves.toEqual({ status: 'not_owner' });
    await expect(
      executeTransferRoomOwnership(manager(jest.fn().mockResolvedValue([{ tutorId: 't1' }])), {
        ...input,
        newOwnerId: 't1',
      }),
    ).resolves.toEqual({ status: 'same_owner' });
  });

  it('rejects missing, non-tutor, inactive or unlinked recipients', async () => {
    const missing = jest
      .fn()
      .mockResolvedValueOnce([{ tutorId: 't1' }])
      .mockResolvedValueOnce([]);
    await expect(executeTransferRoomOwnership(manager(missing), input)).resolves.toEqual({
      status: 'tutor_not_found',
    });
    const wrongType = jest
      .fn()
      .mockResolvedValueOnce([{ tutorId: 't1' }])
      .mockResolvedValueOnce([{ type: 'STUDENT', active: true }]);
    await expect(executeTransferRoomOwnership(manager(wrongType), input)).resolves.toEqual({
      status: 'tutor_not_found',
    });
    const inactive = jest
      .fn()
      .mockResolvedValueOnce([{ tutorId: 't1' }])
      .mockResolvedValueOnce([{ type: 'TUTOR', active: false }]);
    await expect(executeTransferRoomOwnership(manager(inactive), input)).resolves.toEqual({
      status: 'tutor_inactive',
    });
    const unlinked = jest
      .fn()
      .mockResolvedValueOnce([{ tutorId: 't1' }])
      .mockResolvedValueOnce([{ type: 'TUTOR', active: true }])
      .mockResolvedValueOnce([]);
    await expect(executeTransferRoomOwnership(manager(unlinked), input)).resolves.toEqual({
      status: 'tutor_not_linked',
    });
  });

  it('transfers ownership, audits it, and handles a concurrent owner change', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ tutorId: 't1' }])
      .mockResolvedValueOnce([{ type: 'TUTOR', active: true }])
      .mockResolvedValueOnce([{ exists: true }])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([[{ id: 'r1' }, 1]])
      .mockResolvedValueOnce(undefined);
    await expect(executeTransferRoomOwnership(manager(query), input)).resolves.toEqual({
      status: 'transferred',
      roomId: 'r1',
      ownerId: 't2',
    });
    expect(query).toHaveBeenCalledTimes(6);
    const concurrent = jest
      .fn()
      .mockResolvedValueOnce([{ tutorId: 't1' }])
      .mockResolvedValueOnce([{ type: 'TUTOR', active: true }])
      .mockResolvedValueOnce([{ exists: true }])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([[], 0]);
    await expect(executeTransferRoomOwnership(manager(concurrent), input)).resolves.toEqual({
      status: 'not_owner',
    });
    expect(concurrent).toHaveBeenCalledTimes(5);
  });
});
