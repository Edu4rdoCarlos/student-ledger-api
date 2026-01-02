import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../../../shared/infra/decorators';
import {
  CreateStudentUseCase,
  GetStudentUseCase,
  ListStudentsUseCase,
  ListStudentsQuery,
} from '../../application/use-cases';
import { CreateStudentDto } from '../dtos';

@ApiTags('Alunos')
@ApiBearerAuth()
@Controller('alunos')
export class StudentsController {
  constructor(
    private readonly createStudent: CreateStudentUseCase,
    private readonly getStudent: GetStudentUseCase,
    private readonly listStudents: ListStudentsUseCase,
  ) {}

  @Post()
  @Roles('ADMIN', 'COORDINATOR', 'SECRETARY')
  @ApiOperation({ summary: 'Cadastrar novo aluno' })
  create(@Body() dto: CreateStudentDto) {
    return this.createStudent.execute(dto);
  }

  @Get()
  @Roles('ADMIN', 'COORDINATOR', 'SECRETARY')
  @ApiOperation({ summary: 'Listar alunos' })
  findAll(@Query() query: ListStudentsQuery) {
    return this.listStudents.execute(query);
  }

  @Get(':matricula')
  @ApiOperation({ summary: 'Buscar aluno por matrícula' })
  findOne(@Param('matricula') matricula: string) {
    return this.getStudent.execute(matricula);
  }
}
