import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min, Max, IsOptional } from 'class-validator';

export class PaginationDto {
  @ApiProperty({
    description: 'Número da página',
    default: 1,
    minimum: 1,
    maximum: 1000,
    required: false,
  })
  @Type(() => Number)
  @IsInt({ message: 'Página deve ser um número inteiro' })
  @Min(1, { message: 'Página deve ser no mínimo 1' })
  @Max(1000, { message: 'Página deve ser no máximo 1000' })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: 'Quantidade de itens por página',
    default: 10,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @Type(() => Number)
  @IsInt({ message: 'perPage deve ser um número inteiro' })
  @Min(1, { message: 'perPage deve ser no mínimo 1' })
  @Max(100, { message: 'perPage deve ser no máximo 100' })
  @IsOptional()
  perPage?: number = 10;
}
