import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsArray, ValidateNested, IsNotEmpty, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ExamBoardMemberDto } from './create-defense.dto';

export class UpdateDefenseDto {
  @ApiProperty({ example: 'Thesis Defense - Updated System', description: 'Defense title', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: '2024-12-21T14:00:00Z', description: 'Defense date and time', required: false })
  @IsDateString()
  @IsOptional()
  defenseDate?: string;

  @ApiProperty({ example: 'Auditório Principal', description: 'Local da defesa', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    example: [
      { name: 'Dr. João Silva', email: 'joao.silva@university.edu' }
    ],
    description: 'Membros da banca examinadora',
    type: [ExamBoardMemberDto],
    required: false
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ExamBoardMemberDto)
  examBoard?: ExamBoardMemberDto[];
}

export class RescheduleDefenseDto {
  @ApiProperty({ example: '2024-12-25T14:00:00Z', description: 'Nova data e hora da defesa' })
  @IsDateString()
  defenseDate: string;

  @ApiProperty({
    description: 'Motivo do reagendamento da defesa',
    example: 'Conflito de horário com outro evento acadêmico',
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty({ message: 'Motivo do reagendamento é obrigatório' })
  @MinLength(10, { message: 'Motivo do reagendamento deve ter no mínimo 10 caracteres' })
  rescheduleReason: string;
}
