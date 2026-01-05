import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../../../shared/guards';
import { CurrentUser } from '../../../../shared/decorators';
import {
  ApproveDocumentUseCase,
  RejectDocumentUseCase,
  ListPendingApprovalsUseCase,
} from '../../application/use-cases';
import { RejectDto } from '../dtos/request';
import { ApprovalResponseDto } from '../dtos/response';
import { ApprovalSerializer } from '../serializers';

@ApiTags('Approvals')
@ApiBearerAuth()
@Controller('approvals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApprovalController {
  constructor(
    private readonly approveDocumentUseCase: ApproveDocumentUseCase,
    private readonly rejectDocumentUseCase: RejectDocumentUseCase,
    private readonly listPendingApprovalsUseCase: ListPendingApprovalsUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar aprovações pendentes',
    description: 'Lista aprovações pendentes. COORDINATOR/ADMIN veem todas, outros veem apenas suas aprovações.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de aprovações pendentes',
    type: [ApprovalResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Não autenticado',
  })
  async listPending(@CurrentUser() user: any): Promise<ApprovalResponseDto[]> {
    const { approvals } = await this.listPendingApprovalsUseCase.execute({
      userId: user.id,
      userRole: user.role,
    });

    return approvals.map(ApprovalSerializer.toDto);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aprovar documento',
    description: 'Aprova um documento. Requer autenticação JWT.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Documento aprovado com sucesso',
    type: ApprovalResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Aprovação já processada',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Aprovação não encontrada',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Não autenticado',
  })
  async approve(
    @Param('id') approvalId: string,
    @CurrentUser() user: any,
  ): Promise<ApprovalResponseDto> {
    const { approval } = await this.approveDocumentUseCase.execute({
      approvalId,
      userId: user.id,
    });

    return ApprovalSerializer.toDto(approval);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rejeitar documento',
    description: 'Rejeita um documento com justificativa. Requer autenticação JWT.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Documento rejeitado com sucesso',
    type: ApprovalResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Aprovação já processada ou justificativa ausente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Aprovação não encontrada',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Não autenticado',
  })
  async reject(
    @Param('id') approvalId: string,
    @Body() dto: RejectDto,
    @CurrentUser() user: any,
  ): Promise<ApprovalResponseDto> {
    const { approval } = await this.rejectDocumentUseCase.execute({
      approvalId,
      userId: user.id,
      justification: dto.justification,
    });

    return ApprovalSerializer.toDto(approval);
  }
}
