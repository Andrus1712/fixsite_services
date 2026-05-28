import { Expose, Transform } from 'class-transformer';

export class AvailableServiceItemDto {
  @Expose()
  @Transform(({ obj }) => obj.service?.id)
  service_id: number;

  @Expose()
  @Transform(({ obj }) => obj.service?.code)
  code: string;

  @Expose()
  @Transform(({ obj }) => obj.service?.description)
  description: string;

  @Expose()
  @Transform(({ obj }) => obj.service?.base_price)
  base_price: number;

  @Expose()
  @Transform(({ obj }) => obj.orderType?.id)
  order_type_id: number;

  @Expose()
  @Transform(({ obj }) => obj.orderType?.nombre)
  order_type_name: string;

  @Expose()
  price: number;

  @Expose()
  estimatedMinutes: number;

  @Expose()
  @Transform(({ obj }) => obj.failureCode
    ? {
      id: obj.failureCode.id,
      code: obj.failureCode.code,
      name: obj.failureCode.name,
      description: obj.failureCode.description,
    }
    : null)
  failure_code: { id: number; code: string; name: string; description: string } | null;
}
