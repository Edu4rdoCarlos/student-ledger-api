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
import {
  CurrentUser,
  ApiBadRequestResponse,
  ApiUnauthorizedErrorResponse,
  ApiForbiddenErrorResponse,
  ApiNotFoundErrorResponse,
} from '../../../../shared/decorators';
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
    summary: 'List pending approvals',
    description: `
Lists pending approvals for the authenticated user.

**Permissions:**
- COORDINATOR/ADMIN: view all pending approvals
- ADVISOR: view only approvals where they are the advisor
- STUDENT: view only their own approvals

**Use cases:**
- Coordinator needs to see all documents awaiting approval
- Advisor needs to approve documents from their students
- Student needs to approve minutes from their defense
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of pending approvals returned successfully',
    type: [ApprovalResponseDto],
  })
  @ApiUnauthorizedErrorResponse()
  @ApiForbiddenErrorResponse()
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
    summary: 'Approve document',
    description: `
Approves a specific document in the approval workflow.

**Flow:**
1. Authenticated user approves document associated with the approval
2. System records approval with timestamp and approver ID
3. If all required approvals are completed, document is registered on blockchain

**Validations:**
- Approval must be in PENDING status
- User must have permission to approve (correct role)
- Approval cannot have been processed previously

**Impact:**
- Approval status changes from PENDING to APPROVED
- If last required approval, document goes to blockchain
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document approved successfully',
    type: ApprovalResponseDto,
  })
  @ApiBadRequestResponse('Approval already processed or in invalid state')
  @ApiUnauthorizedErrorResponse()
  @ApiForbiddenErrorResponse('User does not have permission to approve this document')
  @ApiNotFoundErrorResponse('Approval not found')
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
    summary: 'Reject document',
    description: `
Rejects a document in the approval workflow with mandatory justification.

**Flow:**
1. Authenticated user rejects document providing justification (minimum 10 characters)
2. System records rejection with timestamp, approver ID, and justification
3. Document is not registered on blockchain
4. Coordinator can create new version of document to fix issues

**Validations:**
- Approval must be in PENDING status
- Justification is mandatory (minimum 10 characters)
- User must have permission to reject (correct role)
- Approval cannot have been processed previously

**Impact:**
- Approval status changes from PENDING to REJECTED
- Document does not proceed to blockchain
- Approval workflow is interrupted
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document rejected successfully',
    type: ApprovalResponseDto,
  })
  @ApiBadRequestResponse('Approval already processed, justification missing or invalid')
  @ApiUnauthorizedErrorResponse()
  @ApiForbiddenErrorResponse('User does not have permission to reject this document')
  @ApiNotFoundErrorResponse('Approval not found')
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
