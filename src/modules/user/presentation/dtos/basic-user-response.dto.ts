import { ApiProperty } from '@nestjs/swagger';

export class BasicUserResponseDto {
  @ApiProperty({ description: 'ID do usuário' })
  id: string;

  @ApiProperty({ description: 'Email do usuário' })
  email: string;

  @ApiProperty({ description: 'Nome do usuário' })
  name: string;

  @ApiProperty({ description: 'Role do usuário', enum: ['ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT'] })
  role: 'ADMIN' | 'COORDINATOR' | 'ADVISOR' | 'STUDENT';

  @ApiProperty({ description: 'Indica se é o primeiro acesso do usuário (deve atualizar a senha)' })
  isFirstAccess: boolean;
}
