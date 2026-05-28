import { Expose, Transform, Type } from 'class-transformer';

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
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
