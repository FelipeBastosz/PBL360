import { ServiceUnavailableException } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { GetHealthStatusUseCase } from './get-health-status.use-case';

describe('GetHealthStatusUseCase', () => {
  let useCase: GetHealthStatusUseCase;
  let dataSourceMock: { query: jest.Mock };

  beforeEach(() => {
    dataSourceMock = {
      query: jest.fn(),
    };
    useCase = new GetHealthStatusUseCase(dataSourceMock as unknown as DataSource);
  });

  it('returns ok status when database query succeeds', async () => {
    dataSourceMock.query.mockResolvedValueOnce([{ '?column?': 1 }]);

    const result = await useCase.execute();

    expect(dataSourceMock.query).toHaveBeenCalledWith('SELECT 1;');
    expect(result).toMatchObject({
      status: 'ok',
      banco: 'ok',
    });
    expect(typeof result.versao).toBe('string');
  });

  it('throws ServiceUnavailableException when database query fails', async () => {
    dataSourceMock.query.mockRejectedValueOnce(new Error('Connection lost'));

    await expect(useCase.execute()).rejects.toThrow(ServiceUnavailableException);

    try {
      await useCase.execute();
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        expect(error.getStatus()).toBe(503);
        expect(error.getResponse()).toMatchObject({
          status: 'erro',
          banco: 'indisponivel',
        });
      }
    }
  });
});
