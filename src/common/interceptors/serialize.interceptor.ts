import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common';
import { type ClassTransformOptions, plainToInstance } from 'class-transformer';
import { catchError, map } from 'rxjs';
import { throwError } from 'rxjs';

@Injectable()
export class SerializeInterceptor<T> implements NestInterceptor {
    private readonly logger = new Logger('SerializeInterceptor');

    constructor(
        private readonly dto: new () => T,
        private readonly options: ClassTransformOptions = {},
    ) { }

    intercept(context: ExecutionContext, next: CallHandler) {
        return next.handle().pipe(
            map((data) => {
                try {
                    // Si la respuesta tiene una propiedad 'data', transformamos el contenido de esa propiedad
                    if (data && typeof data === 'object' && 'data' in data) {
                        return {
                            ...data,
                            data: plainToInstance(this.dto, data.data, this.options)
                        };
                    }
                    return plainToInstance(this.dto, data, this.options);
                } catch (error) {
                    this.logger.error(
                        'Error transforming data with plainToInstance',
                        error instanceof Error ? error.stack : JSON.stringify(error),
                    );
                    throw error;
                }
            }),
            catchError((error) => {
                this.logger.error(
                    'Error in SerializeInterceptor',
                    error instanceof Error ? error.stack : JSON.stringify(error),
                );
                return throwError(() => error);
            }),
        );
    }
}