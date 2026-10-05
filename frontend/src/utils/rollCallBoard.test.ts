import { describe, expect, it } from 'vitest';
import type { RollCall, RollCallStudent } from '@/types/session';
import {
  countTotals,
  freeSeats,
  hasChanges,
  markRemainingAbsent,
  savedBaseline,
  seatEveryone,
  seatStudent,
  setAttendance,
  setStudentStatus,
  toAttendanceRecords,
  unseatStudent,
  type RollCallBoard,
} from './rollCallBoard';

const student = (alunoId: string, overrides: Partial<RollCallStudent> = {}): RollCallStudent => ({
  alunoId,
  nome: alunoId,
  iniciais: alunoId.slice(0, 2).toUpperCase(),
  lugar: null,
  status: null,
  justificativa: null,
  ...overrides,
});

const board = (...students: RollCallStudent[]): RollCallBoard => ({ seats: 4, students });

const find = (current: RollCallBoard, id: string) =>
  current.students.find((item) => item.alunoId === id)!;

describe('seatStudent', () => {
  it('marks a seated student as present', () => {
    const next = seatStudent(board(student('ana')), 'ana', 2);

    expect(find(next, 'ana')).toMatchObject({ lugar: 2, status: 'PRESENTE' });
  });

  it('keeps a late student late when moving seats', () => {
    const next = seatStudent(board(student('ana', { lugar: 1, status: 'ATRASADO' })), 'ana', 3);

    expect(find(next, 'ana')).toMatchObject({ lugar: 3, status: 'ATRASADO' });
  });

  it('swaps two seated students', () => {
    const next = seatStudent(
      board(
        student('ana', { lugar: 1, status: 'PRESENTE' }),
        student('bruno', { lugar: 2, status: 'PRESENTE' }),
      ),
      'ana',
      2,
    );

    expect(find(next, 'ana').lugar).toBe(2);
    expect(find(next, 'bruno').lugar).toBe(1);
  });

  it('sends the occupant off the table when someone from outside takes the seat', () => {
    const next = seatStudent(
      board(student('ana'), student('bruno', { lugar: 2, status: 'PRESENTE' })),
      'ana',
      2,
    );

    expect(find(next, 'ana').lugar).toBe(2);
    expect(find(next, 'bruno')).toMatchObject({ lugar: null, status: 'PRESENTE' });
  });

  it('clears an excused justification when the student sits down', () => {
    const next = seatStudent(
      board(student('ana', { status: 'JUSTIFICADO', justificativa: 'Atestado' })),
      'ana',
      1,
    );

    expect(find(next, 'ana')).toMatchObject({ status: 'PRESENTE', justificativa: null });
  });
});

describe('setStudentStatus', () => {
  it('takes an excused student off the table with the justification', () => {
    const next = setStudentStatus(
      board(student('ana', { lugar: 3, status: 'PRESENTE' })),
      'ana',
      'JUSTIFICADO',
      ' Atestado médico ',
    );

    expect(find(next, 'ana')).toMatchObject({
      lugar: null,
      status: 'JUSTIFICADO',
      justificativa: 'Atestado médico',
    });
  });

  it('keeps the seat when switching between present and late', () => {
    const next = setStudentStatus(
      board(student('ana', { lugar: 3, status: 'PRESENTE' })),
      'ana',
      'ATRASADO',
    );

    expect(find(next, 'ana')).toMatchObject({ lugar: 3, status: 'ATRASADO' });
  });
});

describe('setAttendance', () => {
  it('seats an excused student back in the first free seat when marked present', () => {
    const current = board(
      student('ana', { lugar: 1, status: 'PRESENTE' }),
      student('bruno', { status: 'JUSTIFICADO', justificativa: 'Atestado' }),
    );

    const next = setAttendance(current, 'bruno', 'ATRASADO');

    expect(find(next, 'bruno')).toMatchObject({
      lugar: 2,
      status: 'ATRASADO',
      justificativa: null,
    });
  });

  it('keeps a present student off the table when every seat is taken', () => {
    const full = {
      seats: 1,
      students: [
        student('ana', { lugar: 1, status: 'PRESENTE' }),
        student('bruno', { status: 'AUSENTE' }),
      ],
    };

    expect(find(setAttendance(full, 'bruno', 'PRESENTE'), 'bruno')).toMatchObject({
      lugar: null,
      status: 'PRESENTE',
    });
  });

  it('takes the student off the table when excused', () => {
    const next = setAttendance(
      board(student('ana', { lugar: 1, status: 'PRESENTE' })),
      'ana',
      'JUSTIFICADO',
      'Atestado',
    );

    expect(find(next, 'ana')).toMatchObject({
      lugar: null,
      status: 'JUSTIFICADO',
      justificativa: 'Atestado',
    });
  });
});

describe('unseatStudent', () => {
  it('frees the seat and keeps the status so the batch still updates the record', () => {
    const next = unseatStudent(board(student('ana', { lugar: 1, status: 'PRESENTE' })), 'ana');

    expect(find(next, 'ana')).toMatchObject({ lugar: null, status: 'PRESENTE' });
  });
});

describe('batch actions', () => {
  it('seats everyone off the table without status in the free seats', () => {
    const current = board(
      student('ana', { lugar: 1, status: 'PRESENTE' }),
      student('bruno'),
      student('carla', { status: 'AUSENTE' }),
      student('diego'),
    );

    const next = seatEveryone(current);

    expect(find(next, 'bruno')).toMatchObject({ lugar: 2, status: 'PRESENTE' });
    expect(find(next, 'diego')).toMatchObject({ lugar: 3, status: 'PRESENTE' });
    expect(find(next, 'carla')).toMatchObject({ lugar: null, status: 'AUSENTE' });
    expect(freeSeats(next)).toEqual([4]);
  });

  it('marks as absent only who is off the table without status', () => {
    const current = board(
      student('ana', { lugar: 1, status: 'PRESENTE' }),
      student('bruno'),
      student('carla', { status: 'JUSTIFICADO', justificativa: 'Atestado' }),
    );

    const next = markRemainingAbsent(current);

    expect(countTotals(next)).toEqual({
      presentes: 1,
      atrasados: 0,
      justificados: 1,
      ausentes: 1,
      semRegistro: 0,
    });
  });
});

describe('saving', () => {
  const rollCall = (origem: RollCall['origem']): RollCall => ({
    sessaoId: 's1',
    origem,
    sessaoReferencia: null,
    registradaEm: null,
    lugares: 2,
    alunos: [student('ana', { lugar: 1, status: 'PRESENTE' }), student('bruno')],
    totais: { presentes: 1, atrasados: 0, justificados: 0, ausentes: 0, semRegistro: 1 },
  });

  it('treats a suggestion from the previous session as unsaved', () => {
    const suggestion = rollCall('SESSAO_ANTERIOR');

    expect(hasChanges({ seats: 2, students: suggestion.alunos }, savedBaseline(suggestion))).toBe(
      true,
    );
  });

  it('has no changes right after loading a saved roll call', () => {
    const saved = rollCall('REGISTRADA');

    expect(hasChanges({ seats: 2, students: saved.alunos }, savedBaseline(saved))).toBe(false);
  });

  it('sends only students with a status', () => {
    expect(toAttendanceRecords({ seats: 2, students: rollCall('REGISTRADA').alunos })).toEqual([
      { alunoId: 'ana', status: 'PRESENTE', lugar: 1, justificativa: null },
    ]);
  });
});
