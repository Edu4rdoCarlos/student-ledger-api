import { Controller, Get, Patch, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Roles, CurrentUser } from '../../../../shared/decorators';
import { ChangePasswordDto, HttpResponse } from '../../../../shared/dtos';
import { HttpResponseSerializer } from '../../../../shared/serializers';
import { ChangePasswordUseCase, GetUserUseCase, GetBasicUserUseCase, GetUserDefensesUseCase } from '../../application/use-cases';
import { UserResponseDto, BasicUserResponseDto } from '../dtos';
import { DefenseResponseDto } from '../../../defenses/presentation/dtos/response/defense-response.dto';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(
    private readonly changePassword: ChangePasswordUseCase,
    private readonly getUser: GetUserUseCase,
    private readonly getBasicUser: GetBasicUserUseCase,
    private readonly getUserDefenses: GetUserDefensesUseCase,
  ) {}

  @Get('me')
  @Roles('STUDENT', 'ADVISOR', 'COORDINATOR', 'ADMIN')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns basic user information (id, email, name, role). Use /user/me/defenses for defense details.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully.',
    type: BasicUserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getMe(@CurrentUser() currentUser: { id: string }): Promise<HttpResponse<BasicUserResponseDto>> {
    const user = await this.getBasicUser.execute(currentUser.id);
    return HttpResponseSerializer.serialize(user);
  }

  @Get('me/defenses')
  @Roles('STUDENT', 'ADVISOR', 'COORDINATOR')
  @ApiOperation({
    summary: 'Get all user defenses',
    description: 'Returns complete list of all defenses for the authenticated user (student, advisor, or coordinator).',
  })
  @ApiResponse({
    status: 200,
    description: 'Defenses retrieved successfully.',
    type: [DefenseResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getMyDefenses(@CurrentUser() currentUser: { id: string }): Promise<HttpResponse<DefenseResponseDto[]>> {
    const defenses = await this.getUserDefenses.execute(currentUser.id);
    return HttpResponseSerializer.serialize(defenses);
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
