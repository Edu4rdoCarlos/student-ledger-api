import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max, IsNotEmpty } from 'class-validator';

export class SetGradeDto {
  @ApiProperty({ example: 8.5, description: 'Nota final (0 a 10). Notas >= 7 aprovam, < 7 reprovam' })
  @IsNumber()
  @Min(0)
  @Max(10)
  @IsNotEmpty()
  notaFinal: number;
}
