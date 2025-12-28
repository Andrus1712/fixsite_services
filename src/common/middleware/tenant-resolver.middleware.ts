import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../entities/global/tenant.entity';
import { JwtService } from '@nestjs/jwt';

declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant;
    }
  }
}

@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(Tenant, 'globalConnection')
    private readonly tenantRepository: Repository<Tenant>,
    private readonly jwtService: JwtService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantIdentifier = this.extractTenantIdentifier(req);
    
    if (!tenantIdentifier) {
      throw new BadRequestException('Tenant identifier is required');
    }

    // Buscar por subdomain o por ID
    const tenant = await this.tenantRepository.findOne({
      where: [
        { subdomain: tenantIdentifier, isActive: true },
        { id: tenantIdentifier, isActive: true }
      ],
    });

    if (!tenant) {
      throw new BadRequestException('Invalid tenant');
    }

    req.tenant = tenant;
    next();
  }

  private extractTenantIdentifier(req: Request): string | null {
    const host = req.get('host');
    
    // Prioridad 1: Header X-Tenant-ID (para desarrollo o cuando no hay subdomain)
    const tenantHeader = req.get('X-Tenant-ID');
    if (tenantHeader) return tenantHeader;

    // Prioridad 2: Query parameter tenant_id
    const tenantQuery = req.query.tenant_id as string;
    if (tenantQuery) return tenantQuery;

    // Prioridad 3: Extraer del JWT en cookies
    const tenantFromJWT = this.extractTenantFromJWT(req);
    if (tenantFromJWT) return tenantFromJWT;

    // Prioridad 4: Extraer del subdomain (para producción)
    if (!host) return null;
    const parts = host.split('.');
    return parts.length >= 2 ? parts[0] : null;
  }

  private extractTenantFromJWT(req: Request): string | null {
    try {
      const token = req.cookies?.access_token;
      if (!token) return null;

      const decoded = this.jwtService.decode(token) as any;
      return decoded?.tenantId?.toString() || null;
    } catch (error) {
      return null;
    }
  }
}