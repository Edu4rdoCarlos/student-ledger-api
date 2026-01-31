import { Controller, Get, Post, Put, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Roles, CurrentUser } from '../../../../../shared/decorators';
import { CoordinatorCourseGuard } from '../../../../../shared/guards';
import { ICurrentUser } from '../../../../../shared/types';
import {
  CreateCourseUseCase,
  GetCourseUseCase,
  ListCoursesUseCase,
  UpdateCourseUseCase,
  ListCourseStudentsUseCase,
  ListCourseAdvisorsUseCase,
  ListCoursesQuery,
  ListCoursesResponse,
} from '../../application/use-cases';
import { CreateCourseDto, UpdateCourseDto, CourseResponseDto } from '../dtos';
import { HttpResponse } from '../../../../../shared/dtos';
import { HttpResponseSerializer } from '../../../../../shared/serializers';
import {
  ApiCourseListResponse,
  ApiCourseCreatedResponse,
  ApiCourseOkResponse,
  ApiCourseErrorResponses,
  ApiCourseCreateErrorResponses,
  ApiCourseUpdateErrorResponses,
  ApiCourseFindOneErrorResponses,
  ApiCourseStudentsListResponse,
  ApiCourseStudentsListErrorResponses,
  ApiCourseAdvisorsListResponse,
  ApiCourseAdvisorsListErrorResponses,
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
    private readonly listCourseAdvisors: ListCourseAdvisorsUseCase,
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
  @Roles('COORDINATOR', 'ADVISOR', 'STUDENT', 'ADMIN')
  @ApiOperation({ summary: 'List courses' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'perPage', required: false, type: Number, description: 'Items per page' })
  @ApiCourseListResponse()
  @ApiCourseErrorResponses()
  async findAll(@Query() query: ListCoursesQuery): Promise<ListCoursesResponse> {
    return this.listCourses.execute(query);
  }

  @Get(':code')
  @Roles('COORDINATOR', 'ADVISOR', 'STUDENT', 'ADMIN')
  @ApiOperation({ summary: 'Find course by code' })
  @ApiCourseOkResponse()
  @ApiCourseFindOneErrorResponses()
  async findOne(@Param('code') code: string): Promise<HttpResponse<CourseResponseDto>> {
    const course = await this.getCourse.execute(code);
    return HttpResponseSerializer.serialize(course);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('COORDINATOR', 'ADMIN')
  @UseGuards(CoordinatorCourseGuard)
  @ApiOperation({
    summary: 'Update course data',
    description: 'Updates name, active status and/or course coordinator. Coordinators can only update their own course.'
  })
  @ApiCourseOkResponse()
  @ApiCourseUpdateErrorResponses()
  async update(@Param('id') id: string, @Body() dto: UpdateCourseDto): Promise<HttpResponse<CourseResponseDto>> {
    const course = await this.updateCourse.execute(id, dto);
    return HttpResponseSerializer.serialize(course);
  }

  @Get(':id/students')
  @Roles('COORDINATOR', 'ADMIN')
  @ApiOperation({
    summary: 'List students from a course',
    description: 'Returns all students enrolled in the specified course. Coordinators can only access students from their own course.'
  })
  @ApiCourseStudentsListResponse()
  @ApiCourseStudentsListErrorResponses()
  async listStudents(
    @Param('id') courseId: string,
    @CurrentUser() currentUser: ICurrentUser,
  ) {
    const students = await this.listCourseStudents.execute({ courseId, currentUser });
    return { data: students };
  }

  @Get(':id/advisors')
  @Roles('COORDINATOR', 'ADMIN')
  @ApiOperation({
    summary: 'List advisors from a course',
    description: 'Returns all advisors from the specified course. Coordinators can only access advisors from their own course.'
  })
  @ApiCourseAdvisorsListResponse()
  @ApiCourseAdvisorsListErrorResponses()
  async listAdvisors(
    @Param('id') courseId: string,
    @CurrentUser() currentUser: ICurrentUser,
  ) {
    const advisors = await this.listCourseAdvisors.execute({ courseId, currentUser });
    return { data: advisors };
  }
}
