import { Expose, Transform, Type } from 'class-transformer';

export class OrderServiceIssueResponseDto {
  @Expose()
  id: number;

  @Expose()
  issue_name: string;

  @Expose()
  issue_description: string;

  @Expose()
  status: string;

  @Expose()
  is_resolved: boolean;

  @Expose()
  @Transform(({ obj }) => obj.issue_code?.code ?? null)
  failure_code: string | null;

  @Expose()
  @Transform(({ obj }) => obj.issue_code?.name ?? null)
  failure_name: string | null;
}

export class OrderServiceServiceDto {
  @Expose()
  id: number;

  @Expose()
  codigo: string;

  @Expose()
  descripcion: string;

  @Expose()
  precio_base: number;

  @Expose()
  activo: boolean;
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
  precio: number;

  @Expose()
  tiempo_estimado_minutos: number;

  @Expose()
  notas: string;

  @Expose()
  @Type(() => OrderServiceIssueResponseDto)
  issues: OrderServiceIssueResponseDto[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
