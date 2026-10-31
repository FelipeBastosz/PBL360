import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { TeacherFormulaDto } from '../../application/dtos/teacher-formula.dto';

export const GetTeacherFormulaSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Obtém a fórmula padrão pessoal do professor',
    description:
      'Retorna a fórmula padrão do professor autenticado ou o modelo padrão do sistema caso ainda não configurada.',
  }),
  ApiOkResponse({
    description: 'Fórmula padrão do professor retornada com sucesso.',
    type: TeacherFormulaDto,
  }),
  ApiUnauthorizedResponse({ description: 'Token de acesso ausente ou inválido.' }),
  ApiForbiddenResponse({ description: 'Apenas professores têm acesso a esta rota.' }),
);

export const UpdateTeacherFormulaSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Atualiza ou cria a fórmula padrão pessoal do professor',
    description:
      'Salva o modelo pessoal do docente para servir de template em novas sessões, sem alterar sessões pré-existentes.',
  }),
  ApiOkResponse({
    description: 'Fórmula padrão do professor salva com sucesso.',
    type: TeacherFormulaDto,
  }),
  ApiBadRequestResponse({ description: 'Dados da requisição inválidos.' }),
  ApiUnprocessableEntityResponse({
    description: 'A soma dos pesos dos componentes deve ser exatamente 100%.',
  }),
  ApiUnauthorizedResponse({ description: 'Token de acesso ausente ou inválido.' }),
  ApiForbiddenResponse({ description: 'Apenas professores têm acesso a esta rota.' }),
);
