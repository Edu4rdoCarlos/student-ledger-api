import { Controller, Post, Get, Put, Body, Query, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../../../../shared/decorators';
import { CreateCoordinatorUseCase, ListCoordinatorsUseCase, UpdateCoordinatorUseCase, ListCoordinatorsResponse } from '../../application/use-cases';
import { CreateCoordinatorDto, ListCoordinatorsDto, UpdateCoordinatorDto, CoordinatorResponseDto } from '../dtos';
import { HttpResponse } from '../../../../../shared/dtos';
import { HttpResponseSerializer } from '../../../../../shared/serializers';
import { ApiCreateCoordinator, ApiListCoordinators, ApiUpdateCoordinator } from '../docs';

@ApiTags('Coordinators')
@ApiBearerAuth()
@Controller('coordinators')
export class CoordinatorsController {
  constructor(
    private readonly createCoordinator: CreateCoordinatorUseCase,
    private readonly listCoordinators: ListCoordinatorsUseCase,
    private readonly updateCoordinator: UpdateCoordinatorUseCase,
  ) {}

  @Get()
  @Roles('ADMIN')
  @ApiListCoordinators()
  async findAll(@Query() query: ListCoordinatorsDto): Promise<ListCoordinatorsResponse> {
    return this.listCoordinators.execute(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN')
  @ApiCreateCoordinator()
  async create(@Body() dto: CreateCoordinatorDto): Promise<HttpResponse<CoordinatorResponseDto>> {
    const coordinator = await this.createCoordinator.execute(dto);
    return HttpResponseSerializer.serialize(coordinator);
  }

  @Put(':userId')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  @ApiUpdateCoordinator()
  async update(
    @Param('userId') userId: string,
    @Body() dto: UpdateCoordinatorDto,
  ): Promise<HttpResponse<CoordinatorResponseDto>> {
    const coordinator = await this.updateCoordinator.execute(userId, dto);
    return HttpResponseSerializer.serialize(coordinator);
  }
}
