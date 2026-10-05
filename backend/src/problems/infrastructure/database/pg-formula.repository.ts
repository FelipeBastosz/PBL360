import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Formula, FormulaScope } from '../../domain/entities/formula.entity';
import { FormulaRepository } from '../../domain/repositories/formula.repository';

@Injectable()
export class PgFormulaRepository implements FormulaRepository {
  constructor(
    @InjectRepository(Formula)
    private readonly typeOrmRepository: Repository<Formula>,
  ) {}

  async findActiveByProblemAndScope(problemId: string, scope: FormulaScope): Promise<Formula | null> {
    return this.typeOrmRepository.findOne({
      where: { problemId, scope, active: true },
      relations: ['components'],
    });
  }

  async saveNewVersion(oldFormula: Formula | null, newFormula: Formula): Promise<Formula> {
    return this.typeOrmRepository.manager.transaction(async (manager) => {
      if (oldFormula) {
        oldFormula.active = false;
        await manager.save(Formula, oldFormula);
      }
      return manager.save(Formula, newFormula);
    });
  }

  async deactivate(formula: Formula): Promise<void> {
    formula.active = false;
    await this.typeOrmRepository.save(formula);
  }
}
