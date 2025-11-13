import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../entities/global/tenant.entity';

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
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const subdomain = this.extractSubdomain(req);
    
    if (!subdomain) {
      throw new BadRequestException('Subdomain is required');
    }

    const tenant = await this.tenantRepository.findOne({
      where: { subdomain, isActive: true },
    });

    if (!tenant) {
      throw new BadRequestException('Invalid tenant');
    }

    req.tenant = tenant;
    next();
  }

  private extractSubdomain(req: Request): string | null {
    const host = req.get('host');
    if (!host) return null;

    // Para desarrollo local, usar header X-Tenant-ID
    const tenantHeader = req.get('X-Tenant-ID');
    if (tenantHeader) return tenantHeader;

    // Para producción, extraer del subdomain
    
    const parts = host.split('.');
    return parts.length >= 2 ? parts[0] : null;
  }
}