import { ApiProperty } from '@nestjs/swagger';
import { DefenseResponseDto } from './defense-response.dto';
import { PaginationMetadata } from '../../../../../shared/dtos';

export class ListDefensesResponseDto {
  @ApiProperty({
    type: [DefenseResponseDto],
    description: 'List of defenses',
  })
  data: DefenseResponseDto[];

  @ApiProperty({
    type: PaginationMetadata,
    description: 'Pagination metadata',
  })
  metadata: PaginationMetadata;
}
