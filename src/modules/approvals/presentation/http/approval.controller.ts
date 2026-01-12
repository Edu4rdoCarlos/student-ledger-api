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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
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
import { ListPendingApprovalsDocs, ApproveDocumentDocs, RejectDocumentDocs } from '../docs';

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
  @ListPendingApprovalsDocs()
  async listPending(@CurrentUser() user: any) {
    const { approvals } = await this.listPendingApprovalsUseCase.execute({
      userId: user.id,
      userRole: user.role,
    });

    return ApprovalSerializer.toHttpResponsePendingList(approvals);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApproveDocumentDocs()
  async approve(
    @Param('id') approvalId: string,
    @CurrentUser() user: any,
  ) {
    const { approval } = await this.approveDocumentUseCase.execute({
      approvalId,
      userId: user.id,
    });

    return ApprovalSerializer.toHttpResponse(approval);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @RejectDocumentDocs()
  async reject(
    @Param('id') approvalId: string,
    @Body() dto: RejectDto,
    @CurrentUser() user: any,
  ) {
    const { approval } = await this.rejectDocumentUseCase.execute({
      approvalId,
      userId: user.id,
      justification: dto.justification,
    });

    return ApprovalSerializer.toHttpResponse(approval);
  }}
