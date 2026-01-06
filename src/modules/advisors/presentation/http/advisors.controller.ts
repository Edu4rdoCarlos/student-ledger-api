import { Controller, Get, Post, Put, Patch, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Roles, CurrentUser } from '../../../../shared/decorators';
import {
  CreateAdvisorUseCase,
  GetAdvisorUseCase,
  ListAdvisorsUseCase,
  UpdateAdvisorUseCase,
  ListAdvisorsResponse,
  ChangePasswordUseCase,
} from '../../application/use-cases';
import { CreateAdvisorDto, UpdateAdvisorDto, ListAdvisorsDto, AdvisorResponseDto } from '../dtos';
import { ChangePasswordDto, HttpResponse } from '../../../../shared/dtos';
import { HttpResponseSerializer } from '../../../../shared/serializers';
import { ApiAdvisorListResponse, ApiAdvisorCreatedResponse, ApiAdvisorOkResponse } from '../docs';

@ApiTags('Advisors')
@ApiBearerAuth()
@Controller('advisors')
export class AdvisorsController {
  constructor(
    private readonly createAdvisor: CreateAdvisorUseCase,
    private readonly getAdvisor: GetAdvisorUseCase,
    private readonly listAdvisors: ListAdvisorsUseCase,
    private readonly updateAdvisor: UpdateAdvisorUseCase,
    private readonly changePassword: ChangePasswordUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'COORDINATOR')
  @ApiOperation({
    summary: 'Register new advisor',
    description: 'Creates a new user with ADVISOR role and links to advisor record. The operation is atomic: creates both or neither.'
  })
  @ApiAdvisorCreatedResponse()
  @ApiResponse({
    status: 409,
    description: 'Email already registered'
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated'
  })
  @ApiResponse({
    status: 403,
    description: 'No permission. Only coordinators and admins can register advisors.'
  })
  async create(@Body() dto: CreateAdvisorDto): Promise<HttpResponse<AdvisorResponseDto>> {
    const advisor = await this.createAdvisor.execute(dto);
    return HttpResponseSerializer.serialize(advisor);
  }

  @Get()
  @Roles('ADMIN', 'COORDINATOR')
  @ApiOperation({ summary: 'List advisors' })
  @ApiAdvisorListResponse()
  @ApiResponse({
    status: 401,
    description: 'Not authenticated'
  })
  async findAll(@Query() query: ListAdvisorsDto): Promise<ListAdvisorsResponse> {
    return this.listAdvisors.execute(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'COORDINATOR')
  @ApiOperation({ summary: 'Find advisor by ID' })
  @ApiAdvisorOkResponse()
  @ApiResponse({
    status: 404,
    description: 'Advisor not found'
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated'
  })
  async findOne(@Param('id') id: string): Promise<HttpResponse<AdvisorResponseDto>> {
    const advisor = await this.getAdvisor.execute(id);
    return HttpResponseSerializer.serialize(advisor);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'COORDINATOR')
  @ApiOperation({
    summary: 'Update advisor data',
    description: 'Updates name, department and/or advisor course. Only administrators and coordinators can update.'
  })
  @ApiAdvisorOkResponse()
  @ApiResponse({
    status: 404,
    description: 'Advisor not found'
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated'
  })
  @ApiResponse({
    status: 403,
    description: 'No permission'
  })
  async update(@Param('id') id: string, @Body() dto: UpdateAdvisorDto): Promise<HttpResponse<AdvisorResponseDto>> {
    const advisor = await this.updateAdvisor.execute(id, dto);
    return HttpResponseSerializer.serialize(advisor);
  }

  @Patch('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADVISOR')
  @ApiOperation({
    summary: 'Change advisor password',
    description: 'Allows advisor to change their own password.'
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
    description: 'Advisor not found'
  })
  async changePasswordHandler(@CurrentUser() currentUser: { id: string }, @Body() dto: ChangePasswordDto) {
    await this.changePassword.execute(currentUser.id, dto);
  }
}
