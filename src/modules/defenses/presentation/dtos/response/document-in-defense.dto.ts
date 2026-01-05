import { ApiProperty } from '@nestjs/swagger';

export class DocumentInDefenseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  hash: string;

  @ApiProperty({ required: false })
  path?: string;
}
