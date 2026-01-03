import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsDateString, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class CreateDefenseDto {
  @ApiProperty({ example: 'Thesis Defense - Management System', description: 'Defense title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: '2024-12-20T14:00:00Z', description: 'Defense date and time' })
  @IsDateString()
  @IsNotEmpty()
  defenseDate: string;

  @ApiProperty({ example: 'advisor-uuid', description: 'Advisor ID' })
  @IsUUID()
  @IsNotEmpty()
  advisorId: string;

  @ApiProperty({
    example: ['student-uuid-1', 'student-uuid-2'],
    description: 'Student IDs (minimum 1, maximum 2)',
    type: [String]
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @IsUUID('4', { each: true })
  studentIds: string[];
}
