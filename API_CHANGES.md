# FixSite API – Cambios de Interfaz (Refactoring)

> Documento para el equipo frontend. Actualizar todas las interfaces TypeScript y llamadas a la API según estos cambios.

---

## Resumen de cambios

| Entidad | Qué cambió |
|---|---|
| `OrderIssue` | Campos simplificados, tabla renombrada |
| `Service` | Campos a inglés |
| `ServiceOrderType` | Campos a inglés, `issue_id → failure_code_id` |
| `OrderService` | Campos a inglés, tabla renombrada |
| `AvailableServices` | Body `orderServiceIds → orderIssueIds` |

---

## 1. OrderIssue (falla reportada en una orden)

### Campos eliminados (ya no existen en la API)
```
issue_type, issue_type_description
issue_severity, issue_severity_description
issue_reproducibility, issue_reproducibility_description
issue_frequency, issue_frequency_description
issue_impact, issue_impact_description
issue_difficulty, issue_difficulty_description
issue_priority, issue_priority_description
issue_urgency, issue_urgency_description
issue_detection, issue_detection_description
issue_reported_time
issue_environment
issue_tags
issue_custom_fields
issue_related_orders
issue_screenshots
issue_videos
issue_logs
```

### Campos renombrados
| Antes | Ahora |
|---|---|
| `issue_name` | `title` |
| `issue_description` | `description` |
| `issue_code_id` | `failure_code_id` |
| `issue_additional_info` + `issue_additional_notes` | `additional_notes` (unificado) |
| `issue_screenshots` + `issue_videos` + `issue_logs` + `issue_attachments` + `issue_files` | `attachments` (array unificado) |
| `issue_steps_to_reproduce` | `steps_to_reproduce` |
| `issue_reported_by` | `reported_by` |
| `issue_reported_date` | `reported_date` |

### Campos en respuesta (IssueResponseDto)
| Antes | Ahora |
|---|---|
| `failure_codes_id` | `failure_code_id` |
| `failure_codes_code` | `failure_code` |
| `failure_codes_name` | `failure_code_name` |
| `failure_codes_description` | `failure_code_description` |
| `failure_severities_name` | `severity` |
| `failure_categories_name` | `category` |
| `device_types_name` | `device_type` |

### Interfaz TypeScript actualizada
```typescript
interface OrderIssue {
  id: number;
  title: string;
  description: string;
  additional_notes?: string;
  attachments?: string[];
  steps_to_reproduce?: string[];
  reported_by?: string;
  reported_date?: string;
  // Clasificación (desde FailureCode)
  failure_code_id?: number;
  failure_code?: string;        // código ej: "SCR-001"
  failure_code_name?: string;
  failure_code_description?: string;
  severity?: string;            // nombre de FailureSeverity
  category?: string;            // nombre de FailureCategory
  device_type?: string;         // nombre de DeviceType
  // Estado
  status: 'PENDING' | 'RESOLVED' | 'REJECTED';
  is_resolved: boolean;
}
```

### Body para crear/agregar issue
```typescript
// POST /orders/create  →  campo "issues" en el body
// POST /orders/issues/create
interface CreateOrderIssueBody {
  order_id: number;             // solo en /orders/issues/create
  title: string;
  description: string;
  failure_code_id?: number;
  additional_notes?: string;
  steps_to_reproduce?: string[];
  reported_by?: string;
  attachments?: Array<{
    filename: string;
    originalName: string;
    size: string;
    url: string;
  }>;
}
```

---

## 2. Service (catálogo de servicios)

### Campos renombrados
| Antes | Ahora |
|---|---|
| `codigo` | `code` |
| `descripcion` | `description` |
| `precio_base` | `base_price` |
| `activo` | `is_active` |

### Interfaz TypeScript actualizada
```typescript
interface Service {
  id: number;
  code: string;
  description: string;
  base_price: number;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateServiceBody {
  code: string;
  description: string;
  base_price: number;
  is_active?: boolean;
}
```

---

## 3. ServiceOrderType (catálogo de precios)

