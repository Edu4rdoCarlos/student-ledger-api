import { ApiProperty } from '@nestjs/swagger';

export class SimpleCourseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;
}

export class StudentInDefenseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  registration?: string;

  @ApiProperty({ type: SimpleCourseDto, required: false })
  course?: SimpleCourseDto;
}
