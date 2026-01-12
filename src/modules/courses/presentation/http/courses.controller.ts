import { Controller, Get, Post, Put, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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
import {
  ApiCourseListResponse,
  ApiCourseCreatedResponse,
  ApiCourseOkResponse,
  ApiCourseErrorResponses,
  ApiCourseCreateErrorResponses,
  ApiCourseUpdateErrorResponses,
  ApiCourseFindOneErrorResponses,
} from '../docs';

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
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Register new course',
    description: 'Creates a new course in the system. Only admins can register.'
  })
  @ApiCourseCreatedResponse()
  @ApiCourseCreateErrorResponses()
  async create(@Body() dto: CreateCourseDto): Promise<HttpResponse<CourseResponseDto>> {
    const course = await this.createCourse.execute(dto);
    return HttpResponseSerializer.serialize(course);
  }

  @Get()
  @Roles('ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT')
  @ApiOperation({ summary: 'List courses' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'perPage', required: false, type: Number, description: 'Items per page' })
  @ApiCourseListResponse()
  @ApiCourseErrorResponses()
  async findAll(@Query() query: ListCoursesQuery): Promise<ListCoursesResponse> {
    return this.listCourses.execute(query);
  }

  @Get(':code')
  @Roles('ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT')
  @ApiOperation({ summary: 'Find course by code' })
  @ApiCourseOkResponse()
  @ApiCourseFindOneErrorResponses()
  async findOne(@Param('code') code: string): Promise<HttpResponse<CourseResponseDto>> {
    const course = await this.getCourse.execute(code);
    return HttpResponseSerializer.serialize(course);
  }

  @Put(':code')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Update course data',
    description: 'Updates name, active status and/or course coordinator. Only admins can update.'
  })
  @ApiCourseOkResponse()
  @ApiCourseUpdateErrorResponses()
  async update(@Param('code') code: string, @Body() dto: UpdateCourseDto): Promise<HttpResponse<CourseResponseDto>> {
    const course = await this.updateCourse.execute(code, dto);
    return HttpResponseSerializer.serialize(course);
  }
}
