import { Controller, Get, Post, Put, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../../../../shared/decorators';
import {
  CreateCourseUseCase,
  GetCourseUseCase,
  ListCoursesUseCase,
  UpdateCourseUseCase,
  ListCoursesQuery,
} from '../../application/use-cases';
import { CreateCourseDto, UpdateCourseDto } from '../dtos';

@ApiTags('Courses')
@ApiBearerAuth()
@Controller('courses')
export class CoursesController {
  constructor(
    private readonly createCourse: CreateCourseUseCase,
    private readonly getCourse: GetCourseUseCase,
    private readonly listCourses: ListCoursesUseCase,
    private readonly updateCourse: UpdateCourseUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'COORDINATOR')
  @ApiOperation({
    summary: 'Cadastrar novo curso',
    description: 'Cria um novo curso no sistema. Apenas coordenadores e admins podem cadastrar.'
  })
  @ApiResponse({
    status: 201,
    description: 'Curso cadastrado com sucesso.'
  })
  @ApiResponse({
    status: 409,
    description: 'Código de curso já cadastrado'
  })
  @ApiResponse({
    status: 404,
    description: 'Organização ou coordenador não encontrado'
  })
  @ApiResponse({
    status: 401,
    description: 'Não autenticado'
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão. Apenas coordenadores e admins podem cadastrar cursos.'
  })
  create(@Body() dto: CreateCourseDto) {
    return this.createCourse.execute(dto);
  }

  @Get()
  @Roles('ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT')
  @ApiOperation({ summary: 'Listar cursos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cursos retornada com sucesso'
  })
  @ApiResponse({
    status: 401,
    description: 'Não autenticado'
  })
  findAll(@Query() query: ListCoursesQuery) {
    return this.listCourses.execute(query);
  }

  @Get(':codigo')
  @Roles('ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT')
  @ApiOperation({ summary: 'Buscar curso por código' })
  @ApiResponse({
    status: 200,
    description: 'Curso encontrado'
  })
  @ApiResponse({
    status: 404,
    description: 'Curso não encontrado'
  })
  @ApiResponse({
    status: 401,
    description: 'Não autenticado'
  })
  findOne(@Param('codigo') codigo: string) {
    return this.getCourse.execute(codigo);
  }

  @Put(':codigo')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'COORDINATOR')
  @ApiOperation({
    summary: 'Atualizar dados do curso',
    description: 'Atualiza nome, departamento, status ativo e/ou coordenador do curso. Apenas coordenadores e admins podem atualizar.'
  })
  @ApiResponse({
    status: 200,
    description: 'Curso atualizado com sucesso.'
  })
  @ApiResponse({
    status: 404,
    description: 'Curso ou coordenador não encontrado'
  })
  @ApiResponse({
    status: 401,
    description: 'Não autenticado'
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão. Apenas coordenadores e admins podem atualizar cursos.'
  })
  update(@Param('codigo') codigo: string, @Body() dto: UpdateCourseDto) {
    return this.updateCourse.execute(codigo, dto);
  }
}
