import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsDateString, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class CreateDefenseDto {
  @ApiProperty({ example: 'Defesa de TCC - Sistema de Gerenciamento', description: 'Título da defesa' })
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiProperty({ example: '2024-12-20T14:00:00Z', description: 'Data e hora da defesa' })
  @IsDateString()
  @IsNotEmpty()
  dataDefesa: string;

  @ApiProperty({ example: 'uuid-do-orientador', description: 'ID do orientador' })
  @IsUUID()
  @IsNotEmpty()
  advisorId: string;

  @ApiProperty({
    example: ['uuid-estudante-1', 'uuid-estudante-2'],
    description: 'IDs dos estudantes (mínimo 1, máximo 2)',
    type: [String]
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @IsUUID('4', { each: true })
  studentIds: string[];
}
