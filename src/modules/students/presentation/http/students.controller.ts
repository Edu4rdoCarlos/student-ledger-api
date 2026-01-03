import { Controller, Get, Post, Put, Patch, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../../../../shared/decorators';
import {
  CreateStudentUseCase,
  GetStudentUseCase,
  ListStudentsUseCase,
  UpdateStudentUseCase,
  ListStudentsQuery,
  ChangePasswordUseCase,
} from '../../application/use-cases';
import { CreateStudentDto, UpdateStudentDto } from '../dtos';
import { ChangePasswordDto } from '../../../../shared/dtos';

@ApiTags('Alunos')
@ApiBearerAuth()
@Controller('alunos')
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
  @ApiResponse({
    status: 201,
    description: 'Aluno cadastrado com sucesso. Usuário e estudante criados em uma transação atômica.'
  })
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
  create(@Body() dto: CreateStudentDto) {
    return this.createStudent.execute(dto);
  }

  @Get()
  @Roles('ADMIN', 'COORDINATOR')
  @ApiOperation({ summary: 'Listar alunos' })
  findAll(@Query() query: ListStudentsQuery) {
    return this.listStudents.execute(query);
  }

  @Get(':matricula')
  @Roles('ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT')
  @ApiOperation({ summary: 'Buscar aluno por matrícula' })
  @ApiResponse({
    status: 200,
    description: 'Aluno encontrado'
  })
  @ApiResponse({
    status: 404,
    description: 'Aluno não encontrado'
  })
  @ApiResponse({
    status: 401,
    description: 'Não autenticado'
  })
  findOne(@Param('matricula') matricula: string) {
    return this.getStudent.execute(matricula);
  }

  @Put(':matricula')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'COORDINATOR', 'STUDENT')
  @ApiOperation({
    summary: 'Atualizar dados do aluno',
    description: 'Atualiza o nome do usuário e/ou curso do aluno. Estudantes podem atualizar apenas seus próprios dados.'
  })
  @ApiResponse({
    status: 200,
    description: 'Aluno atualizado com sucesso.'
  })
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
  update(@Param('matricula') matricula: string, @Body() dto: UpdateStudentDto) {
    return this.updateStudent.execute(matricula, dto);
  }

  @Patch(':matricula/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('STUDENT', 'ADMIN')
  @ApiOperation({
    summary: 'Alterar senha do aluno',
    description: 'Permite que o aluno altere sua própria senha ou que um administrador altere a senha de qualquer aluno.'
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
  async changePasswordHandler(@Param('matricula') matricula: string, @Body() dto: ChangePasswordDto) {
    await this.changePassword.execute(matricula, dto);
  }
}
