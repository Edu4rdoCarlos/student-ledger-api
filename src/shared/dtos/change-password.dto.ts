import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsNotEmpty } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'senhaAtual123', description: 'Senha atual', minLength: 6 })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'novaSenha456', description: 'Nova senha', minLength: 6 })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  newPassword: string;
}
