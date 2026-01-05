import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../../../shared/guards';
import { Roles } from '../../../../shared/decorators';
import {
  CreateDefenseUseCase,
  GetDefenseUseCase,
  ListDefensesUseCase,
  UpdateDefenseUseCase,
  SubmitDefenseResultUseCase,
} from '../../application/use-cases';
import {
  CreateDefenseDto,
  UpdateDefenseDto,
  SubmitDefenseResultDto,
} from '../dtos/request';
import { DefenseResponseDto, SubmitDefenseResultResponseDto, ListDefensesResponseDto } from '../dtos/response';
import { DocumentResponseDto } from '../../../documents/presentation/dtos/response';
import { PaginationMetadata, HttpResponse } from '../../../../shared/dtos';
import { HttpResponseSerializer } from '../../../../shared/serializers';
import { ApiDefenseListResponse, ApiDefenseCreatedResponse, ApiDefenseOkResponse } from '../docs';

@ApiTags('Defenses')
@ApiBearerAuth()
@Controller('defenses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DefenseController {
  constructor(
    private readonly createDefenseUseCase: CreateDefenseUseCase,
    private readonly getDefenseUseCase: GetDefenseUseCase,
    private readonly listDefensesUseCase: ListDefensesUseCase,
    private readonly updateDefenseUseCase: UpdateDefenseUseCase,
    private readonly submitDefenseResultUseCase: SubmitDefenseResultUseCase,
  ) {}

  @Post()
  @Roles('ADMIN', 'COORDINATOR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new defense' })
  @ApiDefenseCreatedResponse()
  async create(
    @Body() createDefenseDto: CreateDefenseDto,
  ): Promise<HttpResponse<DefenseResponseDto>> {
    const defense = await this.createDefenseUseCase.execute({
      ...createDefenseDto,
      defenseDate: new Date(createDefenseDto.defenseDate),
    });
    return HttpResponseSerializer.serialize(DefenseResponseDto.fromEntity(defense));
  }

  @Get()
  @Roles('ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT')
  @ApiOperation({ summary: 'List all defenses' })
  @ApiDefenseListResponse()
  async findAll(
    @Query('advisorId') advisorId?: string,
    @Query('result') result?: 'PENDING' | 'APPROVED' | 'FAILED',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ListDefensesResponseDto> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const skip = (pageNum - 1) * limitNum;

    const options = {
      advisorId,
      result,
      skip,
      take: limitNum,
    };

    const { items, total } = await this.listDefensesUseCase.execute(options);

    return {
      data: items.map(DefenseResponseDto.fromEntity),
      metadata: new PaginationMetadata({ page: pageNum, perPage: limitNum, total }),
    };
  }

  @Get(':id')
  @Roles('ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT')
  @ApiOperation({ summary: 'Get defense by ID' })
  @ApiDefenseOkResponse()
  async findOne(@Param('id') id: string): Promise<HttpResponse<DefenseResponseDto>> {
    const defense = await this.getDefenseUseCase.execute(id);
    return HttpResponseSerializer.serialize(DefenseResponseDto.fromEntity(defense));
  }

  @Put(':id')
  @Roles('ADMIN', 'COORDINATOR')
  @ApiOperation({ summary: 'Update defense' })
  @ApiDefenseOkResponse()
  async update(
    @Param('id') id: string,
    @Body() updateDefenseDto: UpdateDefenseDto,
  ): Promise<HttpResponse<DefenseResponseDto>> {
    const defense = await this.updateDefenseUseCase.execute({
      id,
      title: updateDefenseDto.title,
      defenseDate: updateDefenseDto.defenseDate
        ? new Date(updateDefenseDto.defenseDate)
        : undefined,
    });
    return HttpResponseSerializer.serialize(DefenseResponseDto.fromEntity(defense));
  }

  @Post(':id/result')
  @Roles('ADMIN', 'COORDINATOR')
  @UseInterceptors(FileInterceptor('document'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Submit defense result with grade and unified document file' })
  @ApiBody({
    description: 'Defense result with grade and document file',
    schema: {
      type: 'object',
      required: ['finalGrade', 'document'],
      properties: {
        finalGrade: {
          type: 'number',
          minimum: 0,
          maximum: 10,
          example: 8.5,
          description: 'Final grade (0 to 10). Grades >= 7 pass, < 7 fail'
        },
        document: {
          type: 'string',
          format: 'binary',
          description: 'Unified defense document file (PDF containing all pages)'
        }
      }
    }
  })
  async submitResult(
    @Param('id') id: string,
    @Body('finalGrade') finalGrade: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: 'pdf' })
        .addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 }) // 10MB
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY })
    )
    file: Express.Multer.File,
  ): Promise<SubmitDefenseResultResponseDto> {
    const { defense, document } = await this.submitDefenseResultUseCase.execute({
      id,
      finalGrade: parseFloat(finalGrade),
      documentFile: file.buffer,
      documentFilename: file.originalname,
    });

    return {
      defense: DefenseResponseDto.fromEntity(defense),
      document: DocumentResponseDto.fromEntity(document),
    };
  }
}
