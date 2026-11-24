import {
  toProblemDeliveriesListResponse,
  toProblemDeliveryResponse,
} from './problem-delivery.mapper';

describe('problem-delivery mapper', () => {
  const submittedAt = new Date('2026-11-23T21:30:00.000Z');
  const summary = {
    id: '11111111-1111-4111-8111-111111111111',
    url: 'https://drive.google.com/drive/folders/abc',
    submittedBy: { id: '22222222-2222-4222-8222-222222222222', name: 'Ana Souza' },
    submittedAt,
  };

  it('maps a delivery summary into the Portuguese API contract', () => {
    expect(toProblemDeliveryResponse(summary)).toEqual({
      id: summary.id,
      url: summary.url,
      enviadoPor: { id: summary.submittedBy.id, nome: 'Ana Souza' },
      enviadoEm: submittedAt,
    });
  });

  it('maps the deliveries list output with minhaEntregaId and entregas', () => {
    expect(
      toProblemDeliveriesListResponse({ myDeliveryId: summary.id, deliveries: [summary] }),
    ).toEqual({
      minhaEntregaId: summary.id,
      entregas: [
        {
          id: summary.id,
          url: summary.url,
          enviadoPor: { id: summary.submittedBy.id, nome: 'Ana Souza' },
          enviadoEm: submittedAt,
        },
      ],
    });
  });
});
