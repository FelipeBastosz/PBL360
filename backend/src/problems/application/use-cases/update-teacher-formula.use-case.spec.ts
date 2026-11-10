import { Test, type TestingModule } from '@nestjs/testing';
import { UnprocessableEntityError } from '@/shared/errors/application.error';
import { Formula, FormulaScope } from '../../domain/entities/formula.entity';
import {
  FORMULA_REPOSITORY,
  type FormulaRepository,
} from '../../domain/repositories/formula.repository';
import { UpdateTeacherFormulaUseCase } from './update-teacher-formula.use-case';

describe('UpdateTeacherFormulaUseCase', () => {
  let useCase: UpdateTeacherFormulaUseCase;
  let formulaRepository: jest.Mocked<FormulaRepository>;

  beforeEach(async () => {
    formulaRepository = {
      findActiveByProblemAndScope: jest.fn(),
      findActiveByTutor: jest.fn(),
      saveNewVersion: jest.fn(),
      deactivate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateTeacherFormulaUseCase,
        {
          provide: FORMULA_REPOSITORY,
          useValue: formulaRepository,
        },
      ],
    }).compile();

    useCase = module.get(UpdateTeacherFormulaUseCase);
  });

  it('creates version 1 when no previous formula exists for tutor', async () => {
    formulaRepository.findActiveByTutor.mockResolvedValue(null);
    formulaRepository.saveNewVersion.mockImplementation((_old, candidate) => {
      candidate.id = 'generated-uuid-1';
      return Promise.resolve(candidate);
    });

    const result = await useCase.execute({
      tutorId: 'tutor-1',
      components: [
        { type: 'CRITERIOS', weight: 60 },
        { type: 'PAPEL', weight: 40 },
      ],
    });

    expect(formulaRepository.findActiveByTutor).toHaveBeenCalledWith('tutor-1');
    expect(formulaRepository.saveNewVersion).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        scope: FormulaScope.PROFESSOR,
        version: 1,
        active: true,
        isDefault: true,
        createdBy: 'tutor-1',
      }),
    );
    expect(result).toEqual({
      id: 'generated-uuid-1',
      scope: FormulaScope.PROFESSOR,
      isDefault: true,
      version: 1,
      components: [
        { type: 'CRITERIOS', weight: 60 },
        { type: 'PAPEL', weight: 40 },
      ],
    });
  });

  it('increments version and passes old formula to saveNewVersion when updating', async () => {
    const existing = Formula.create({
      scope: FormulaScope.PROFESSOR,
      version: 1,
      active: true,
      isDefault: true,
      createdBy: 'tutor-1',
      components: [
        { type: 'CRITERIOS', weight: 70 },
        { type: 'PAPEL', weight: 30 },
      ],
    });
    existing.id = 'old-formula-id';

    formulaRepository.findActiveByTutor.mockResolvedValue(existing);
    formulaRepository.saveNewVersion.mockImplementation((_old, candidate) => {
      candidate.id = 'new-formula-id';
      return Promise.resolve(candidate);
    });

    const result = await useCase.execute({
      tutorId: 'tutor-1',
      components: [
        { type: 'CRITERIOS', weight: 80 },
        { type: 'PAPEL', weight: 20 },
      ],
    });

    expect(formulaRepository.saveNewVersion).toHaveBeenCalledWith(
      existing,
      expect.objectContaining({
        scope: FormulaScope.PROFESSOR,
        version: 2,
        active: true,
        isDefault: true,
        createdBy: 'tutor-1',
      }),
    );
    expect(result.version).toBe(2);
    expect(result.id).toBe('new-formula-id');
  });

  it('rejects update if components do not sum to 100', async () => {
    await expect(
      useCase.execute({
        tutorId: 'tutor-1',
        components: [
          { type: 'CRITERIOS', weight: 50 },
          { type: 'PAPEL', weight: 30 },
        ],
      }),
    ).rejects.toThrow(UnprocessableEntityError);

    expect(formulaRepository.saveNewVersion).not.toHaveBeenCalled();
  });

  it('rejects update if components are not CRITERIOS and PAPEL', async () => {
    await expect(
      useCase.execute({
        tutorId: 'tutor-1',
        components: [
          { type: 'CRITERIOS', weight: 50 },
          { type: 'CRITERIOS', weight: 50 },
        ],
      }),
    ).rejects.toThrow(UnprocessableEntityError);

    expect(formulaRepository.saveNewVersion).not.toHaveBeenCalled();
  });
});
