import type { BehaviorTagResponseDto } from '../../application/dtos/behavior-tag-response.dto';
import type { BehaviorTag } from '../../domain/entities/behavior-tag.entity';

export function toBehaviorTagResponse(tag: BehaviorTag): BehaviorTagResponseDto {
  return {
    id: tag.id,
    nome: tag.name,
    predefinida: tag.isPredefined(),
    ativa: tag.active,
  };
}
