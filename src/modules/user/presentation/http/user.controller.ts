import { Controller, Get, Patch, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Roles, CurrentUser } from '../../../../shared/decorators';
import { ChangePasswordDto, HttpResponse } from '../../../../shared/dtos';
import { HttpResponseSerializer } from '../../../../shared/serializers';
import { ChangePasswordUseCase, GetUserUseCase } from '../../application/use-cases';
import { UserResponseDto } from '../dtos';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(
    private readonly changePassword: ChangePasswordUseCase,
    private readonly getUser: GetUserUseCase,
  ) {}

  @Get('me')
  @Roles('STUDENT', 'ADVISOR', 'COORDINATOR', 'ADMIN')
  @ApiOperation({
    summary: 'Get current user user',
    description: 'Returns user information for the authenticated user, including role-specific data.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getMe(@CurrentUser() currentUser: { id: string }): Promise<HttpResponse<UserResponseDto>> {
    const user = await this.getUser.execute(currentUser.id);
    return HttpResponseSerializer.serialize(user);
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
