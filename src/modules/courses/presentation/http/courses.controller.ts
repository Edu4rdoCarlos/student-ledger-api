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
    summary: 'Register new course',
    description: 'Creates a new course in the system. Only coordinators and admins can register.'
  })
  @ApiCourseCreatedResponse()
  @ApiResponse({
    status: 409,
    description: 'Course code already registered'
  })
  @ApiResponse({
    status: 404,
    description: 'Organization or coordinator not found'
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated'
  })
  @ApiResponse({
    status: 403,
    description: 'No permission. Only coordinators and admins can register courses.'
  })
  async create(@Body() dto: CreateCourseDto): Promise<HttpResponse<CourseResponseDto>> {
    const course = await this.createCourse.execute(dto);
    return HttpResponseSerializer.serialize(course);
  }

  @Get()
  @Roles('ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT')
  @ApiOperation({ summary: 'List courses' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'perPage', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'departmentId', required: false, type: String, description: 'Filter by department ID' })
  @ApiCourseListResponse()
  @ApiResponse({
    status: 401,
    description: 'Not authenticated'
  })
  async findAll(@Query() query: ListCoursesQuery): Promise<ListCoursesResponse> {
    return this.listCourses.execute(query);
  }

  @Get(':code')
  @Roles('ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT')
  @ApiOperation({ summary: 'Find course by code' })
  @ApiCourseOkResponse()
  @ApiResponse({
    status: 404,
    description: 'Course not found'
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated'
  })
  async findOne(@Param('code') code: string): Promise<HttpResponse<CourseResponseDto>> {
    const course = await this.getCourse.execute(code);
    return HttpResponseSerializer.serialize(course);
  }

  @Put(':code')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'COORDINATOR')
  @ApiOperation({
    summary: 'Update course data',
    description: 'Updates name, department, active status and/or course coordinator. Only coordinators and admins can update.'
  })
  @ApiCourseOkResponse()
  @ApiResponse({
    status: 404,
    description: 'Course or coordinator not found'
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated'
  })
  @ApiResponse({
    status: 403,
    description: 'No permission. Only coordinators and admins can update courses.'
  })
  async update(@Param('code') code: string, @Body() dto: UpdateCourseDto): Promise<HttpResponse<CourseResponseDto>> {
    const course = await this.updateCourse.execute(code, dto);
    return HttpResponseSerializer.serialize(course);
  }
}
