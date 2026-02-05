import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { SqlLogger } from '../../config/sql-logger.config';
import { SQL_CONTEXT_KEY } from '../decorators/sql-context.decorator';

@Injectable()
export class SqlContextInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const sqlContext = this.reflector.get<string>(
      SQL_CONTEXT_KEY,
      context.getHandler(),
    );

    const controllerName = context.getClass()?.name ?? 'UnknownController';
    const methodName = context.getHandler()?.name ?? 'unknownMethod';

    SqlLogger.setContext(sqlContext ?? `${controllerName}.${methodName}`);

    return next.handle();
  }
}