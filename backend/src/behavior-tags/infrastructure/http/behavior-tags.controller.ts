import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { BehaviorTagNameDto } from '../../application/dtos/behavior-tag-name.dto';
import type { BehaviorTagResponseDto } from '../../application/dtos/behavior-tag-response.dto';
import { CreateBehaviorTagUseCase } from '../../application/use-cases/create-behavior-tag.use-case';
import { DeactivateBehaviorTagUseCase } from '../../application/use-cases/deactivate-behavior-tag.use-case';
import { ListBehaviorTagsUseCase } from '../../application/use-cases/list-behavior-tags.use-case';
import { RenameBehaviorTagUseCase } from '../../application/use-cases/rename-behavior-tag.use-case';
import { toBehaviorTagResponse } from './behavior-tag.mapper';
import {
  CreateBehaviorTagSwaggerDocs,
  DeactivateBehaviorTagSwaggerDocs,
  ListBehaviorTagsSwaggerDocs,
  RenameBehaviorTagSwaggerDocs,
} from './behavior-tag.swagger';

@ApiTags('Marcações')
@Controller('marcacoes')
@Roles(UserType.TUTOR)
export class BehaviorTagsController {
  constructor(
    private readonly listBehaviorTags: ListBehaviorTagsUseCase,
    private readonly createBehaviorTag: CreateBehaviorTagUseCase,
    private readonly renameBehaviorTag: RenameBehaviorTagUseCase,
    private readonly deactivateBehaviorTag: DeactivateBehaviorTagUseCase,
  ) {}

  @Get()
  @ListBehaviorTagsSwaggerDocs
  async list(@AuthenticatedUserId() tutorId: string): Promise<BehaviorTagResponseDto[]> {
    const tags = await this.listBehaviorTags.execute(tutorId);
    return tags.map(toBehaviorTagResponse);
  }

  @Post()
  @CreateBehaviorTagSwaggerDocs
  async create(
    @Body() dto: BehaviorTagNameDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<BehaviorTagResponseDto> {
    return toBehaviorTagResponse(await this.createBehaviorTag.execute(tutorId, dto.nome));
  }

  @Put(':id')
  @RenameBehaviorTagSwaggerDocs
  async rename(
    @UuidParam('id') id: string,
    @Body() dto: BehaviorTagNameDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<BehaviorTagResponseDto> {
    return toBehaviorTagResponse(await this.renameBehaviorTag.execute(id, tutorId, dto.nome));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeactivateBehaviorTagSwaggerDocs
  deactivate(@UuidParam('id') id: string, @AuthenticatedUserId() tutorId: string): Promise<void> {
    return this.deactivateBehaviorTag.execute(id, tutorId);
  }
}
