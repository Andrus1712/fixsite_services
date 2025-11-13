import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class TempTokenGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    
    if (user.type !== 'temp') {
      throw new UnauthorizedException('Token temporal requerido');
    }
    
    return user;
  }
}