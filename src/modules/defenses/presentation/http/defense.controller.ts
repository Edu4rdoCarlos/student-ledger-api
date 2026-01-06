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
  BadRequestException,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard, RolesGuard } from '../../../../shared/guards';
import { Roles, CurrentUser } from '../../../../shared/decorators';
import { PdfContentValidator } from '../../../../shared/validators';
import { sanitizeFilename } from '../../../../shared/utils';
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
import { ListDocumentVersionsUseCase } from '../../../documents/application/use-cases';
import { PaginationMetadata, HttpResponse, PaginationDto } from '../../../../shared/dtos';
import { HttpResponseSerializer } from '../../../../shared/serializers';
import { ApiDefenseListResponse, ApiDefenseCreatedResponse, ApiDefenseOkResponse } from '../docs';
import { DefenseSerializer } from '../serializers/defense.serializer';

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
    private readonly listDocumentVersionsUseCase: ListDocumentVersionsUseCase,
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
    @CurrentUser() user: { id: string; role: 'ADMIN' | 'COORDINATOR' | 'ADVISOR' | 'STUDENT' },
    @Query() pagination: PaginationDto,
    @Query('advisorId') advisorId?: string,
    @Query('result') result?: 'PENDING' | 'APPROVED' | 'FAILED',
  ): Promise<ListDefensesResponseDto> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const options = {
      advisorId,
      result,
      skip,
      take: limit,
    };

    const { items, total } = await this.listDefensesUseCase.execute(options);

    return {
      data: DefenseSerializer.serializeList(items, user),
      metadata: new PaginationMetadata({ page, perPage: limit, total }),
    };
  }

  @Get(':id')
  @Roles('ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT')
  @ApiOperation({ summary: 'Get defense by ID' })
  @ApiDefenseOkResponse()
  async findOne(
    @CurrentUser() user: { id: string; role: 'ADMIN' | 'COORDINATOR' | 'ADVISOR' | 'STUDENT' },
    @Param('id') id: string,
  ): Promise<HttpResponse<DefenseResponseDto>> {
    const defense = await this.getDefenseUseCase.execute(id);
    return HttpResponseSerializer.serialize(DefenseSerializer.serialize(defense, user));
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
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
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
        .addValidator(new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }))
        .addValidator(new PdfContentValidator({}))
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY })
    )
    file: Express.Multer.File,
  ): Promise<SubmitDefenseResultResponseDto> {
    const grade = parseFloat(finalGrade);

    if (isNaN(grade) || grade < 0 || grade > 10) {
      throw new BadRequestException('Nota final inválida. Deve ser um número entre 0 e 10.');
    }

    const safeFilename = sanitizeFilename(file.originalname);

    const { defense, document } = await this.submitDefenseResultUseCase.execute({
      id,
      finalGrade: grade,
      documentFile: file.buffer,
      documentFilename: safeFilename,
    });

    return {
      defense: DefenseResponseDto.fromEntity(defense),
      document: DocumentResponseDto.fromEntity(document),
    };
  }

  @Get(':id/documents/history')
  @Roles('ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT')
  @ApiOperation({
    summary: 'List all document versions for a defense',
    description: 'Returns all versions of the defense document, ordered by version number (newest first)'
  })
  async getDocumentHistory(@Param('id') id: string) {
    const versions = await this.listDocumentVersionsUseCase.execute(id);

    return {
      data: versions.map(doc => DocumentResponseDto.fromEntity(doc)),
      total: versions.length,
    };
  }
}
