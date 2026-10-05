import type { GetHealthStatusUseCase } from '../../application/use-cases/get-health-status.use-case';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let useCaseMock: jest.Mocked<GetHealthStatusUseCase>;

  beforeEach(() => {
    useCaseMock = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetHealthStatusUseCase>;
    controller = new HealthController(useCaseMock);
  });

  it('delegates check to GetHealthStatusUseCase and returns result', async () => {
    const expected = { status: 'ok', banco: 'ok', versao: '0.1.0' };
    useCaseMock.execute.mockResolvedValueOnce(expected);

    const result = await controller.check();

    expect(useCaseMock.execute).toHaveBeenCalledTimes(1);
    expect(result).toBe(expected);
  });
});
