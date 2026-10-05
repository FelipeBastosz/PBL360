import type { RoomStudent, StudentRoom } from '@/types/room';

export const mockStudentRooms: StudentRoom[] = [
  {
    salaId: 'mock-room-1',
    nome: 'Resolução de Problemas I',
    semestre: '2026.1',
    totalAlunos: 24,
  },
  {
    salaId: 'mock-room-2',
    nome: 'Estruturas de Dados e Algoritmos',
    semestre: '2026.2',
    totalAlunos: 32,
  },
  {
    salaId: 'mock-room-3',
    nome: 'Engenharia de Software Aplicada',
    semestre: '2026.2',
    totalAlunos: 18,
  },
];

export const mockRoomStudents: RoomStudent[] = [
  {
    nome: 'Ana Beatriz Souza',
    dataEntrada: '2026-09-01T10:00:00.000Z',
  },
  {
    nome: 'Carlos Eduardo Oliveira',
    dataEntrada: '2026-09-02T14:30:00.000Z',
  },
  {
    nome: 'Mariana Lima Santos',
    dataEntrada: '2026-09-03T09:15:00.000Z',
  },
];
