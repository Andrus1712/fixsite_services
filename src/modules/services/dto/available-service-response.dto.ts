import { Expose, Transform, Type } from 'class-transformer';

export class AvailableServiceIssueDto {
  @Expose() id: number;
  @Expose() issue_name: string;
  @Expose() issue_description: string;
  @Expose() issue_type: number;
  @Expose() issue_type_description: string;
  @Expose() issue_severity: number;
  @Expose() issue_severity_description: string;
}

export class AvailableServiceItemDto {
  @Expose()
  @Transform(({ obj }) => obj.service?.id)
  service_id: number;

  @Expose()
  @Transform(({ obj }) => obj.service?.codigo)
  codigo: string;

  @Expose()
  @Transform(({ obj }) => obj.service?.descripcion)
  descripcion: string;

  @Expose()
  @Transform(({ obj }) => obj.service?.precio_base)
  precio_base: number;

  @Expose()
  @Transform(({ obj }) => obj.orderType?.id)
  order_type_id: number;

  @Expose()
  @Transform(({ obj }) => obj.orderType?.nombre)
  order_type_nombre: string;

  @Expose() precio: number;

  @Expose() tiempoEstimadoMinutos: number;

  @Expose()
  @Transform(({ obj }) => obj.issue ? {
    id: obj.issue.id,
    issue_name: obj.issue.issue_name,
    issue_description: obj.issue.issue_description,
    issue_type: obj.issue.issue_type,
    issue_type_description: obj.issue.issue_type_description,
    issue_severity: obj.issue.issue_severity,
    issue_severity_description: obj.issue.issue_severity_description,
  } : null)
  issue: AvailableServiceIssueDto | null;
}
