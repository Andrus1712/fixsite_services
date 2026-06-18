import { Expose, Transform } from 'class-transformer';

export class AvailableServiceItemDto {
  @Expose()
  @Transform(({ obj }) => obj.service?.id)
  service_id: number;

  @Expose()
  @Transform(({ obj }) => obj.service?.code)
  code: string;

  @Expose()
  @Transform(({ obj }) => obj.service?.is_active)
  is_active: boolean;

  @Expose()
  @Transform(({ obj }) => obj.service?.requires_articles)
  requires_articles: boolean;

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

  @Expose()
  @Transform(({ obj }) => obj.service?.serviceArticles?.length
    ? obj.service.serviceArticles.map(sa => ({
      id: sa.id,
      article_id: sa.article_id,
      article_sku: sa.article?.sku ?? null,
      article_name: sa.article?.name ?? null,
      default_quantity: sa.default_quantity,
      article_unit: sa.article.unit_measurement ?? null,
      is_active: sa.is_active,
    }))
    : [])
  services_articles: { id: number; article_id: number; article_name: string | null; default_quantity: number; is_active: boolean }[]
}
