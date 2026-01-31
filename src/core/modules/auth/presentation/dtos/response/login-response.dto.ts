import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token JWT de acesso',
  })
  accessToken: string;

  @ApiProperty({
    example: 900,
    description: 'Tempo de expiração do token em segundos',
  })
  expiresIn: number;

  @ApiProperty({
    example: true,
    description: 'Indica se é o primeiro acesso do usuário (precisa trocar senha)',
  })
  isFirstAccess: boolean;
}

export class LoginHttpResponseDto {
  @ApiProperty({ type: LoginResponseDto })
  data: LoginResponseDto;
}
