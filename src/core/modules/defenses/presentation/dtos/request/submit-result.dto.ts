import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max, IsNotEmpty } from 'class-validator';

export class SubmitDefenseResultDto {
  @ApiProperty({
    example: 8.5,
    description: 'Final grade (0 to 10). Grades >= 7 pass, < 7 fail'
  })
  @IsNumber()
  @Min(0)
  @Max(10)
  @IsNotEmpty()
  finalGrade: number;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Minutes document file (Ata) - PDF'
  })
  minutesFile: any;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Performance evaluation document file (Avaliação de Desempenho) - PDF'
  })
  evaluationFile: any;
}
