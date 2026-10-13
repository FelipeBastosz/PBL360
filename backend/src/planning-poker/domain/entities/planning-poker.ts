export enum PokerOrder {
  SEQUENTIAL = 'SEQUENTIAL',
  MANUAL = 'MANUAL',
}

export enum PokerStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export interface PlanningPokerProps {
  id: string;
  sessionId: string;
  anonymous: boolean;
  order: PokerOrder;
  status: PokerStatus;
  queue: string[];
  createdBy: string;
  createdAt: Date;
}

export class PlanningPoker {
  readonly id: string;
  readonly sessionId: string;
  readonly anonymous: boolean;
  readonly order: PokerOrder;
  readonly status: PokerStatus;
  readonly queue: string[];
  readonly createdBy: string;
  readonly createdAt: Date;

  constructor(props: PlanningPokerProps) {
    this.id = props.id;
    this.sessionId = props.sessionId;
    this.anonymous = props.anonymous;
    this.order = props.order;
    this.status = props.status;
    this.queue = [...props.queue];
    this.createdBy = props.createdBy;
    this.createdAt = props.createdAt;
  }

  pickNext(chosen: string | null): string | null {
    if (chosen !== null) return this.queue.includes(chosen) ? chosen : null;
    return this.order === PokerOrder.SEQUENTIAL ? (this.queue[0] ?? null) : null;
  }

  isSameQueue(candidate: string[]): boolean {
    if (candidate.length !== this.queue.length) return false;
    const unique = new Set(candidate);
    return unique.size === candidate.length && this.queue.every((id) => unique.has(id));
  }

  without(studentId: string): string[] {
    return this.queue.filter((id) => id !== studentId);
  }

  withFirst(studentId: string): string[] {
    return [studentId, ...this.without(studentId)];
  }
}
