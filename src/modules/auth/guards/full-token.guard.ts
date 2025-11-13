import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class FullTokenGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    
    if (user.type !== 'full' || !user.tenantId) {
      throw new UnauthorizedException('Debe seleccionar un tenant');
    }
    
    return user;
  }
}