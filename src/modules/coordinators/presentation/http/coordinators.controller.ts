import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../../../shared/decorators';
import { CreateCoordinatorUseCase } from '../../application/use-cases';
import { CreateCoordinatorDto, CoordinatorResponseDto } from '../dtos';
import { HttpResponse } from '../../../../shared/dtos';
import { HttpResponseSerializer } from '../../../../shared/serializers';
import { ApiCreateCoordinator } from '../docs';

@ApiTags('Coordinators')
@ApiBearerAuth()
@Controller('coordinators')
export class CoordinatorsController {
  constructor(
    private readonly createCoordinator: CreateCoordinatorUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN')
  @ApiCreateCoordinator()
  async create(@Body() dto: CreateCoordinatorDto): Promise<HttpResponse<CoordinatorResponseDto>> {
    const coordinator = await this.createCoordinator.execute(dto);
    return HttpResponseSerializer.serialize(coordinator);
  }
}
