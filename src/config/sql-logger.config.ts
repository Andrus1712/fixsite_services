import { Logger } from 'typeorm';
import * as winston from 'winston';
import { join } from 'path';

export class SqlLogger implements Logger {
  private logger: winston.Logger;
  private static context: string = 'Unknown';

  constructor() {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, query, parameters, error, time }) => {
          const params = parameters && Array.isArray(parameters) && parameters.length > 0
            ? ` | Parameters: ${JSON.stringify(parameters)}` : '';
          const timeInfo = time ? ` | Time: ${time}ms` : '';
          const errorInfo = error ? ` | Error: ${error}` : '';
          return `[${timestamp}] [${level.toUpperCase()}] [${SqlLogger.context}] ${message}${timeInfo}${errorInfo}\n${query}${params}\n${'='.repeat(80)}`;
        })
      ),
      transports: [
        new winston.transports.File({
          filename: join(process.cwd(), 'logs', `sql-${dateStr}.log`),
          level: 'info'
        })
      ]
    });
  }

  static setContext(context: string) {
    SqlLogger.context = context;
  }

  logQuery(query: string, parameters?: any[]) {
    this.logger.info('SQL Query', { query, parameters });
  }

  logQueryError(error: string, query: string, parameters?: any[]) {
    this.logger.error('SQL Query Error', { error, query, parameters });
  }

  logQuerySlow(time: number, query: string, parameters?: any[]) {
    this.logger.warn('Slow SQL Query', { time, query, parameters });
  }

  logSchemaBuild(message: string) {
    this.logger.info('Schema Build', { message });
  }

  logMigration(message: string) {
    this.logger.info('Migration', { message });
  }

  log(level: 'log' | 'info' | 'warn', message: any) {
    this.logger.log(level === 'log' ? 'info' : level, message);
  }
}