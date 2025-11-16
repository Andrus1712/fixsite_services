import { SetMetadata } from '@nestjs/common';

export const SQL_CONTEXT_KEY = 'sql_context';
export const SqlContext = (context: string) => SetMetadata(SQL_CONTEXT_KEY, context);