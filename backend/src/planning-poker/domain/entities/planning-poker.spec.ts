import { PlanningPoker, PokerOrder, PokerStatus } from './planning-poker';

const aPoker = (order: PokerOrder, queue = ['ana', 'bruno', 'carla']) =>
  new PlanningPoker({
    id: 'poker',
    sessionId: 'session',
    anonymous: true,
    order,
    status: PokerStatus.OPEN,
    queue,
    createdBy: 'tutor',
    createdAt: new Date(),
  });

describe('PlanningPoker', () => {
  it('picks the head of the queue in sequential mode', () => {
    expect(aPoker(PokerOrder.SEQUENTIAL).pickNext(null)).toBe('ana');
  });

  it('requires a choice in manual mode', () => {
    expect(aPoker(PokerOrder.MANUAL).pickNext(null)).toBeNull();
    expect(aPoker(PokerOrder.MANUAL).pickNext('carla')).toBe('carla');
  });

  it('refuses a student who is not waiting in the queue', () => {
    expect(aPoker(PokerOrder.MANUAL).pickNext('zeca')).toBeNull();
  });

  it('accepts a reordered queue with the same students', () => {
    expect(aPoker(PokerOrder.SEQUENTIAL).isSameQueue(['carla', 'ana', 'bruno'])).toBe(true);
  });

  it('rejects a queue that adds, drops or repeats students', () => {
    const poker = aPoker(PokerOrder.SEQUENTIAL);

    expect(poker.isSameQueue(['ana', 'bruno'])).toBe(false);
    expect(poker.isSameQueue(['ana', 'bruno', 'zeca'])).toBe(false);
    expect(poker.isSameQueue(['ana', 'ana', 'bruno'])).toBe(false);
  });

  it('puts a cancelled student back at the head of the queue', () => {
    expect(aPoker(PokerOrder.SEQUENTIAL, ['bruno', 'carla']).withFirst('ana')).toEqual([
      'ana',
      'bruno',
      'carla',
    ]);
  });
});
