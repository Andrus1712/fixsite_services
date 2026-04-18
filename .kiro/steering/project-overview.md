# FixSite Services – Project Overview

## Stack
- **Framework**: NestJS (Node.js)
- **ORM**: TypeORM
- **Database**: PostgreSQL (multi-tenant, una DB por tenant)
- **Auth**: JWT con cookies httpOnly (temp token → selección de tenant → full token)
- **WebSockets**: Socket.io via `@nestjs/websockets`
- **File Upload**: Multer via `@nestjs/platform-express`
- **Logging**: Winston via `nest-winston`
- **Lenguaje**: TypeScript

---

## Arquitectura Multi-Tenant

- Cada tenant tiene su propia base de datos PostgreSQL independiente con credenciales propias.
- `ConnectionDatabaseService` gestiona un pool de `DataSource` por tenant (inicializado al arrancar).
- Dos métodos para acceder a datos:
  - `getRepository(Entity, tenant)` → retorna `Repository<T>` directamente (preferido)
  - `getConnection(tenant)` → retorna el `DataSource` (cuando se necesita QueryRunner/transacciones)
- El tenant se resuelve por `TenantResolverMiddleware` (header `X-Tenant-ID` o subdomain) y se inyecta via `@CurrentTenant()`.
- Variables de entorno de la BD global en `.env`. Las credenciales de cada tenant se almacenan en la entidad `Tenant`.

---

## Flujo de Autenticación (JWT + Cookies)

1. `POST /auth/login` → establece cookie `access_token` con `type: 'temp'` (sin tenant, 24h)
2. `POST /auth/select-tenant` → actualiza cookie con `type: 'full'` + `tenantId` embebido
3. `POST /auth/switch-tenant` → cambia el `tenantId` en la cookie
4. `POST /auth/logout-tenant` → remueve `tenantId` de la cookie
5. `POST /auth/logout` → limpia la cookie completamente

### Guards disponibles
- `TenantSelectionGuard` → acepta tokens `temp` y `full` (usado en la mayoría de rutas)
- `FullTokenGuard` → solo acepta tokens `full`

### Configuración de cookies
- `httpOnly: true` — no accesible desde JS del cliente (protección XSS)
- `secure: true` — solo HTTPS en producción
- `sameSite: 'strict'` — protección CSRF

### Frontend: configuración requerida
```javascript
// Axios
axios.defaults.withCredentials = true;
// Fetch
fetch('/api/endpoint', { credentials: 'include' });
```

---

## Estructura de Carpetas

```
src/
├── common/
│   ├── decorators/       # @CurrentTenant(), @CurrentUser(), etc.
│   ├── dto/              # DTOs compartidos (PaginationQueryDto)
│   ├── filters/          # HttpExceptionFilter global
│   ├── interceptors/     # SerializeInterceptor, SqlContextInterceptor
│   ├── middleware/        # TenantResolverMiddleware
│   └── utils/            # ResponseUtil
├── config/               # Configuraciones tipadas (DB, cookies, logger)
├── database/             # ConnectionDatabaseService, init scripts
├── entities/
│   ├── branch/           # Entidades por tenant
│   └── global/           # Entidades globales (Tenant, User, Role, etc.)
└── modules/
    ├── auth/             # Login, registro, selección de tenant
    ├── customer/         # CRUD clientes
    ├── global/           # tenant/, user/, permission/ (DB global)
    ├── info-devices/     # Marcas, modelos y tipos de dispositivos
    ├── inventory/        # Módulo compuesto (ver detalle abajo)
    ├── log-events/       # Registro de eventos por orden
    ├── maintenance/      # failure-categories, failure-codes, failure-severities
    ├── order/            # Órdenes de servicio
    ├── order-service/    # Servicios asociados a una orden
    ├── realtime/         # WebSocket gateway + notificaciones + chat
    ├── services/         # Catálogo de servicios ofrecidos
    ├── technician/       # CRUD técnicos
    └── upload/           # Subida de archivos (Multer, sin guard de tenant)
```

---

## Módulo Inventory (estructura interna)

```
src/modules/inventory/
├── article/              # Artículos/repuestos
├── brand/                # Marcas de artículos
├── category/             # Categorías de artículos
├── inventory-adjustment/ # Ajustes de inventario
├── inventory-core/       # Consulta de stock actual + InventoryService base
├── material-issue/       # Egresos de material
├── material-receipt/     # Ingresos de material
├── provider/             # Proveedores
├── purchase-order/       # Órdenes de compra (NO generan movimientos)
├── stock-transfer/       # Transferencias entre almacenes
├── store/                # Almacenes (incluye StatsService para realtime)
└── Inventory.module.ts
```

---

## Módulo Realtime (WebSockets)

- Gateway: `RealtimeGateway` con Socket.io
- Rooms: `tenant:{id}`, `user:{id}`, `chat:{chatId}`
- Eventos: `join`, `leave`, `stats:request`, `stats:update`, `notification:new`, `chat:message`, `chat:typing`
- `RealtimeService` se puede inyectar en cualquier servicio para emitir notificaciones o stats
- CORS configurado para `FRONTEND_URL` (default: `http://localhost:5173`)

```typescript
// Emitir notificación desde cualquier servicio
this.realtimeService.sendNotification(tenantId, {
  id: uuid(), userId: 'user-id', // omitir userId para broadcast al tenant
  type: 'order:updated', title: 'Orden actualizada',
  body: 'La orden #123 cambió de estado', createdAt: new Date().toISOString(),
});

// Emitir stats actualizadas
await this.realtimeService.emitStats(tenantId);
```

---

## Módulo Upload

- `POST /upload/image` → imágenes (jpg, jpeg, png, gif, webp) — máx 5MB → `./uploads/images/`
- `POST /upload/document` → documentos (pdf, doc, docx, xls, xlsx, txt) — máx 10MB → `./uploads/documents/`
- `POST /upload/multiple` → múltiples archivos — máx 10 archivos, 5MB c/u
- **No requiere** `TenantSelectionGuard` ni middleware de tenant

---

## Entidades Globales (DB compartida)

`Tenant`, `User`, `Role`, `Permissions`, `Modules`, `Components`

---

## Entidades Branch (DB por tenant)

- **Órdenes**: `Order`, `OrderService`, `OrderStatus`, `OrderType`, `StatusHistory`, `Note`, `LogEvents`
- **Inventario**: `Inventory`, `Movement`, `MaterialReceipt`, `MaterialReceiptItem`, `MaterialIssue`, `MaterialIssueItem`, `StockTransfer`, `StockTransferItem`, `InventoryAdjustment`, `InventoryAdjustmentItem`, `PurchaseOrder`, `PurchaseOrderDetail`
- **Catálogo**: `Article`, `ArticleCategory`, `ArticleBrand`, `Provider`, `Store`, `Service`, `ServiceOrderType`
- **Clientes/Técnicos**: `Customer`, `Technician`
- **Dispositivos**: `Device`, `DeviceBrand`, `DeviceModel`, `DeviceType`, `PasswordType`
- **Mantenimiento**: `FailureCategory`, `FailureCode`, `FailureSeverity`, `RepairAction`
- **Otros**: `Issue`, `Part`, `Product`

---

## Variables de Entorno Requeridas

```env
NODE_ENV=development|production
FRONTEND_URL=http://localhost:5173
JWT_SECRET=tu_jwt_secret_aqui
GLOBAL_DB_HOST=localhost
GLOBAL_DB_PORT=5432
GLOBAL_DB_USERNAME=postgres
GLOBAL_DB_PASSWORD=password
GLOBAL_DB_DATABASE=fixsite_global
```