### Campos renombrados
| Antes | Ahora |
|---|---|
| `issueId` / `issue_id` | `failure_code_id` |
| `precio` | `price` |
| `tiempoEstimadoMinutos` | `estimated_minutes` |
| `activo` | `is_active` |
| `serviceId` | `service_id` |
| `orderTypeId` | `order_type_id` |

### Interfaz TypeScript actualizada
```typescript
interface ServiceOrderType {
  id: number;
  service: Service;
  orderType: OrderType;
  failureCode?: FailureCode;    // null = aplica a cualquier falla
  price: number;
  estimatedMinutes: number;
  is_active: boolean;
}

interface CreateServiceOrderTypeBody {
  service_id: number;
  order_type_id: number;
  failure_code_id?: number;     // opcional
  price: number;
  estimated_minutes: number;
  is_active?: boolean;
}
```

### Respuesta de GET /services/available (CAMBIO IMPORTANTE)
```typescript
// Body del POST (ANTES)
{ orderTypeId: 1, orderServiceIds: [1, 2], orderId: 1 }

// Body del POST (AHORA)
{ orderTypeId: 1, orderIssueIds: [1, 2], orderId: 1 }
//                 ^^^^^^^^^^^^^ IDs de OrderIssue (fallas), no de OrderService

interface AvailableServiceItem {
  service_id: number;
  code: string;           // antes: codigo
  description: string;    // antes: descripcion
  base_price: number;     // antes: precio_base
  order_type_id: number;
  order_type_name: string; // antes: order_type_nombre
  price: number;           // antes: precio
  estimatedMinutes: number;
  failure_code: {          // antes: issue (con campos issue_name, issue_type, etc.)
    id: number;
    code: string;
    name: string;
    description: string;
  } | null;
}
```

---

## 4. OrderService (servicio aplicado a una orden)

### Campos renombrados
| Antes | Ahora |
|---|---|
| `precio` | `price` |
| `tiempo_estimado_minutos` | `estimated_minutes` |
| `notas` | `notes` |
| `issues_ids` (body) | `issue_ids` (body) |

### Interfaz TypeScript actualizada
```typescript
interface OrderService {
  id: number;
  order_id: number;
  service_id: number;
  service: Service;
  price: number;
  estimated_minutes: number;
  notes?: string;
  issues: OrderIssue[];   // fallas que este servicio resuelve
  createdAt: string;
  updatedAt: string;
}

interface CreateOrderServiceBody {
  order_id: number;
  service_id: number;
  issue_ids?: number[];   // antes: issues_ids — IDs de OrderIssue a resolver
  price?: number;
  estimated_minutes?: number;
  notes?: string;
}

// Respuesta de GET /orders-service/order/:order_id
interface OrderServiceWithIssues extends OrderService {
  issues: Array<{
    id: number;
    title: string;          // antes: issue_name
    description: string;    // antes: issue_description
    status: 'PENDING' | 'RESOLVED' | 'REJECTED';
    is_resolved: boolean;
    failure_code: string | null;       // código ej: "SCR-001"
    failure_code_name: string | null;
  }>;
}
```

---

## 5. Enum OrderIssueStatus

```typescript
// Antes: OrderIssuesStatus (con 's')
// Ahora: OrderIssueStatus (sin 's')
type OrderIssueStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';
```

---

## 6. Flujo completo actualizado

```
1. Crear orden con fallas:
   POST /orders/create
   body.issues[].title, body.issues[].failure_code_id

2. Ver fallas pendientes de la orden:
   GET /orders/:order_code
   response.issues[] → filtrar por status === 'PENDING'

3. Buscar servicios disponibles para esas fallas:
   POST /services/available
   body: { orderTypeId, orderIssueIds: [id1, id2], orderId }

4. Asignar servicio que resuelve las fallas:
   POST /orders-service/create
   body: { order_id, service_id, issue_ids: [id1, id2], price, estimated_minutes }
   → Los issues pasan automáticamente a RESOLVED

5. Ver servicios aplicados a la orden:
   GET /orders-service/order/:order_id
```
