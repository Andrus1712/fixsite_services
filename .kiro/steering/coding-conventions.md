# FixSite – Convenciones de Código

## Estructura de un Módulo

Cada módulo sigue esta estructura obligatoria:

```
src/modules/[nombre-modulo]/
├── [nombre-modulo].controller.ts
├── [nombre-modulo].service.ts
├── [nombre-modulo].module.ts
└── dto/
    ├── create-[nombre-modulo].dto.ts
    └── update-[nombre-modulo].dto.ts
```

---

## Controladores

### Patrón estándar
- Siempre `@UseGuards(TenantSelectionGuard)` a nivel de clase.
- Siempre `@CurrentTenant() tenant: Tenant` como primer parámetro.
- Usar `@Param('id', ParseIntPipe)` para IDs numéricos.
- Usar `@Query() query: PaginationQueryDto` para paginación.
- Respuestas inline con `{ success, status, message, data, errors?, pagination? }`.
- Verbos HTTP: `@Get`, `@Post`, `@Patch` (update parcial), `@Delete`. Usar `@Put` solo si el módulo ya lo usa (ej: maintenance).

### Ejemplo de controlador completo
```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, ParseIntPipe, HttpStatus } from '@nestjs/common';
import { TenantSelectionGuard } from '../auth/guards/tenant-selection.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Tenant } from '../../entities/global/tenant.entity';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Controller('recurso')
@UseGuards(TenantSelectionGuard)
export class RecursoController {
  constructor(private readonly recursoService: RecursoService) {}

  @Get()
  async findAll(
    @CurrentTenant() tenant: Tenant,
    @Query() query: PaginationQueryDto,
  ) {
    const { page, limit, filter } = query;
    const result = await this.recursoService.findAll(tenant, page, limit, filter);
    return {
      success: true,
      status: HttpStatus.OK,
      message: 'Recursos consultados correctamente',
      data: result.items,
      pagination: {
        total: result.total,
        page,
        limit: limit || 10,
        totalPages: Math.ceil(result.total / (limit || 10)),
      },
    };
  }

  @Get(':id')
  async findOne(
    @CurrentTenant() tenant: Tenant,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const data = await this.recursoService.findOne(tenant, id);
    return { success: true, status: HttpStatus.OK, message: 'Recurso encontrado', data, errors: null };
  }

  @Post()
  async create(
    @CurrentTenant() tenant: Tenant,
    @Body() dto: CreateRecursoDto,
  ) {
    const data = await this.recursoService.create(tenant, dto);
    return { success: true, status: HttpStatus.CREATED, message: 'Recurso creado exitosamente', data, errors: null };
  }

  @Patch(':id')
  async update(
    @CurrentTenant() tenant: Tenant,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRecursoDto,
  ) {
    const data = await this.recursoService.update(tenant, id, dto);
    return { success: true, status: HttpStatus.OK, message: 'Recurso actualizado exitosamente', data, errors: null };
  }

  @Delete(':id')
  async remove(
    @CurrentTenant() tenant: Tenant,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.recursoService.remove(tenant, id);
    return { success: true, status: HttpStatus.OK, message: 'Recurso eliminado exitosamente', data: null, errors: null };
  }
}
```

---

## Servicios

### Obtener repositorio (dos formas válidas)
```typescript
// Forma 1 – directa (preferida para operaciones simples)
const repo = await this.tenantService.getRepository(Entidad, tenant);

// Forma 2 – via connection (cuando se necesita acceso al DataSource)
const connection = await this.tenantService.getConnection(tenant);
const repo = connection.getRepository(Entidad);
```

### Patrón findAll con paginación y filtro
```typescript
async findAll(tenant: Tenant, page = 1, limit = 10, filter?: string) {
  const repo = await this.tenantService.getRepository(Entidad, tenant);
  const qb = repo.createQueryBuilder('alias')
    .leftJoinAndSelect('alias.relacion', 'relacion');

  if (filter) {
    qb.where('alias.campo LIKE :filter', { filter: `%${filter}%` });
  }

  const [items, total] = await qb
    .skip((page - 1) * limit)
    .take(limit)
    .orderBy('alias.id', 'DESC')
    .getManyAndCount();

  return { items, total };
}
```

### Patrón findOne con NotFoundException
```typescript
async findOne(tenant: Tenant, id: number) {
  const repo = await this.tenantService.getRepository(Entidad, tenant);
  const item = await repo.findOne({ where: { id }, relations: ['relacion'] });
  if (!item) throw new NotFoundException(`Entidad con ID ${id} no encontrada`);
  return item;
}
```

