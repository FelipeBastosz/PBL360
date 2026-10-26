import type {
  AttendanceRecordPayload,
  AttendanceStatus,
  RollCall,
  RollCallStudent,
  RollCallTotals,
} from '@/types/session';

export type RollCallBoard = {
  seats: number;
  students: RollCallStudent[];
};

const SEATED: AttendanceStatus[] = ['PRESENTE', 'ATRASADO'];

const update = (
  board: RollCallBoard,
  studentId: string,
  change: (student: RollCallStudent) => RollCallStudent,
): RollCallBoard => ({
  ...board,
  students: board.students.map((student) =>
    student.alunoId === studentId ? change(student) : student,
  ),
});

export function boardFromRollCall(rollCall: RollCall): RollCallBoard {
  return { seats: rollCall.lugares, students: rollCall.alunos };
}

export function savedBaseline(rollCall: RollCall): RollCallBoard {
  if (rollCall.origem === 'REGISTRADA') return boardFromRollCall(rollCall);
  return {
    seats: rollCall.lugares,
    students: rollCall.alunos.map((student) => ({
      ...student,
      lugar: null,
      status: null,
      justificativa: null,
    })),
  };
}

export function studentAtSeat(board: RollCallBoard, seat: number): RollCallStudent | undefined {
  return board.students.find((student) => student.lugar === seat);
}

export function seatStudent(board: RollCallBoard, studentId: string, seat: number): RollCallBoard {
  const mover = board.students.find((student) => student.alunoId === studentId);
  if (!mover || mover.lugar === seat) return board;
  const occupant = studentAtSeat(board, seat);
  const moved = update(board, studentId, (student) => ({
    ...student,
    lugar: seat,
    status: student.status === 'ATRASADO' ? 'ATRASADO' : 'PRESENTE',
    justificativa: null,
  }));
  return occupant ? update(moved, occupant.alunoId, (s) => ({ ...s, lugar: mover.lugar })) : moved;
}

export function unseatStudent(board: RollCallBoard, studentId: string): RollCallBoard {
  return update(board, studentId, (student) => ({
    ...student,
    lugar: null,
    status: 'AUSENTE',
    justificativa: null,
  }));
}

export function setStudentStatus(
  board: RollCallBoard,
  studentId: string,
  status: AttendanceStatus,
  justificativa: string | null = null,
): RollCallBoard {
  return update(board, studentId, (student) => ({
    ...student,
    status,
    lugar: SEATED.includes(status) ? student.lugar : null,
    justificativa: status === 'JUSTIFICADO' ? justificativa?.trim() || null : null,
  }));
}

export function setAttendance(
  board: RollCallBoard,
  studentId: string,
  status: AttendanceStatus,
  justificativa: string | null = null,
): RollCallBoard {
  const student = board.students.find((item) => item.alunoId === studentId);
  const seat = freeSeats(board)[0];
  const needsSeat = SEATED.includes(status) && student?.lugar === null && seat !== undefined;
  const seated = needsSeat ? seatStudent(board, studentId, seat) : board;
  return setStudentStatus(seated, studentId, status, justificativa);
}

export function freeSeats(board: RollCallBoard): number[] {
  const taken = new Set(board.students.map((student) => student.lugar));
  return Array.from({ length: board.seats }, (_, index) => index + 1).filter(
    (seat) => !taken.has(seat),
  );
}

export function isOffTable(student: RollCallStudent): boolean {
  return student.lugar === null;
}

function canBeSeated(student: RollCallStudent): boolean {
  return isOffTable(student) && (student.status === null || SEATED.includes(student.status));
}

export function seatEveryone(board: RollCallBoard): RollCallBoard {
  const seats = freeSeats(board);
  return board.students
    .filter(canBeSeated)
    .slice(0, seats.length)
    .reduce(
      (current, student, index) => seatStudent(current, student.alunoId, seats[index]!),
      board,
    );
}

export function markRemainingAbsent(board: RollCallBoard): RollCallBoard {
  return {
    ...board,
    students: board.students.map((student) =>
      isOffTable(student) && student.status === null
        ? { ...student, status: 'AUSENTE', justificativa: null }
        : student,
    ),
  };
}

export function countTotals(board: RollCallBoard): RollCallTotals {
  const count = (status: AttendanceStatus | null) =>
    board.students.filter((student) => student.status === status).length;
  return {
    presentes: count('PRESENTE'),
    atrasados: count('ATRASADO'),
    justificados: count('JUSTIFICADO'),
    ausentes: count('AUSENTE'),
    semRegistro: count(null),
  };
}

const signature = (student: RollCallStudent) =>
  `${student.lugar}|${student.status}|${student.justificativa ?? ''}`;

export function hasChanges(board: RollCallBoard, baseline: RollCallBoard): boolean {
  const saved = new Map(baseline.students.map((s) => [s.alunoId, signature(s)]));
  return board.students.some((student) => saved.get(student.alunoId) !== signature(student));
}

export function toAttendanceRecords(board: RollCallBoard): AttendanceRecordPayload[] {
  return board.students
    .filter((student): student is RollCallStudent & { status: AttendanceStatus } =>
      Boolean(student.status),
    )
    .map((student) => ({
      alunoId: student.alunoId,
      status: student.status,
      lugar: student.lugar,
      justificativa: student.justificativa,
    }));
}
