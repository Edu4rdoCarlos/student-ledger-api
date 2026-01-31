import { Controller, Get, Post, Put, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Roles, CurrentUser } from '../../../../../shared/decorators';
import { ICurrentUser } from '../../../../../shared';
import {
  CreateAdvisorUseCase,
  GetAdvisorUseCase,
  ListAdvisorsUseCase,
  UpdateAdvisorUseCase,
} from '../../application/use-cases';
import { CreateAdvisorDto, UpdateAdvisorDto, ListAdvisorsDto, AdvisorResponseDto } from '../dtos';
import { HttpResponse } from '../../../../../shared/dtos';
import { HttpResponseSerializer } from '../../../../../shared/serializers';
import { PaginationMetadata } from '../../../../../shared/dtos';
import { ApiAdvisorListResponse, ApiAdvisorCreatedResponse, ApiAdvisorOkResponse } from '../docs';

interface AdvisorListResponse {
  data: AdvisorResponseDto[];
  metadata: PaginationMetadata;
}

@ApiTags('Advisors')
@ApiBearerAuth()
@Controller('advisors')
export class AdvisorsController {
  constructor(
    private readonly createAdvisor: CreateAdvisorUseCase,
    private readonly getAdvisor: GetAdvisorUseCase,
    private readonly listAdvisors: ListAdvisorsUseCase,
    private readonly updateAdvisor: UpdateAdvisorUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('COORDINATOR')
  @ApiOperation({
    summary: 'Register new advisor',
    description: 'Creates a new user with ADVISOR role and links to advisor record. The operation is atomic: creates both or neither.'
  })
  @ApiAdvisorCreatedResponse()
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'No permission. Only coordinators can register advisors.' })
  async create(
    @Body() dto: CreateAdvisorDto,
    @CurrentUser() currentUser: ICurrentUser,
  ): Promise<HttpResponse<AdvisorResponseDto>> {
    const advisor = await this.createAdvisor.execute(dto, currentUser);
    return HttpResponseSerializer.serialize(AdvisorResponseDto.fromEntity(advisor));
  }

  @Get()
  @Roles('COORDINATOR')
  @ApiOperation({ summary: 'List advisors' })
  @ApiAdvisorListResponse()
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async findAll(
    @Query() query: ListAdvisorsDto,
    @CurrentUser() currentUser: ICurrentUser,
  ): Promise<AdvisorListResponse> {
    const result = await this.listAdvisors.execute(query, currentUser);
    return {
      data: result.data.map(advisor => AdvisorResponseDto.fromEntity(advisor, advisor.activeAdvisorshipsCount)),
      metadata: result.metadata,
    };
  }

  @Get(':id')
  @Roles('COORDINATOR')
  @ApiOperation({ summary: 'Find advisor by ID' })
  @ApiAdvisorOkResponse()
  @ApiResponse({ status: 404, description: 'Advisor not found' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async findOne(@Param('id') id: string): Promise<HttpResponse<AdvisorResponseDto>> {
    const advisor = await this.getAdvisor.execute(id);
    return HttpResponseSerializer.serialize(AdvisorResponseDto.fromEntity(advisor, advisor.activeAdvisorshipsCount));
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('COORDINATOR')
  @ApiOperation({
    summary: 'Update advisor data',
    description: 'Updates name, department and/or advisor course. Only coordinators can update.'
  })
  @ApiAdvisorOkResponse()
  @ApiResponse({ status: 404, description: 'Advisor not found' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'No permission' })
  async update(@Param('id') id: string, @Body() dto: UpdateAdvisorDto): Promise<HttpResponse<AdvisorResponseDto>> {
    const advisor = await this.updateAdvisor.execute(id, dto);
    return HttpResponseSerializer.serialize(AdvisorResponseDto.fromEntity(advisor));
  }
}
