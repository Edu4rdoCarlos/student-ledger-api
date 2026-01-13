import { Controller, Get, Post, Put, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Roles, CurrentUser } from '../../../../shared/decorators';
import { CoordinatorCourseGuard } from '../../../../shared/guards';
import { ICurrentUser } from '../../../../shared/types';
import {
  CreateCourseUseCase,
  GetCourseUseCase,
  ListCoursesUseCase,
  UpdateCourseUseCase,
  ListCourseStudentsUseCase,
  ListCoursesQuery,
  ListCoursesResponse,
} from '../../application/use-cases';
import { CreateCourseDto, UpdateCourseDto, CourseResponseDto } from '../dtos';
import { HttpResponse } from '../../../../shared/dtos';
import { HttpResponseSerializer } from '../../../../shared/serializers';
import { StudentResponseDto } from '../../../students/presentation/dtos/response';
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
    private readonly listCourseStudents: ListCourseStudentsUseCase,
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

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'COORDINATOR')
  @UseGuards(CoordinatorCourseGuard)
  @ApiOperation({
    summary: 'Update course data',
    description: 'Updates name, active status and/or course coordinator. Admins can update any course, coordinators can only update their own course.'
  })
  @ApiCourseOkResponse()
  @ApiCourseUpdateErrorResponses()
  async update(@Param('id') id: string, @Body() dto: UpdateCourseDto): Promise<HttpResponse<CourseResponseDto>> {
    const course = await this.updateCourse.execute(id, dto);
    return HttpResponseSerializer.serialize(course);
  }

  @Get(':id/students')
  @Roles('ADMIN', 'COORDINATOR')
  @ApiOperation({
    summary: 'List students from a course',
    description: 'Returns all students enrolled in the specified course. Coordinators can only access students from their own course, admins can access any course.'
  })
  @ApiResponse({
    status: 200,
    description: 'Students list retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/StudentResponseDto' }
        }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Coordinator trying to access students from another course',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  async listStudents(
    @Param('id') courseId: string,
    @CurrentUser() currentUser: ICurrentUser,
  ) {
    const students = await this.listCourseStudents.execute({ courseId, currentUser });
    return { data: students };
  }
}
