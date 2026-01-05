import { Controller, Get, Post, Put, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Roles } from '../../../../shared/decorators';
import {
  CreateCourseUseCase,
  GetCourseUseCase,
  ListCoursesUseCase,
  UpdateCourseUseCase,
  ListCoursesQuery,
  ListCoursesResponse,
} from '../../application/use-cases';
import { CreateCourseDto, UpdateCourseDto, CourseResponseDto } from '../dtos';
import { HttpResponse } from '../../../../shared/dtos';
import { HttpResponseSerializer } from '../../../../shared/serializers';
import { ApiCourseListResponse, ApiCourseCreatedResponse, ApiCourseOkResponse } from '../docs';

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
  @ApiCourseCreatedResponse()
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
  async create(@Body() dto: CreateCourseDto): Promise<HttpResponse<CourseResponseDto>> {
    const course = await this.createCourse.execute(dto);
    return HttpResponseSerializer.serialize(course);
  }

  @Get()
  @Roles('ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT')
  @ApiOperation({ summary: 'Listar cursos' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página' })
  @ApiQuery({ name: 'perPage', required: false, type: Number, description: 'Quantidade de itens por página' })
  @ApiQuery({ name: 'departmentId', required: false, type: String, description: 'Filtrar por ID do departamento' })
  @ApiCourseListResponse()
  @ApiResponse({
    status: 401,
    description: 'Não autenticado'
  })
  async findAll(@Query() query: ListCoursesQuery): Promise<ListCoursesResponse> {
    return this.listCourses.execute(query);
  }

  @Get(':code')
  @Roles('ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT')
  @ApiOperation({ summary: 'Buscar curso por código' })
  @ApiCourseOkResponse()
  @ApiResponse({
    status: 404,
    description: 'Curso não encontrado'
  })
  @ApiResponse({
    status: 401,
    description: 'Não autenticado'
  })
  async findOne(@Param('code') code: string): Promise<HttpResponse<CourseResponseDto>> {
    const course = await this.getCourse.execute(code);
    return HttpResponseSerializer.serialize(course);
  }

  @Put(':code')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'COORDINATOR')
  @ApiOperation({
    summary: 'Atualizar dados do curso',
    description: 'Atualiza nome, departamento, status ativo e/ou coordenador do curso. Apenas coordenadores e admins podem atualizar.'
  })
  @ApiCourseOkResponse()
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
  async update(@Param('code') code: string, @Body() dto: UpdateCourseDto): Promise<HttpResponse<CourseResponseDto>> {
    const course = await this.updateCourse.execute(code, dto);
    return HttpResponseSerializer.serialize(course);
  }
}
