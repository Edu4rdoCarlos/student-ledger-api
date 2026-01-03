import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles, Public } from '../../../../shared/decorators';
import { DocumentFilters } from '../../application/ports';
import {
  CreateDocumentUseCase,
  GetDocumentUseCase,
  ListDocumentsUseCase,
  ValidateDocumentUseCase,
} from '../../application/use-cases';
import { CreateDocumentDto } from '../dtos';

@ApiTags('Documentos')
@ApiBearerAuth()
@Controller('documentos')
export class DocumentsController {
  constructor(
    private readonly createDocument: CreateDocumentUseCase,
    private readonly getDocument: GetDocumentUseCase,
    private readonly listDocuments: ListDocumentsUseCase,
    private readonly validateDocument: ValidateDocumentUseCase,
  ) {}

  @Post()
  @Roles('ADMIN', 'COORDINATOR')
  @ApiOperation({ summary: 'Cadastrar novo documento' })
  create(@Body() dto: CreateDocumentDto) {
    return this.createDocument.execute(dto);
  }

  @Get()
  @Roles('ADMIN', 'COORDINATOR', 'ADVISOR')
  @ApiOperation({ summary: 'Listar documentos' })
  findAll(@Query() filters: DocumentFilters) {
    return this.listDocuments.execute(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar documento por ID' })
  findOne(@Param('id') id: string) {
    return this.getDocument.execute(id);
  }

  @Get('validar/:hash')
  @Public()
  @ApiOperation({ summary: 'Validar autenticidade do documento via hash (público)' })
  validate(@Param('hash') hash: string) {
    return this.validateDocument.execute(hash);
  }
}
