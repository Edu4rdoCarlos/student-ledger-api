import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max, IsNotEmpty } from 'class-validator';

export class SetGradeDto {
  @ApiProperty({ example: 8.5, description: 'Final grade (0 to 10). Grades >= 7 pass, < 7 fail' })
  @IsNumber()
  @Min(0)
  @Max(10)
  @IsNotEmpty()
  finalGrade: number;
}
