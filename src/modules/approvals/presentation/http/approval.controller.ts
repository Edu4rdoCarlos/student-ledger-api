import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
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
  OverrideRejectionUseCase,
  ListPendingApprovalsUseCase,
  NotifyApproverUseCase,
} from '../../application/use-cases';
import { RejectDto, OverrideRejectionDto, ListApprovalsQueryDto } from '../dtos/request';
import { ApprovalSerializer } from '../serializers';
import { ListPendingApprovalsDocs, ApproveDocumentDocs, RejectDocumentDocs, OverrideRejectionDocs, NotifyApproverDocs } from '../docs';

@ApiTags('Approvals')
@ApiBearerAuth()
@Controller('approvals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApprovalController {
  constructor(
    private readonly approveDocumentUseCase: ApproveDocumentUseCase,
    private readonly rejectDocumentUseCase: RejectDocumentUseCase,
    private readonly overrideRejectionUseCase: OverrideRejectionUseCase,
    private readonly listPendingApprovalsUseCase: ListPendingApprovalsUseCase,
    private readonly notifyApproverUseCase: NotifyApproverUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ListPendingApprovalsDocs()
  async listPending(
    @CurrentUser() user: any,
    @Query() query: ListApprovalsQueryDto,
  ) {
    const { approvals } = await this.listPendingApprovalsUseCase.execute({
      userId: user.id,
      userRole: user.role,
      status: query.status,
    });

    return ApprovalSerializer.toHttpResponseGroupedList(approvals);
  }

  @Post(':documentId/approve')
  @HttpCode(HttpStatus.OK)
  @ApproveDocumentDocs()
  async approve(
    @Param('documentId') documentId: string,
    @CurrentUser() user: any,
  ) {
    const { approval } = await this.approveDocumentUseCase.execute({
      approvalId: documentId,
      userId: user.id,
    });

    return ApprovalSerializer.toHttpResponse(approval);
  }

  @Post(':documentId/reject')
  @HttpCode(HttpStatus.OK)
  @RejectDocumentDocs()
  async reject(
    @Param('documentId') documentId: string,
    @Body() dto: RejectDto,
    @CurrentUser() user: any,
  ) {
    const { approval } = await this.rejectDocumentUseCase.execute({
      approvalId: documentId,
      userId: user.id,
      justification: dto.justification,
    });

    return ApprovalSerializer.toHttpResponse(approval);
  }

  @Post(':approvalId/override-rejection')
  @HttpCode(HttpStatus.OK)
  @OverrideRejectionDocs()
  async overrideRejection(
    @Param('approvalId') approvalId: string,
    @Body() dto: OverrideRejectionDto,
    @CurrentUser() user: any,
  ) {
    const { approval } = await this.overrideRejectionUseCase.execute({
      approvalId,
      userId: user.id,
      userRole: user.role,
      reason: dto.reason,
    });

    return ApprovalSerializer.toHttpResponse(approval);
  }

  @Post(':approvalId/notify')
  @HttpCode(HttpStatus.OK)
  @NotifyApproverDocs()
  async notifyApprover(@Param('approvalId') approvalId: string) {
    const result = await this.notifyApproverUseCase.execute({ approvalId });

    return { data: result };
  }
}
