import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ErrorResponsePayload {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp: string;
  path: string;
}

/**
 * Global exception filter to catch and standardize all unhandled exceptions across the application.
 * Ensures consistent JSON structure, proper HTTP status codes, and prevents sensitive stack trace leaks.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error occurred. Please try again later.';
    let errorName = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as Record<string, any>;
        message = resObj['message'] || exception.message;
        errorName = resObj['error'] || exception.name;
      }
    } else if (exception instanceof Error) {
      // Prisma or unknown runtime exceptions
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
      message = exception.message || message;
    }

    const payload: ErrorResponsePayload = {
      statusCode: status,
      message,
      error: errorName,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(payload);
  }
}
