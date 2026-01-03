import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../../../shared/guards';
import { Roles } from '../../../../shared/decorators';
import {
  CreateDefenseUseCase,
  GetDefenseUseCase,
  ListDefensesUseCase,
  UpdateDefenseUseCase,
  SetGradeUseCase,
} from '../../application/use-cases';
import {
  CreateDefenseDto,
  UpdateDefenseDto,
  SetGradeDto,
} from '../dtos/request';
import { DefenseResponseDto } from '../dtos/response';

@ApiTags('Defesas')
@ApiBearerAuth()
@Controller('defesas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DefenseController {
  constructor(
    private readonly createDefenseUseCase: CreateDefenseUseCase,
    private readonly getDefenseUseCase: GetDefenseUseCase,
    private readonly listDefensesUseCase: ListDefensesUseCase,
    private readonly updateDefenseUseCase: UpdateDefenseUseCase,
    private readonly setGradeUseCase: SetGradeUseCase,
  ) {}

  @Post()
  @Roles('ADMIN', 'COORDINATOR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new defense' })
  async create(
    @Body() createDefenseDto: CreateDefenseDto,
  ): Promise<DefenseResponseDto> {
    const defense = await this.createDefenseUseCase.execute({
      ...createDefenseDto,
      dataDefesa: new Date(createDefenseDto.dataDefesa),
    });
    return DefenseResponseDto.fromEntity(defense);
  }

  @Get()
  @Roles('ADMIN', 'COORDINATOR', 'ADVISOR')
  @ApiOperation({ summary: 'List all defenses' })
  async findAll(
    @Query('advisorId') advisorId?: string,
    @Query('resultado') resultado?: 'PENDENTE' | 'APROVADO' | 'REPROVADO',
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<DefenseResponseDto[]> {
    const options = {
      advisorId,
      resultado,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    };

    const { items } = await this.listDefensesUseCase.execute(options);
    return items.map(DefenseResponseDto.fromEntity);
  }

  @Get(':id')
  @Roles('ADMIN', 'COORDINATOR', 'ADVISOR')
  @ApiOperation({ summary: 'Get defense by ID' })
  async findOne(@Param('id') id: string): Promise<DefenseResponseDto> {
    const defense = await this.getDefenseUseCase.execute(id);
    return DefenseResponseDto.fromEntity(defense);
  }

  @Put(':id')
  @Roles('ADMIN', 'COORDINATOR')
  @ApiOperation({ summary: 'Update defense' })
  async update(
    @Param('id') id: string,
    @Body() updateDefenseDto: UpdateDefenseDto,
  ): Promise<DefenseResponseDto> {
    const defense = await this.updateDefenseUseCase.execute({
      id,
      titulo: updateDefenseDto.titulo,
      dataDefesa: updateDefenseDto.dataDefesa
        ? new Date(updateDefenseDto.dataDefesa)
        : undefined,
    });
    return DefenseResponseDto.fromEntity(defense);
  }

  @Patch(':id/grade')
  @Roles('ADMIN', 'COORDINATOR', 'ADVISOR')
  @ApiOperation({ summary: 'Set defense grade' })
  async setGrade(
    @Param('id') id: string,
    @Body() setGradeDto: SetGradeDto,
  ): Promise<DefenseResponseDto> {
    const defense = await this.setGradeUseCase.execute({
      id,
      notaFinal: setGradeDto.notaFinal,
    });
    return DefenseResponseDto.fromEntity(defense);
  }
}
