import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message;
    } else if (exception instanceof Error) {
      switch (exception.name) {
        case 'DefenseNotFoundError':
          status = HttpStatus.NOT_FOUND;
          message = exception.message;
          break;
        case 'StudentAlreadyHasActiveDefenseError':
          status = HttpStatus.CONFLICT;
          message = exception.message;
          break;
        case 'TooManyStudentsError':
          status = HttpStatus.BAD_REQUEST;
          message = exception.message;
          break;
        case 'InvalidGradeError':
          status = HttpStatus.BAD_REQUEST;
          message = exception.message;
          break;
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = exception.message || 'Internal server error';
      }
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message,
    });
  }
}
