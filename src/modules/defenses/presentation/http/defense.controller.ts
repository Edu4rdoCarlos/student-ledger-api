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
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard, RolesGuard } from '../../../../shared/guards';
import { Roles, CurrentUser } from '../../../../shared/decorators';
import { PdfContentValidator } from '../../../../shared/validators';
import { sanitizeFilename } from '../../../../shared/utils';
import { ICurrentUser } from '../../../../shared/types';
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
  CancelDefenseDto,
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
  ApiDocumentHistoryResponse,
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
  @Roles('COORDINATOR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new defense' })
  @ApiDefenseCreatedResponse()
  async create(
    @Body() createDefenseDto: CreateDefenseDto,
    @CurrentUser() currentUser: ICurrentUser,
  ): Promise<HttpResponse<DefenseResponseDto>> {
    const defense = await this.createDefenseUseCase.execute({
      title: createDefenseDto.title,
      defenseDate: new Date(createDefenseDto.defenseDate),
      location: createDefenseDto.location,
      advisorId: createDefenseDto.advisorId,
      studentIds: createDefenseDto.studentIds,
      examBoard: createDefenseDto.examBoard,
      currentUser,
    });
    return DefenseSerializer.serializeToHttpResponse(defense);
  }

  @Get()
  @Roles('COORDINATOR', 'ADVISOR', 'STUDENT')
  @ApiOperation({ summary: 'List all defenses with basic information' })
  @ApiDefenseListResponse()
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Ordenação por data de criação',
    schema: { default: 'desc' },
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Busca por título, local, nome do aluno ou orientador',
  })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('order') order?: 'asc' | 'desc',
    @Query('search') search?: string,
  ): Promise<ListDefensesResponseDto> {
    const { page = 1, perPage = 10 } = pagination;
    const { items, total } = await this.listDefensesUseCase.execute({
      skip: (page - 1) * perPage,
      take: perPage,
      order: order || 'desc',
      search,
    });

    return DefenseSerializer.serializeListToResponse(items, page, perPage, total);
  }

  @Get(':id')
  @Roles('COORDINATOR', 'ADVISOR', 'STUDENT')
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
  @Roles('COORDINATOR')
  @ApiOperation({ summary: 'Update defense' })
  @ApiDefenseOkResponse()
  async update(
    @Param('id') id: string,
    @Body() updateDefenseDto: UpdateDefenseDto,
    @CurrentUser() currentUser: ICurrentUser,
  ): Promise<HttpResponse<DefenseResponseDto>> {
    const defense = await this.updateDefenseUseCase.execute({
      id,
      title: updateDefenseDto.title,
      defenseDate: updateDefenseDto.defenseDate
        ? new Date(updateDefenseDto.defenseDate)
        : undefined,
      location: updateDefenseDto.location,
      examBoard: updateDefenseDto.examBoard,
      currentUser,
    });
    return DefenseSerializer.serializeToHttpResponse(defense);
  }

  @Post(':id/result')
  @Roles('COORDINATOR')
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'minutesFile', maxCount: 1 },
    { name: 'evaluationFile', maxCount: 1 },
  ]))
  @ApiOperation({ summary: 'Submit defense result with grade and two document files (Minutes and Evaluation)' })
  @ApiSubmitResultRequest()
  async submitResult(
    @Param('id') id: string,
    @Body('finalGrade') finalGrade: string,
    @CurrentUser() currentUser: ICurrentUser,
    @UploadedFiles() files: { minutesFile?: Express.Multer.File[], evaluationFile?: Express.Multer.File[] },
  ): Promise<SubmitDefenseResultResponseDto> {
    const grade = parseFloat(finalGrade);

    if (isNaN(grade) || grade < 0 || grade > 10) {
      throw new BadRequestException('Nota final inválida. Deve ser um número entre 0 e 10.');
    }

    const minutesFile = files.minutesFile?.[0];
    const evaluationFile = files.evaluationFile?.[0];

    if (!minutesFile || !evaluationFile) {
      throw new BadRequestException('Ambos os arquivos são obrigatórios: Ata (minutesFile) e Avaliação de Desempenho (evaluationFile).');
    }

    // Validate file types
    const pdfValidator = new PdfContentValidator({});
    for (const file of [minutesFile, evaluationFile]) {
      if (file.size > 10 * 1024 * 1024) {
        throw new BadRequestException(`Arquivo ${file.originalname} excede o tamanho máximo de 10MB.`);
      }
      const isValid = await pdfValidator.isValid(file);
      if (!isValid) {
        throw new BadRequestException(`Arquivo ${file.originalname} não é um PDF válido.`);
      }
    }

    const safeMinutesFilename = sanitizeFilename(minutesFile.originalname);
    const safeEvaluationFilename = sanitizeFilename(evaluationFile.originalname);

    const { defense, document } = await this.submitDefenseResultUseCase.execute({
      id,
      finalGrade: grade,
      minutesFile: minutesFile.buffer,
      minutesFilename: safeMinutesFilename,
      evaluationFile: evaluationFile.buffer,
      evaluationFilename: safeEvaluationFilename,
      currentUser,
    });

    return {
      defense: DefenseResponseDto.fromEntity(defense),
      document: DocumentResponseDto.fromEntity(document),
    };
  }

  @Get(':id/documents/history')
  @Roles('COORDINATOR', 'ADVISOR', 'STUDENT')
  @ApiOperation({
    summary: 'List all document versions for a defense',
    description: 'Returns all versions of the defense document, ordered by version number (newest first)'
  })
  @ApiDocumentHistoryResponse()
  async getDocumentHistory(@Param('id') id: string) {
    const versions = await this.listDocumentVersionsUseCase.execute(id);

    return {
      data: versions.map(doc => DocumentResponseDto.fromEntity(doc)),
      total: versions.length,
    };
  }

  @Patch(':id/cancel')
  @Roles('COORDINATOR')
  @ApiOperation({ summary: 'Cancel a defense (coordinator only)' })
  @ApiDefenseCancelResponse()
  async cancel(
    @Param('id') id: string,
    @Body() cancelDto: CancelDefenseDto,
  ): Promise<HttpResponse<DefenseResponseDto>> {
    const defense = await this.cancelDefenseUseCase.execute({
      defenseId: id,
      cancellationReason: cancelDto.cancellationReason,
    });
    return DefenseSerializer.serializeToHttpResponse(defense);
  }

  @Patch(':id/reschedule')
  @Roles('COORDINATOR')
  @ApiOperation({ summary: 'Reschedule a defense (coordinator only)' })
  @ApiDefenseRescheduleResponse()
  async reschedule(
    @Param('id') id: string,
    @Body() rescheduleDto: RescheduleDefenseDto,
  ): Promise<HttpResponse<DefenseResponseDto>> {
    const defense = await this.rescheduleDefenseUseCase.execute({
      defenseId: id,
      newDate: new Date(rescheduleDto.defenseDate),
      rescheduleReason: rescheduleDto.rescheduleReason,
    });
    return DefenseSerializer.serializeToHttpResponse(defense);
  }
}
