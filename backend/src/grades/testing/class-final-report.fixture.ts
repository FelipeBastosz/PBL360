import type { ClassFinalReportResponseDto } from '../application/dtos/class-final-report-response.dto';

const REPORT: ClassFinalReportResponseDto = {
  sala: { id: 'room-1', nome: 'Turma A', codigoDisciplina: 'MED101', semestre: '2026.2' },
  problemas: [
    { id: 'problem-1', titulo: 'Dor torácica', ordem: 1 },
    { id: 'problem-2', titulo: 'Dispneia', ordem: 2 },
    { id: 'problem-3', titulo: 'Cefaleia', ordem: 3 },
  ],
  alunos: [
    {
      id: 'student-1',
      nome: 'Ana Souza',
      matricula: '00000001',
      notasProblemas: [
        { problemaId: 'problem-3', notaFinal: null },
        { problemaId: 'problem-1', notaFinal: 8 },
        { problemaId: 'problem-2', notaFinal: 0 },
      ],
      mediaGeral: 4,
      isParcial: true,
    },
    {
      id: 'student-2',
      nome: 'Bruno Lima',
      matricula: null,
      notasProblemas: [],
      mediaGeral: null,
      isParcial: true,
    },
    {
      id: 'student-3',
      nome: 'Carla Santos',
      matricula: '00000003',
      notasProblemas: [
        { problemaId: 'problem-1', notaFinal: 8.3 },
        { problemaId: 'problem-2', notaFinal: 6.8 },
        { problemaId: 'problem-3', notaFinal: 8 },
      ],
      mediaGeral: 7.7,
      isParcial: false,
    },
  ],
};

export const buildClassFinalReportFixture = (): ClassFinalReportResponseDto =>
  structuredClone(REPORT);
