import { Injectable } from '@nestjs/common';
import { TenantAwareService } from '../../database/tenant-aware.service';
import { Product } from '../../entities/branch/product.entity';

@Injectable()
export class ProductService {

  constructor(private readonly tenantAwareService: TenantAwareService) {}
  async getAllProducts(tenantId: string) {
    const tenant = { id: tenantId } as any;
    const productRepository = await this.tenantAwareService.getRepository(Product, tenant);
    return productRepository.find();
  }
}