import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../../../shared/decorators';
import { CreateCoordinatorUseCase, ListCoordinatorsUseCase, ListCoordinatorsResponse } from '../../application/use-cases';
import { CreateCoordinatorDto, ListCoordinatorsDto, CoordinatorResponseDto } from '../dtos';
import { HttpResponse } from '../../../../shared/dtos';
import { HttpResponseSerializer } from '../../../../shared/serializers';
import { ApiCreateCoordinator, ApiListCoordinators } from '../docs';

@ApiTags('Coordinators')
@ApiBearerAuth()
@Controller('coordinators')
export class CoordinatorsController {
  constructor(
    private readonly createCoordinator: CreateCoordinatorUseCase,
    private readonly listCoordinators: ListCoordinatorsUseCase,
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
}
