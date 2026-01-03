import { ApiProperty } from '@nestjs/swagger';
import { DefenseResponseDto } from './defense-response.dto';
import { DocumentResponseDto } from '../../../../documents/presentation/dtos/response';

export class SubmitDefenseResultResponseDto {
  @ApiProperty({ type: DefenseResponseDto })
  defense: DefenseResponseDto;

  @ApiProperty({ type: DocumentResponseDto })
  document: DocumentResponseDto;
}
