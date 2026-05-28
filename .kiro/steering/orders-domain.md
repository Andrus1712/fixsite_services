# FixSite – Dominio de Órdenes, Fallas y Servicios

## Modelo Conceptual

```
Order (orden de reparación)
  ├── OrderIssue[] (fallas reportadas del dispositivo)
  │     └── FailureCode (clasificación del catálogo de mantenimiento)
  │           ├── FailureCategory
  │           ├── FailureSeverity
  │           └── DeviceType
  ├── OrderService[] (servicios aplicados para resolver fallas)
  │     ├── Service (catálogo)
  │     └── OrderIssue[] (N:N — qué fallas resuelve este servicio)
  ├── Device[] (dispositivos asociados)
  ├── Note[] (notas internas/externas)
  └── LogEvents[] (historial de acciones)
```

---

## Entidades Clave

### Order (tabla: `orders`)
- Orden de reparación principal.
- Campos: `id`, `order_code` (único, auto-generado), `description`, `status`, `priority`, `customer_id`, `assigned_technician_id`, `order_type_id`, costos, timeline.
- Relaciones: `customer`, `technician`, `orderType`, `devices[]`, `issues[]`, `notes[]`, `logs[]`.

### OrderIssue (tabla: `order_issues`)
- Falla reportada en un dispositivo dentro de una orden.
- Campos simplificados:
  - `title` — nombre corto de la falla
  - `description` — detalle
  - `failure_code_id` — FK al catálogo FailureCode (categoría + severidad + tipo dispositivo)
  - `additional_notes` — contexto adicional
  - `attachments` — JSON array unificado (fotos, videos, docs)
  - `steps_to_reproduce` — JSON array
  - `reported_by` — quién reportó ("customer", "tecnico", nombre libre)
  - `reported_date` — cuándo se reportó
  - `status` — enum: `PENDING | RESOLVED | REJECTED`
  - `is_resolved` — boolean (redundante con status, útil para queries)
- La clasificación (categoría, severidad, tipo de dispositivo) se obtiene via la relación `failureCode`.

### OrderService (tabla: `order_services`)
- Servicio aplicado a una orden para resolver fallas.
- Campos: `order_id`, `service_id`, `price`, `estimated_minutes`, `notes`.
- Relación N:N con `OrderIssue` via tabla `order_service_issues`.
- Al crear un OrderService con `issue_ids`, esos OrderIssue pasan a `RESOLVED`.
- Al eliminar un OrderService, los OrderIssue vuelven a `PENDING` (si no están cubiertos por otro).

### Service (tabla: `services`)
- Catálogo de servicios ofrecidos.
- Campos: `code` (único), `description`, `base_price`, `is_active`.

### ServiceOrderType (tabla: `service_order_types`)
- Catálogo de precios: cuánto cuesta un servicio para un tipo de orden + falla específica.
- Campos: `service_id`, `order_type_id`, `failure_code_id` (opcional), `price`, `estimated_minutes`, `is_active`.
- Si `failure_code_id` es null → el precio aplica a cualquier falla de ese tipo de orden.

### OrderType (tabla: `order_types`)
- Tipo de orden (ej: "Reparación Express", "Garantía", "Mantenimiento preventivo").
- Campos: `codigo`, `nombre`, `descripcion`, `activo`.

---

## Catálogo de Fallas (módulo maintenance)

### FailureCode (tabla: `failure_codes`)
- Código de falla del catálogo maestro.
- Campos: `code` (único, ej: "SCR-001"), `name`, `description`, `device_type_id`, `category_id`, `severity_id`, `estimatedRepairMinutes`, `isActive`.
- Relaciones: `deviceType`, `category`, `severity`, `repairActions[]`.

### FailureCategory (tabla: `failure_categories`)
- Agrupación de fallas (ej: "Pantalla", "Batería", "Audio").
- Campos: `name`, `description`, `isActive`.

### FailureSeverity (tabla: `failure_severities`)
- Nivel de gravedad (ej: "Crítica", "Alta", "Media", "Baja").
- Campos: `name`, `priority` (1=crítica, 4=baja), `description`.

### RepairAction (tabla: `repair_actions`)
- Acción de reparación asociada a un FailureCode.
- Campos: `failure_code_id`, `name`, `description`, `estimatedMinutes`, `requiresParts`, `isActive`.

---

## Flujo de Negocio

### 1. Crear orden con fallas
```
POST /orders/create
body.issues[] = [
  { title, description, failure_code_id, additional_notes?, reported_by? }
]
→ Crea Order + Device + OrderIssue[] (status: PENDING) + Notes + LogEvent
```

### 2. Agregar falla adicional a orden existente
```
POST /orders/issues/create
body = { order_id, title, description, failure_code_id?, ... }
→ Crea OrderIssue (status: PENDING)
```

