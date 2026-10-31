import { Test, type TestingModule } from '@nestjs/testing';
import { Formula, FormulaScope } from '../../domain/entities/formula.entity';
import {
  FORMULA_REPOSITORY,
  type FormulaRepository,
} from '../../domain/repositories/formula.repository';
import {
  DEFAULT_TEACHER_FORMULA_COMPONENTS,
  GetTeacherFormulaUseCase,
} from './get-teacher-formula.use-case';

describe('GetTeacherFormulaUseCase', () => {
  let useCase: GetTeacherFormulaUseCase;
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
        GetTeacherFormulaUseCase,
        {
          provide: FORMULA_REPOSITORY,
          useValue: formulaRepository,
        },
      ],
    }).compile();

    useCase = module.get(GetTeacherFormulaUseCase);
  });

  it('returns system default template when tutor has no custom formula', async () => {
    formulaRepository.findActiveByTutor.mockResolvedValue(null);

    const result = await useCase.execute({ tutorId: 'tutor-1' });

    expect(formulaRepository.findActiveByTutor).toHaveBeenCalledWith('tutor-1');
    expect(result).toEqual({
      scope: FormulaScope.PROFESSOR,
      isDefault: true,
      version: null,
      components: DEFAULT_TEACHER_FORMULA_COMPONENTS,
    });
  });

  it('returns active personal formula when configured for tutor', async () => {
    const existingFormula = Formula.create({
      scope: FormulaScope.PROFESSOR,
      version: 2,
      active: true,
      isDefault: true,
      createdBy: 'tutor-1',
      components: [
        { type: 'CRITERIOS', weight: 65 },
        { type: 'PAPEL', weight: 35 },
      ],
    });
    existingFormula.id = 'formula-uuid-1';

    formulaRepository.findActiveByTutor.mockResolvedValue(existingFormula);

    const result = await useCase.execute({ tutorId: 'tutor-1' });

    expect(formulaRepository.findActiveByTutor).toHaveBeenCalledWith('tutor-1');
    expect(result).toEqual({
      id: 'formula-uuid-1',
      scope: FormulaScope.PROFESSOR,
      isDefault: true,
      version: 2,
      components: [
        { type: 'CRITERIOS', weight: 65 },
        { type: 'PAPEL', weight: 35 },
      ],
    });
  });
});
