import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger('HttpExceptionFilter');

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Error interno del servidor';
        let errors = null;

        // Loguear la excepción completa
        this.logger.error(
            `Exception occurred: ${request.method} ${request.url}`,
            exception instanceof Error ? exception.stack : JSON.stringify(exception),
        );

        // Errores HTTP conocidos
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'object') {
                const res = exceptionResponse as any;

                message = res.message || message;

                // errores de validación DTO
                if (Array.isArray(res.message)) {
                    errors = res.message.map((msg: string) => ({
                        field: msg.split(' ')[0],
                        message: msg,
                    }));
                } else if (res.errors) {
                    errors = res.errors;
                }
            } else {
                message = exceptionResponse;
            }
        } else if (exception instanceof Error) {
            this.logger.error(
                `Unhandled Error: ${exception.message}`,
                exception.stack,
            );
        }

        response.status(status).json({
            success: false,
            status,
            message,
            data: null,
            errors,
            path: request.url,
            timestamp: new Date().toISOString(),
        });
    }
}
