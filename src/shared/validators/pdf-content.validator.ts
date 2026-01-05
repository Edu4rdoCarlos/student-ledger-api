import { FileValidator } from '@nestjs/common';

export class PdfContentValidator extends FileValidator {
  isValid(file: Express.Multer.File): boolean {
    if (!file || !file.buffer) {
      return false;
    }

    const header = file.buffer.subarray(0, 5).toString();
    if (!header.startsWith('%PDF-')) {
      return false;
    }

    const footer = file.buffer.subarray(-1024).toString();
    if (!footer.includes('%%EOF')) {
      return false;
    }

    return true;
  }

  buildErrorMessage(): string {
    return 'O arquivo enviado não é um PDF válido';
  }
}
