import { Controller, Get, Post, Put, Patch, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Roles, CurrentUser } from '../../../../shared/decorators';
import {
  CreateStudentUseCase,
  GetStudentUseCase,
  ListStudentsUseCase,
  UpdateStudentUseCase,
  ListStudentsQuery,
  ListStudentsResponse,
  ChangePasswordUseCase,
} from '../../application/use-cases';
import { CreateStudentDto, UpdateStudentDto, StudentResponseDto } from '../dtos';
import { ChangePasswordDto, HttpResponse } from '../../../../shared/dtos';
import { HttpResponseSerializer } from '../../../../shared/serializers';
import { ApiStudentListResponse, ApiStudentCreatedResponse, ApiStudentOkResponse } from '../docs';

@ApiTags('Students')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(
    private readonly createStudent: CreateStudentUseCase,
    private readonly getStudent: GetStudentUseCase,
    private readonly listStudents: ListStudentsUseCase,
    private readonly updateStudent: UpdateStudentUseCase,
    private readonly changePassword: ChangePasswordUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'COORDINATOR')
  @ApiOperation({
    summary: 'Cadastrar novo aluno',
    description: 'Cria um novo usuário com role STUDENT e vincula ao registro de aluno. A operação é atômica: ou cria ambos ou nenhum.'
  })
  @ApiStudentCreatedResponse()
  @ApiResponse({
    status: 409,
    description: 'Matrícula ou email já cadastrados'
  })
  @ApiResponse({
    status: 404,
    description: 'Curso não encontrado'
  })
  @ApiResponse({
    status: 401,
    description: 'Não autenticado'
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão. Apenas coordenadores e admins podem cadastrar alunos.'
  })
  async create(@Body() dto: CreateStudentDto): Promise<HttpResponse<StudentResponseDto>> {
    const student = await this.createStudent.execute(dto);
    return HttpResponseSerializer.serialize(student);
  }

  @Get()
  @Roles('ADMIN', 'COORDINATOR')
  @ApiOperation({ summary: 'Listar alunos' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página' })
  @ApiQuery({ name: 'perPage', required: false, type: Number, description: 'Quantidade de itens por página' })
  @ApiQuery({ name: 'courseId', required: false, type: String, description: 'Filtrar por ID do curso' })
  @ApiStudentListResponse()
  async findAll(@Query() query: ListStudentsQuery): Promise<ListStudentsResponse> {
    return this.listStudents.execute(query);
  }

  @Get(':registration')
  @Roles('ADMIN', 'COORDINATOR')
  @ApiOperation({ summary: 'Buscar aluno por matrícula' })
  @ApiStudentOkResponse()
  @ApiResponse({
    status: 404,
    description: 'Aluno não encontrado'
  })
  @ApiResponse({
    status: 401,
    description: 'Não autenticado'
  })
  async findOne(@Param('registration') registration: string): Promise<HttpResponse<StudentResponseDto>> {
    const student = await this.getStudent.execute(registration);
    return HttpResponseSerializer.serialize(student);
  }

  @Put(':registration')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'COORDINATOR')
  @ApiOperation({
    summary: 'Atualizar dados do aluno',
    description: 'Atualiza o nome do usuário e/ou curso do aluno. Apenas administradores e coordenadores podem atualizar.'
  })
  @ApiStudentOkResponse()
  @ApiResponse({
    status: 404,
    description: 'Aluno ou curso não encontrado'
  })
  @ApiResponse({
    status: 401,
    description: 'Não autenticado'
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão'
  })
  async update(@Param('registration') registration: string, @Body() dto: UpdateStudentDto): Promise<HttpResponse<StudentResponseDto>> {
    const student = await this.updateStudent.execute(registration, dto);
    return HttpResponseSerializer.serialize(student);
  }

  @Patch('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('STUDENT')
  @ApiOperation({
    summary: 'Alterar senha do aluno',
    description: 'Permite que o aluno altere sua própria senha.'
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
    description: 'Aluno não encontrado'
  })
  async changePasswordHandler(@CurrentUser() currentUser: { id: string }, @Body() dto: ChangePasswordDto) {
    await this.changePassword.execute(currentUser.id, dto);
  }
}
