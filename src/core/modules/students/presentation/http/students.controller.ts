import { Controller, Get, Post, Put, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles, CurrentUser } from '../../../../../shared/decorators';
import {
  CreateStudentUseCase,
  GetStudentUseCase,
  ListStudentsUseCase,
  UpdateStudentUseCase,
  ListStudentsResponse,
} from '../../application/use-cases';
import { CreateStudentDto, UpdateStudentDto, ListStudentsDto, StudentResponseDto } from '../dtos';
import { HttpResponse } from '../../../../../shared/dtos';
import { HttpResponseSerializer } from '../../../../../shared/serializers';
import { ApiStudentListResponse, ApiStudentCreatedResponse, ApiStudentOkResponse } from '../docs';
import { ICurrentUser } from '../../../../../shared/types';

@ApiTags('Students')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(
    private readonly createStudent: CreateStudentUseCase,
    private readonly getStudent: GetStudentUseCase,
    private readonly listStudents: ListStudentsUseCase,
    private readonly updateStudent: UpdateStudentUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.COORDINATOR)
  @ApiOperation({
    summary: 'Register new student',
    description: 'Creates a new user with STUDENT role and links to student record. The operation is atomic: creates both or neither.'
  })
  @ApiStudentCreatedResponse()
  @ApiResponse({
    status: 409,
    description: 'Registration number or email already registered'
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found'
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated'
  })
  @ApiResponse({
    status: 403,
    description: 'No permission. Only coordinators can register students.'
  })
  async create(
    @Body() dto: CreateStudentDto,
    @CurrentUser() currentUser: ICurrentUser,
  ): Promise<HttpResponse<StudentResponseDto>> {
    const student = await this.createStudent.execute(dto, currentUser);
    return HttpResponseSerializer.serialize(student);
  }

  @Get()
  @Roles(Role.COORDINATOR)
  @ApiOperation({ summary: 'List students' })
  @ApiStudentListResponse()
  async findAll(
    @Query() query: ListStudentsDto,
    @CurrentUser() currentUser: ICurrentUser,
  ): Promise<ListStudentsResponse> {
    return this.listStudents.execute(currentUser, query);
  }

  @Get(':registration')
  @Roles(Role.COORDINATOR)
  @ApiOperation({ summary: 'Find student by registration number with blockchain defense history' })
  @ApiStudentOkResponse()
  @ApiResponse({
    status: 404,
    description: 'Student not found'
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated'
  })
  async findOne(
    @Param('registration') registration: string,
    @CurrentUser() currentUser: ICurrentUser,
  ): Promise<HttpResponse<StudentResponseDto>> {
    const student = await this.getStudent.execute({
      matricula: registration,
      currentUser,
    });
    return HttpResponseSerializer.serialize(student);
  }

  @Put(':registration')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.COORDINATOR)
  @ApiOperation({
    summary: 'Update student data',
    description: 'Updates user name and/or student course. Only coordinators can update.'
  })
  @ApiStudentOkResponse()
  @ApiResponse({
    status: 404,
    description: 'Student or course not found'
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated'
  })
  @ApiResponse({
    status: 403,
    description: 'No permission'
  })
  async update(@Param('registration') registration: string, @Body() dto: UpdateStudentDto): Promise<HttpResponse<StudentResponseDto>> {
    const student = await this.updateStudent.execute(registration, dto);
    return HttpResponseSerializer.serialize(student);
  }

}
