import { toObservationResponse, toStudentObservationsResponse } from './observation.mapper';

describe('observation mappers', () => {
  it('maps observation tags and aggregates student observations', () => {
    const createdAt = new Date('2025-04-01T00:00:00Z');
    const observation = {
      id: 'o1',
      tags: [{ id: 'tag1', name: 'Colaboração' }],
      text: 'Contribuiu',
      createdAt,
    } as never;
    expect(toObservationResponse(observation)).toEqual({
      id: 'o1',
      marcacoes: [{ id: 'tag1', nome: 'Colaboração' }],
      texto: 'Contribuiu',
      criadaEm: createdAt,
    });
    expect(
      toStudentObservationsResponse({
        observations: [observation],
        tagCounts: { tag1: 1 },
      }),
    ).toEqual({
      observacoes: [
        {
          id: 'o1',
          marcacoes: [{ id: 'tag1', nome: 'Colaboração' }],
          texto: 'Contribuiu',
          criadaEm: createdAt,
        },
      ],
      contagem: { tag1: 1 },
    });
  });
});
