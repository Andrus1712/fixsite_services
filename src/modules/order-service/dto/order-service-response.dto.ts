import { Expose, Transform, Type } from 'class-transformer';

export class OrderServicePartArticleDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  sku: string;
}

export class OrderServicePartStoreDto {
  @Expose()
  id: number;

  @Expose()
  name: string;
}

export class OrderServicePartResponseDto {
  @Expose()
  id: number;

  @Expose()
  article_id: number;

  @Expose()
  quantity: number;

  @Expose()
  store_id: number;

  @Expose()
  @Type(() => OrderServicePartArticleDto)
  article: OrderServicePartArticleDto;

  @Expose()
  @Type(() => OrderServicePartStoreDto)
  store: OrderServicePartStoreDto;
}

export class OrderServiceIssueResponseDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  status: string;

  @Expose()
  is_resolved: boolean;

  @Expose()
  @Transform(({ obj }) => obj.failureCode?.code ?? null)
  failure_code: string | null;

  @Expose()
  @Transform(({ obj }) => obj.failureCode?.name ?? null)
  failure_code_name: string | null;
}

export class OrderServiceServiceDto {
  @Expose()
  id: number;

  @Expose()
  code: string;

  @Expose()
  description: string;

  @Expose()
  base_price: number;

  @Expose()
  is_active: boolean;
}

export class OrderServiceResponseDto {
  @Expose()
  id: number;

  @Expose()
  order_id: number;

  @Expose()
  service_id: number;

  @Expose()
  @Type(() => OrderServiceServiceDto)
  service: OrderServiceServiceDto;

  @Expose()
  price: number;

  @Expose()
  estimated_minutes: number;

  @Expose()
  notes: string;

  @Expose()
  @Type(() => OrderServiceIssueResponseDto)
  issues: OrderServiceIssueResponseDto[];

  @Expose()
  material_issue_id: number | null;

  @Expose()
  @Type(() => OrderServicePartResponseDto)
  parts: OrderServicePartResponseDto[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
