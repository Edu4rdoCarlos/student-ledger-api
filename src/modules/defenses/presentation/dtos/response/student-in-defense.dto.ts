import { ApiProperty } from '@nestjs/swagger';

export class StudentInDefenseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  registration?: string;
}
