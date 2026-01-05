import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RejectDto {
  @ApiProperty({
    description: 'Justificativa para a rejeição',
    example: 'O documento contém informações incorretas sobre a metodologia utilizada',
    minLength: 10,
  })
  @IsString()
  @MinLength(10)
  justification!: string;
}
