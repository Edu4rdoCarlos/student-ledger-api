import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OverrideRejectionDto {
  @ApiProperty({
    description: 'Motivo pelo qual o coordenador está desconsiderando a rejeição',
    example: 'A rejeição foi considerada inválida após análise. O documento está adequado aos padrões da instituição.',
  })
  @IsNotEmpty({ message: 'O motivo é obrigatório' })
  @IsString({ message: 'O motivo deve ser um texto' })
  reason: string;
}
