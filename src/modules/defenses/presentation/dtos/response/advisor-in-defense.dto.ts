import { ApiProperty } from '@nestjs/swagger';

export class AdvisorInDefenseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  specialization?: string;
}
