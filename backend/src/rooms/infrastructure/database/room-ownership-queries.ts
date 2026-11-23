import type { EntityManager } from 'typeorm';
import type {
  TransferRoomOwnershipInput,
  TransferRoomOwnershipOutcome,
} from '../../domain/repositories/room.repository';

const LOCK_ROOM_SQL = `SELECT tutor_id AS "tutorId"
  FROM rooms
  WHERE id = $1 AND deleted_at IS NULL
  FOR UPDATE;`;

const HAS_TUTOR_SQL = `SELECT EXISTS (
  SELECT 1 FROM room_tutors WHERE room_id = $1 AND tutor_id = $2
) AS "exists";`;

const ENSURE_CO_TUTOR_SQL = `INSERT INTO room_tutors (room_id, tutor_id)
  VALUES ($1, $2)
  ON CONFLICT DO NOTHING;`;

const UPDATE_OWNER_SQL = `UPDATE rooms
  SET tutor_id = $2
  WHERE id = $1 AND tutor_id = $3 AND deleted_at IS NULL
  RETURNING id;`;

const INSERT_TRANSFER_AUDIT_SQL = `INSERT INTO room_ownership_transfers
  (room_id, previous_owner_id, new_owner_id, transferred_by_id)
  VALUES ($1, $2, $3, $4);`;

const lockCurrentOwner = async (manager: EntityManager, roomId: string): Promise<string | null> => {
  const rows = await manager.query<{ tutorId: string }[]>(LOCK_ROOM_SQL, [roomId]);
  return rows[0]?.tutorId ?? null;
};

const isTutorLinked = async (
  manager: EntityManager,
  roomId: string,
  tutorId: string,
): Promise<boolean> => {
  const rows = await manager.query<{ exists: boolean }[]>(HAS_TUTOR_SQL, [roomId, tutorId]);
  return rows[0]?.exists ?? false;
};

const persistOwnershipChange = async (
  manager: EntityManager,
  input: TransferRoomOwnershipInput,
): Promise<boolean> => {
  await manager.query(ENSURE_CO_TUTOR_SQL, [input.roomId, input.expectedOwnerId]);
  const params = [input.roomId, input.newOwnerId, input.expectedOwnerId];
  const [updatedRows] = await manager.query<[unknown[], number]>(UPDATE_OWNER_SQL, params);
  if (updatedRows.length === 0) return false;
  const auditParams = [
    input.roomId,
    input.expectedOwnerId,
    input.newOwnerId,
    input.transferredById,
  ];
  await manager.query(INSERT_TRANSFER_AUDIT_SQL, auditParams);
  return true;
};

const validateLockedRoom = async (
  manager: EntityManager,
  input: TransferRoomOwnershipInput,
): Promise<Exclude<TransferRoomOwnershipOutcome, { status: 'transferred' }> | null> => {
  const currentOwnerId = await lockCurrentOwner(manager, input.roomId);
  if (!currentOwnerId) return { status: 'not_found' };
  if (currentOwnerId !== input.expectedOwnerId) return { status: 'not_owner' };
  if (input.newOwnerId === input.expectedOwnerId) return { status: 'same_owner' };
  const linked = await isTutorLinked(manager, input.roomId, input.newOwnerId);
  return linked ? null : { status: 'tutor_not_linked' };
};

export const executeTransferRoomOwnership = async (
  manager: EntityManager,
  input: TransferRoomOwnershipInput,
): Promise<TransferRoomOwnershipOutcome> => {
  const rejection = await validateLockedRoom(manager, input);
  if (rejection) return rejection;
  const updated = await persistOwnershipChange(manager, input);
  return updated
    ? { status: 'transferred', roomId: input.roomId, ownerId: input.newOwnerId }
    : { status: 'not_owner' };
};
