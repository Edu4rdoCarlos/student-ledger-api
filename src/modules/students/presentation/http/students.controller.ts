import { Controller, Get, Post, Put, Patch, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Roles, CurrentUser } from '../../../../shared/decorators';
import {
  CreateStudentUseCase,
  GetStudentUseCase,
  ListStudentsUseCase,
  UpdateStudentUseCase,
  ListStudentsResponse,
  ChangePasswordUseCase,
} from '../../application/use-cases';
import { CreateStudentDto, UpdateStudentDto, ListStudentsDto, StudentResponseDto } from '../dtos';
import { ChangePasswordDto, HttpResponse } from '../../../../shared/dtos';
import { HttpResponseSerializer } from '../../../../shared/serializers';
import { ApiStudentListResponse, ApiStudentCreatedResponse, ApiStudentOkResponse } from '../docs';
import { ICurrentUser } from '../../../../shared/types';

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
    description: 'No permission. Only coordinators and admins can register students.'
  })
  async create(
    @Body() dto: CreateStudentDto,
    @CurrentUser() currentUser: ICurrentUser,
  ): Promise<HttpResponse<StudentResponseDto>> {
    const student = await this.createStudent.execute(dto, currentUser);
    return HttpResponseSerializer.serialize(student);
  }

  @Get()
  @Roles('ADMIN', 'COORDINATOR')
  @ApiOperation({ summary: 'List students' })
  @ApiStudentListResponse()
  async findAll(
    @Query() query: ListStudentsDto,
    @CurrentUser() currentUser: any,
  ): Promise<ListStudentsResponse> {
    return this.listStudents.execute(query, currentUser);
  }

  @Get(':registration')
  @Roles('ADMIN', 'COORDINATOR')
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
    @CurrentUser() currentUser: { id: string; email: string; role: 'ADMIN' | 'COORDINATOR' | 'ADVISOR' | 'STUDENT' },
  ): Promise<HttpResponse<StudentResponseDto>> {
    const student = await this.getStudent.execute({
      matricula: registration,
      currentUser,
    });
    return HttpResponseSerializer.serialize(student);
  }

  @Put(':registration')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'COORDINATOR')
  @ApiOperation({
    summary: 'Update student data',
    description: 'Updates user name and/or student course. Only administrators and coordinators can update.'
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

  @Patch('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('STUDENT')
  @ApiOperation({
    summary: 'Change student password',
    description: 'Allows student to change their own password.'
  })
  @ApiResponse({
    status: 204,
    description: 'Password changed successfully.'
  })
  @ApiResponse({
    status: 401,
    description: 'Current password incorrect or not authenticated'
  })
  @ApiResponse({
    status: 403,
    description: 'No permission'
  })
  @ApiResponse({
    status: 404,
    description: 'Student not found'
  })
  async changePasswordHandler(@CurrentUser() currentUser: { id: string }, @Body() dto: ChangePasswordDto) {
    await this.changePassword.execute(currentUser.id, dto);
  }
}
