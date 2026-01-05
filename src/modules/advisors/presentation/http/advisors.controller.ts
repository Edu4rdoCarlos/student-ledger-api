import { Controller, Get, Post, Put, Patch, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Roles } from '../../../../shared/decorators';
import {
  CreateAdvisorUseCase,
  GetAdvisorUseCase,
  ListAdvisorsUseCase,
  UpdateAdvisorUseCase,
  ListAdvisorsQuery,
  ListAdvisorsResponse,
  ChangePasswordUseCase,
} from '../../application/use-cases';
import { CreateAdvisorDto, UpdateAdvisorDto, AdvisorResponseDto } from '../dtos';
import { ChangePasswordDto, HttpResponse } from '../../../../shared/dtos';
import { HttpResponseSerializer } from '../../../../shared/serializers';
import { ApiAdvisorListResponse, ApiAdvisorCreatedResponse, ApiAdvisorOkResponse } from '../docs';

@ApiTags('Advisors')
@ApiBearerAuth()
@Controller('advisors')
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
  @ApiAdvisorCreatedResponse()
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
  async create(@Body() dto: CreateAdvisorDto): Promise<HttpResponse<AdvisorResponseDto>> {
    const advisor = await this.createAdvisor.execute(dto);
    return HttpResponseSerializer.serialize(advisor);
  }

  @Get()
  @Roles('ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT')
  @ApiOperation({ summary: 'Listar orientadores' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página' })
  @ApiQuery({ name: 'perPage', required: false, type: Number, description: 'Quantidade de itens por página' })
  @ApiQuery({ name: 'courseId', required: false, type: String, description: 'Filtrar por ID do curso' })
  @ApiAdvisorListResponse()
  @ApiResponse({
    status: 401,
    description: 'Não autenticado'
  })
  async findAll(@Query() query: ListAdvisorsQuery): Promise<ListAdvisorsResponse> {
    return this.listAdvisors.execute(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT')
  @ApiOperation({ summary: 'Buscar orientador por ID' })
  @ApiAdvisorOkResponse()
  @ApiResponse({
    status: 404,
    description: 'Orientador não encontrado'
  })
  @ApiResponse({
    status: 401,
    description: 'Não autenticado'
  })
  async findOne(@Param('id') id: string): Promise<HttpResponse<AdvisorResponseDto>> {
    const advisor = await this.getAdvisor.execute(id);
    return HttpResponseSerializer.serialize(advisor);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'COORDINATOR', 'ADVISOR')
  @ApiOperation({
    summary: 'Atualizar dados do orientador',
    description: 'Atualiza nome, departamento e/ou curso do orientador. Orientadores podem atualizar apenas seus próprios dados.'
  })
  @ApiAdvisorOkResponse()
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
  async update(@Param('id') id: string, @Body() dto: UpdateAdvisorDto): Promise<HttpResponse<AdvisorResponseDto>> {
    const advisor = await this.updateAdvisor.execute(id, dto);
    return HttpResponseSerializer.serialize(advisor);
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
