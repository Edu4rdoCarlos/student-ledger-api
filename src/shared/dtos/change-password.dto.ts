import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { IsStrongPassword } from '../decorators';

export class ChangePasswordDto {
  @ApiProperty({ example: 'SenhaAtual123!', description: 'Senha atual' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    example: 'NovaSenha456!',
    description: 'Nova senha (mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial)',
  })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({
    message:
      'A nova senha deve conter no mínimo 8 caracteres, incluindo pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial',
  })
  newPassword: string;
}
