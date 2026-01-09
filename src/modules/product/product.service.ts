import { Injectable } from '@nestjs/common';
import { Product } from '../../entities/branch/product.entity';
import { ConnectionDatabaseService } from 'src/database/connection-database.service';

@Injectable()
export class ProductService {

  constructor(private readonly tenantAwareService: ConnectionDatabaseService) { }
  async getAllProducts(tenantId: string) {
    const tenant = { id: tenantId } as any;
    const productRepository = await this.tenantAwareService.getRepository(Product, tenant);
    return productRepository.find();
  }
}