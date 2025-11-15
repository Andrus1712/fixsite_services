import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class TenantRequiredGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    
    if (user.type !== 'full') {
      throw new UnauthorizedException('Token de acceso requerido');
    }
    
    if (!user.tenantId) {
      throw new UnauthorizedException('Debe seleccionar un tenant para esta operación');
    }
    
    return user;
  }
}