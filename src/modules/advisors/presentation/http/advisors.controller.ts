import { Controller, Get, Post, Put, Patch, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../../../../shared/decorators';
import {
  CreateAdvisorUseCase,
  GetAdvisorUseCase,
  ListAdvisorsUseCase,
  UpdateAdvisorUseCase,
  ListAdvisorsQuery,
  ChangePasswordUseCase,
} from '../../application/use-cases';
import { CreateAdvisorDto, UpdateAdvisorDto } from '../dtos';
import { ChangePasswordDto } from '../../../../shared/dtos';

@ApiTags('Orientadores')
@ApiBearerAuth()
@Controller('orientadores')
export class AdvisorsController {
  constructor(
    private readonly createAdvisor: CreateAdvisorUseCase,
    private readonly getAdvisor: GetAdvisorUseCase,
    private readonly listAdvisors: ListAdvisorsUseCase,
    private readonly updateAdvisor: UpdateAdvisorUseCase,
    private readonly changePassword: ChangePasswordUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'COORDINATOR')
  @ApiOperation({
    summary: 'Cadastrar novo orientador',
    description: 'Cria um novo usuário com role ADVISOR e vincula ao registro de orientador. A operação é atômica: ou cria ambos ou nenhum.'
  })
  @ApiResponse({
    status: 201,
    description: 'Orientador cadastrado com sucesso. Usuário e orientador criados em uma transação atômica.'
  })
  @ApiResponse({
    status: 409,
    description: 'Email já cadastrado'
  })
  @ApiResponse({
    status: 401,
    description: 'Não autenticado'
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão. Apenas coordenadores e admins podem cadastrar orientadores.'
  })
  create(@Body() dto: CreateAdvisorDto) {
    return this.createAdvisor.execute(dto);
  }

  @Get()
  @Roles('ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT')
  @ApiOperation({ summary: 'Listar orientadores' })
  @ApiResponse({
    status: 200,
    description: 'Lista de orientadores retornada com sucesso'
  })
  @ApiResponse({
    status: 401,
    description: 'Não autenticado'
  })
  findAll(@Query() query: ListAdvisorsQuery) {
    return this.listAdvisors.execute(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT')
  @ApiOperation({ summary: 'Buscar orientador por ID' })
  @ApiResponse({
    status: 200,
    description: 'Orientador encontrado'
  })
  @ApiResponse({
    status: 404,
    description: 'Orientador não encontrado'
  })
  @ApiResponse({
    status: 401,
    description: 'Não autenticado'
  })
  findOne(@Param('id') id: string) {
    return this.getAdvisor.execute(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'COORDINATOR', 'ADVISOR')
  @ApiOperation({
    summary: 'Atualizar dados do orientador',
    description: 'Atualiza nome, departamento e/ou curso do orientador. Orientadores podem atualizar apenas seus próprios dados.'
  })
  @ApiResponse({
    status: 200,
    description: 'Orientador atualizado com sucesso.'
  })
  @ApiResponse({
    status: 404,
    description: 'Orientador não encontrado'
  })
  @ApiResponse({
    status: 401,
    description: 'Não autenticado'
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão'
  })
  update(@Param('id') id: string, @Body() dto: UpdateAdvisorDto) {
    return this.updateAdvisor.execute(id, dto);
  }

  @Patch(':id/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADVISOR', 'ADMIN')
  @ApiOperation({
    summary: 'Alterar senha do orientador',
    description: 'Permite que o orientador altere sua própria senha ou que um administrador altere a senha de qualquer orientador.'
  })
  @ApiResponse({
    status: 204,
    description: 'Senha alterada com sucesso.'
  })
  @ApiResponse({
    status: 401,
    description: 'Senha atual incorreta ou não autenticado'
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão'
  })
  @ApiResponse({
    status: 404,
    description: 'Orientador não encontrado'
  })
  async changePasswordHandler(@Param('id') id: string, @Body() dto: ChangePasswordDto) {
    await this.changePassword.execute(id, dto);
  }
}
