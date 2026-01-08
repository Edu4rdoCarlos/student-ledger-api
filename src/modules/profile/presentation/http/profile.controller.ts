import { Controller, Get, Patch, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Roles, CurrentUser } from '../../../../shared/decorators';
import { ChangePasswordDto, HttpResponse } from '../../../../shared/dtos';
import { HttpResponseSerializer } from '../../../../shared/serializers';
import { ChangePasswordUseCase, GetProfileUseCase } from '../../application/use-cases';
import { ProfileResponseDto } from '../dtos';

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('profile')
export class ProfileController {
  constructor(
    private readonly changePassword: ChangePasswordUseCase,
    private readonly getProfile: GetProfileUseCase,
  ) {}

  @Get('me')
  @Roles('STUDENT', 'ADVISOR', 'COORDINATOR', 'ADMIN')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns profile information for the authenticated user, including role-specific data.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully.',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getMe(@CurrentUser() currentUser: { id: string }): Promise<HttpResponse<ProfileResponseDto>> {
    const profile = await this.getProfile.execute(currentUser.id);
    return HttpResponseSerializer.serialize(profile);
  }

  @Patch('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('STUDENT', 'ADVISOR')
  @ApiOperation({
    summary: 'Change user password',
    description: 'Allows students and advisors to change their own password.',
  })
  @ApiResponse({
    status: 204,
    description: 'Password changed successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Current password incorrect or not authenticated',
  })
  @ApiResponse({
    status: 403,
    description: 'No permission',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async changePasswordHandler(@CurrentUser() currentUser: { id: string }, @Body() dto: ChangePasswordDto) {
    await this.changePassword.execute(currentUser.id, dto);
  }
}
