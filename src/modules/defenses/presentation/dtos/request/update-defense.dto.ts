import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateDefenseDto {
  @ApiProperty({ example: 'Thesis Defense - Updated System', description: 'Defense title', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: '2024-12-21T14:00:00Z', description: 'Defense date and time', required: false })
  @IsDateString()
  @IsOptional()
  defenseDate?: string;
}
