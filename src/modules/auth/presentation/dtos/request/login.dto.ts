import { IsStrongPassword } from '@/shared';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'usuario@email.com', description: 'Email do usuário' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'SenhaForte123!',
    description: 'Senha do usuário (mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial)',
  })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({
    message:
      'A senha deve conter no mínimo 8 caracteres, incluindo pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial',
  })
  password: string;
}
