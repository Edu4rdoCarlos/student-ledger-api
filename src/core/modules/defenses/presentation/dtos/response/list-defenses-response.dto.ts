import { ApiProperty } from '@nestjs/swagger';
import { DefenseListItemDto } from './defense-list-item.dto';
import { PaginationMetadata } from '../../../../../../shared/dtos';

export class ListDefensesResponseDto {
  @ApiProperty({
    type: [DefenseListItemDto],
    description: 'List of defenses with basic information',
  })
  data: DefenseListItemDto[];

  @ApiProperty({
    type: PaginationMetadata,
    description: 'Pagination metadata',
  })
  metadata: PaginationMetadata;
}
