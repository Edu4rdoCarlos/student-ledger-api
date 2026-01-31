import { ApiProperty } from '@nestjs/swagger';

export class LogoutResponseDto {
  @ApiProperty({
    example: 'Logout realizado com sucesso',
    description: 'Mensagem de confirmacao do logout',
  })
  message: string;
}

export class LogoutHttpResponseDto {
  @ApiProperty({ type: LogoutResponseDto })
  data: LogoutResponseDto;
}
