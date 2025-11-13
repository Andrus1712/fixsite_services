import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class TenantSelectionGuard extends AuthGuard('jwt') {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    super();
  }
  handleRequest(err: any, user: any, info: any) {
    this.logger.debug('TenantSelectionGuard - Processing request', { 
      hasError: !!err, 
      hasUser: !!user, 
      info, 
      context: 'TenantSelectionGuard' 
    });
    
    if (err || !user) {
      this.logger.warn('TenantSelectionGuard - Authentication failed', { 
        error: err?.message, 
        context: 'TenantSelectionGuard' 
      });
      throw err || new UnauthorizedException();
    }
    
    if (user.type !== 'temp' && user.type !== 'full') {
      this.logger.warn('TenantSelectionGuard - Invalid token type', { 
        tokenType: user.type, 
        userId: user.id, 
        context: 'TenantSelectionGuard' 
      });
      throw new UnauthorizedException('Token válido requerido');
    }
    
    this.logger.debug('TenantSelectionGuard - Authentication successful', { 
      userId: user.id, 
      tokenType: user.type, 
      context: 'TenantSelectionGuard' 
    });
    return user;
  }
}