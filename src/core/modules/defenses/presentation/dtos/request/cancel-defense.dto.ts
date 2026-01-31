import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CancelDefenseDto {
  @ApiProperty({
    description: 'Motivo do cancelamento da defesa',
    example: 'Estudante solicitou trancamento de matrícula',
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty({ message: 'Motivo do cancelamento é obrigatório' })
  @MinLength(10, { message: 'Motivo do cancelamento deve ter no mínimo 10 caracteres' })
  cancellationReason: string;
}