### 3. Buscar servicios disponibles para las fallas
```
POST /services/available
body = { orderTypeId, orderIssueIds: [1, 2], orderId? }
→ Consulta ServiceOrderType donde:
  - order_type_id = orderTypeId
  - failure_code_id IN (failure_codes de los issues) OR failure_code_id IS NULL
  - service no ya asignado a la orden
```

### 4. Asignar servicio que resuelve fallas
```
POST /orders-service/create
body = { order_id, service_id, issue_ids: [1, 2], price, estimated_minutes, notes? }
→ Crea OrderService + vincula issues via order_service_issues
→ Los OrderIssue en issue_ids pasan a status: RESOLVED, is_resolved: true
```

### 5. Eliminar servicio (revierte fallas)
```
DELETE /orders-service/:id
→ Para cada issue vinculado:
  - Si NO está cubierto por otro OrderService → vuelve a PENDING
  - Si SÍ está cubierto por otro → se mantiene RESOLVED
→ Elimina el OrderService
```

---

## Reglas de Negocio

- Un `OrderIssue` puede ser resuelto por múltiples `OrderService` (N:N).
- Un `OrderService` puede resolver múltiples `OrderIssue`.
- La clasificación de la falla (categoría, severidad) NO se almacena en `OrderIssue` — se obtiene via `failureCode`.
- `failure_code_id` en `OrderIssue` es opcional (una falla puede reportarse sin clasificar).
- El `status` de `OrderIssue` solo cambia por:
  - Creación de `OrderService` con ese issue → RESOLVED
  - Eliminación de `OrderService` → PENDING (si no hay otro que lo cubra)
  - Rechazo manual → REJECTED
- `OrderService.price` puede diferir de `ServiceOrderType.price` (el catálogo es referencia, el precio final se ajusta por orden).

---

## Endpoints Principales

### Orders (`/orders`)
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/create` | Crear orden completa (device + issues + notes) |
| GET | `/all` | Listar con paginación y filtro |
| GET | `/:order_code` | Obtener orden por código |
| POST | `/issues/create` | Agregar falla a orden existente |
| POST | `/assign` | Asignar técnico |

### Order Services (`/orders-service`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/all` | Listar (filtro por orderId) |
| GET | `/:id` | Obtener por ID |
| GET | `/order/:order_id` | Servicios de una orden con sus fallas |
| POST | `/create` | Asignar servicio + resolver fallas |
| PUT | `/:id` | Actualizar precio/notas |
| DELETE | `/:id` | Eliminar (revierte fallas a PENDING) |

### Services Catalog (`/services`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Listar todos |
| GET | `/all` | Paginado con filtro |
| GET | `/:id` | Por ID |
| POST | `/` | Crear servicio |
| PUT | `/:id` | Actualizar |
| DELETE | `/:id` | Eliminar |
| POST | `/available` | Servicios disponibles para una orden |
| GET | `/order-types/list` | Tipos de orden (lista) |
| GET | `/order-types/all` | Tipos de orden (paginado) |
| POST | `/order-types` | Crear tipo de orden |
| GET | `/service-order-types/all` | Precios (paginado) |
| POST | `/service-order-types` | Crear precio |
| PUT | `/service-order-types/:id` | Actualizar precio |
| DELETE | `/service-order-types/:id` | Eliminar precio |

### Maintenance (`/maintenance`)
| Método | Ruta | Descripción |
|---|---|---|
| GET/POST/PUT/DELETE | `/failure-categories[/:id]` | CRUD categorías |
| GET/POST/PUT/DELETE | `/failure-codes[/:id]` | CRUD códigos de falla |
| GET/POST/PUT/DELETE | `/failure-severities[/:id]` | CRUD severidades |
| GET/POST/PUT/DELETE | `/repair-actions[/:id]` | CRUD acciones de reparación |

---

## Relaciones en QueryBuilder

Cuando se consulta una orden con sus issues y clasificación:
```typescript
.leftJoinAndSelect('order.issues', 'issues')
.leftJoinAndSelect('issues.failureCode', 'failureCode')
.leftJoinAndSelect('failureCode.severity', 'severity')
.leftJoinAndSelect('failureCode.category', 'category')
.leftJoinAndSelect('failureCode.deviceType', 'deviceType')
```

Cuando se consulta un OrderService con sus issues:
```typescript
.leftJoinAndSelect('os.issues', 'issue')
.leftJoinAndSelect('issue.failureCode', 'failureCode')
```

---

## Prohibiciones

- `OrderIssue` NO debe tener campos de clasificación duplicados (tipo, severidad, etc.) — eso viene de `FailureCode`.
- `OrderIssue.status` NO se cambia manualmente desde el controller — solo via lógica de `OrderServiceService`.
- `ServiceOrderType.failure_code_id` apunta a `FailureCode`, NO a `OrderIssue`.
- Los campos de `Service` son en inglés: `code`, `description`, `base_price`, `is_active`.
- Los campos de `OrderService` son en inglés: `price`, `estimated_minutes`, `notes`.
- Los campos de `ServiceOrderType` son en inglés: `price`, `estimated_minutes`, `is_active`, `failure_code_id`.
