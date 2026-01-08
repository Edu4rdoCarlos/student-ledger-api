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
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  BadRequestException,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
  CancelDefenseUseCase,
  RescheduleDefenseUseCase,
} from '../../application/use-cases';
import {
  CreateDefenseDto,
  UpdateDefenseDto,
  SubmitDefenseResultDto,
  RescheduleDefenseDto,
} from '../dtos/request';
import { DefenseResponseDto, SubmitDefenseResultResponseDto, ListDefensesResponseDto } from '../dtos/response';
import { DocumentResponseDto } from '../../../documents/presentation/dtos/response';
import { ListDocumentVersionsUseCase } from '../../../documents/application/use-cases';
import { HttpResponse, PaginationDto } from '../../../../shared/dtos';
import {
  ApiDefenseListResponse,
  ApiDefenseCreatedResponse,
  ApiDefenseOkResponse,
  ApiDefenseCancelResponse,
  ApiDefenseRescheduleResponse,
  ApiSubmitResultRequest,
} from '../docs';
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
    private readonly cancelDefenseUseCase: CancelDefenseUseCase,
    private readonly rescheduleDefenseUseCase: RescheduleDefenseUseCase,
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
      title: createDefenseDto.title,
      defenseDate: new Date(createDefenseDto.defenseDate),
      location: createDefenseDto.location,
      advisorId: createDefenseDto.advisorId,
      studentIds: createDefenseDto.studentIds,
      examBoard: createDefenseDto.examBoard,
    });
    return DefenseSerializer.serializeToHttpResponse(defense);
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
    const { items, total } = await this.listDefensesUseCase.execute({
      advisorId,
      result,
      skip: (page - 1) * limit,
      take: limit,
    });

    return DefenseSerializer.serializeListToResponse(items, user, page, limit, total);
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
    return DefenseSerializer.serializeToHttpResponse(defense, user);
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
      location: updateDefenseDto.location,
      examBoard: updateDefenseDto.examBoard,
    });
    return DefenseSerializer.serializeToHttpResponse(defense);
  }

  @Post(':id/result')
  @Roles('ADMIN', 'COORDINATOR')
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @UseInterceptors(FileInterceptor('document'))
  @ApiOperation({ summary: 'Submit defense result with grade and unified document file' })
  @ApiSubmitResultRequest()
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

  @Patch(':id/cancel')
  @Roles('ADMIN', 'COORDINATOR')
  @ApiOperation({ summary: 'Cancel a defense (coordinator only)' })
  @ApiDefenseCancelResponse()
  async cancel(@Param('id') id: string): Promise<HttpResponse<DefenseResponseDto>> {
    const defense = await this.cancelDefenseUseCase.execute(id);
    return DefenseSerializer.serializeToHttpResponse(defense);
  }

  @Patch(':id/reschedule')
  @Roles('ADMIN', 'COORDINATOR')
  @ApiOperation({ summary: 'Reschedule a defense (coordinator only)' })
  @ApiDefenseRescheduleResponse()
  async reschedule(
    @Param('id') id: string,
    @Body() rescheduleDto: RescheduleDefenseDto,
  ): Promise<HttpResponse<DefenseResponseDto>> {
    const defense = await this.rescheduleDefenseUseCase.execute({
      defenseId: id,
      newDate: new Date(rescheduleDto.defenseDate),
    });
    return DefenseSerializer.serializeToHttpResponse(defense);
  }
}