### Patrón update
```typescript
async update(tenant: Tenant, id: number, dto: UpdateDto) {
  const repo = await this.tenantService.getRepository(Entidad, tenant);
  const item = await repo.findOne({ where: { id } });
  if (!item) throw new NotFoundException(`Entidad con ID ${id} no encontrada`);
  Object.assign(item, dto);
  return repo.save(item);
}
```

### Patrón create con relaciones por ID
```typescript
async create(tenant: Tenant, dto: CreateDto) {
  const repo = await this.tenantService.getRepository(Entidad, tenant);
  const entity = repo.create({
    ...dto,
    relacion: { id: dto.relacion_id } as any,
  });
  return repo.save(entity);
}
```

---

## DTOs

- Usar `class-validator` decorators siempre.
- Campos opcionales con `@IsOptional()`.
- Relaciones se reciben como `_id` (ej: `order_id`, `service_id`).
- `UpdateDto` extiende `PartialType(CreateDto)`.
- Para paginación usar `PaginationQueryDto` de `src/common/dto/pagination-query.dto.ts`.

```typescript
// create-recurso.dto.ts
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateRecursoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsNumber()
  @IsOptional()
  relacion_id?: number;
}

// update-recurso.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateRecursoDto } from './create-recurso.dto';
export class UpdateRecursoDto extends PartialType(CreateRecursoDto) {}
```

### PaginationQueryDto (ya existe, no recrear)
```typescript
// Campos: page?: number, limit?: number, filter?: string
// Usa @Type(() => Number) para convertir query strings automáticamente
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
```

---

## Entidades

```typescript
@Entity('nombre_tabla')
export class NombreEntidad {
  @PrimaryGeneratedColumn()
  id: number;

  // FK explícita + relación
  @Column()
  relacion_id: number;

  @ManyToOne(() => OtraEntidad, { nullable: false })
  @JoinColumn({ name: 'relacion_id' })
  relacion: OtraEntidad;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

- Columnas en `snake_case`, propiedades de clase en `camelCase`.
- Siempre incluir `@CreateDateColumn()` y `@UpdateDateColumn()`.
- Declarar la FK como `@Column()` explícita además de la relación `@ManyToOne`.
- Las entidades branch van en `src/entities/branch/` y deben exportarse en `src/entities/branch/index.ts`.

---

## Registro en AppModule

Al crear un nuevo módulo, agregarlo en `src/app.module.ts`:
1. Importar el módulo en `imports[]`.
2. Agregar la ruta en `consumer.forRoutes()` dentro de `configure()`.

```typescript
// En imports[]
OrderServiceModule,

// En forRoutes()
'orders-service/*path',
```

---

## Realtime – Emitir eventos desde un servicio

Para emitir notificaciones o stats desde cualquier servicio, inyectar `RealtimeService`:

```typescript
constructor(private readonly realtimeService: RealtimeService) {}

// Notificación a un usuario específico
this.realtimeService.sendNotification(tenantId, {
  id: uuid(),
  userId: 'user-id',       // omitir para broadcast al tenant
  type: 'order:updated',
  title: 'Orden actualizada',
  body: 'La orden #123 cambió de estado',
  createdAt: new Date().toISOString(),
});

// Emitir stats actualizadas al tenant
await this.realtimeService.emitStats(tenantId);
```

---

## Nomenclatura

| Elemento | Convención | Ejemplo |
|---|---|---|
| Archivos | kebab-case | `order-service.controller.ts` |
| Clases | PascalCase | `OrderServiceController` |
| Variables/métodos | camelCase | `findAll`, `tenantService` |
| Constantes | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Rutas API | kebab-case plural | `/orders-service`, `/failure-categories` |
| Columnas DB | snake_case | `order_id`, `customer_name` |

---

## Formato de Respuesta HTTP

Todas las respuestas siguen este contrato:

```typescript
// Respuesta estándar
{
  success: boolean,
  status: HttpStatus,
  message: string,
  data: T | null,
  errors: null
}

// Respuesta con paginación
{
  success: boolean,
  status: HttpStatus,
  message: string,
  data: T[],
  pagination: {
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

---

## Seguridad

- **NUNCA** concatenar strings en queries SQL → usar parámetros nombrados.
- **NUNCA** acceder a `process.env` directamente en servicios → usar config tipada.
- **NUNCA** exponer detalles internos en mensajes de error al cliente.
- **SIEMPRE** validar con DTOs + `ValidationPipe` global.
- **SIEMPRE** usar `TenantSelectionGuard` en todos los controladores (excepto `upload`).
