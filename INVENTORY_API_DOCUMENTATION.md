# Documentación API - Sistema de Inventario

## Módulos Implementados

1. **InventoryService** - Servicio base para operaciones de inventario
2. **MaterialReceipt** - Recepción de material (Entradas)
3. **MaterialIssue** - Salida de material (Salidas con validación de stock)

---

## 1. MATERIAL RECEIPTS (Recepciones de Material)

### Base URL: `/material-receipts`

#### 1.1 GET `/material-receipts/all` - Listar Recepciones

**Parámetros Query:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 10)
- `filter` (opcional): Filtro por nombre de almacén

**Respuesta:**
```json
{
  "success": true,
  "message": "Recepciones de material consultadas correctamente",
  "data": [
    {
      "id": 1,
      "store_id": 1,
      "purchaseOrder_id": 5,
      "status": "DRAFT",
      "createdBy": "user123",
      "approvedBy": null,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "items": [
        {
          "id": 1,
          "article_id": 10,
          "quantity": 50,
          "unitCost": 25.50
        }
      ]
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

---

#### 1.2 GET `/material-receipts/:id` - Obtener Recepción por ID

**Parámetros:**
- `id` (path): ID de la recepción

**Respuesta:** Mismo formato que el listado, pero un solo objeto

---

#### 1.3 POST `/material-receipts/create` - Crear Recepción

**Parámetros Query:**
- `userId` (requerido): ID del usuario que crea

**Body:**
```json
{
  "store_id": 1,
  "purchaseOrder_id": 5,
  "items": [
    {
      "article_id": 10,
      "quantity": 50,
      "unitCost": 25.50
    },
    {
      "article_id": 11,
      "quantity": 30,
      "unitCost": 15.00
    }
  ]
}
```

**Validaciones:**
- `store_id`: Número positivo, requerido
- `purchaseOrder_id`: Número positivo, opcional
- `items`: Array con al menos 1 item
- `article_id`: Número positivo, requerido
- `quantity`: Número positivo, requerido
- `unitCost`: Número positivo, requerido

**Estado inicial:** DRAFT

---

#### 1.4 PATCH `/material-receipts/update/:id` - Actualizar Recepción

**Parámetros:**
- `id` (path): ID de la recepción

**Body:** Campos opcionales del create

**Restricción:** Solo se puede editar si status = DRAFT

---

#### 1.5 PATCH `/material-receipts/approve/:id` - Aprobar Recepción ⚡

**Parámetros:**
- `id` (path): ID de la recepción
- `userId` (query): ID del usuario que aprueba

**Lógica de Negocio:**
1. Cambia status a APPROVED
2. Por cada item:
   - Crea Movement(IN) con referenceType = 'MATERIAL_RECEIPT'
   - Suma quantity al Inventory (article_id, store_id)
3. Operación transaccional (todo o nada)

**Restricción:** Solo si status = DRAFT o PENDING

---

#### 1.6 PATCH `/material-receipts/reject/:id` - Rechazar Recepción

**Parámetros:**
- `id` (path): ID de la recepción
- `userId` (query): ID del usuario que rechaza

**Lógica:** Cambia status a REJECTED (no afecta inventario)

---

#### 1.7 PATCH `/material-receipts/cancel/:id` - Cancelar Recepción

**Parámetros:**
- `id` (path): ID de la recepción

**Lógica:** Cambia status a CANCELLED

**Restricción:** No se puede cancelar si ya está APPROVED

---

## 2. MATERIAL ISSUES (Salidas de Material)

### Base URL: `/material-issues`

#### 2.1 GET `/material-issues/all` - Listar Salidas

**Parámetros Query:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 10)
- `filter` (opcional): Filtro por nombre de almacén

**Respuesta:**
```json
{
  "success": true,
  "message": "Salidas de material consultadas correctamente",
  "data": [
    {
      "id": 1,
      "store_id": 1,
      "status": "APPROVED",
      "createdBy": "user123",
      "approvedBy": "user456",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "items": [
        {
          "id": 1,
          "article_id": 10,
          "quantity": 20,
          "destinationReference": "service_order_123"
        }
      ]
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

---

#### 2.2 GET `/material-issues/:id` - Obtener Salida por ID

**Parámetros:**
- `id` (path): ID de la salida

---

#### 2.3 POST `/material-issues/create` - Crear Salida

**Parámetros Query:**
- `userId` (requerido): ID del usuario que crea

**Body:**
```json
{
  "store_id": 1,
  "items": [
    {
      "article_id": 10,
      "quantity": 20,
      "destinationReference": "service_order_123"
    },
    {
      "article_id": 11,
      "quantity": 5,
      "destinationReference": "disposal"
    }
  ]
}
```

**Validaciones:**
- `store_id`: Número positivo, requerido
- `items`: Array con al menos 1 item
- `article_id`: Número positivo, requerido
- `quantity`: Número positivo, requerido
- `destinationReference`: String, opcional

**Estado inicial:** DRAFT

---

#### 2.4 PATCH `/material-issues/update/:id` - Actualizar Salida

**Parámetros:**
- `id` (path): ID de la salida

**Body:** Campos opcionales del create

**Restricción:** Solo se puede editar si status = DRAFT

---

#### 2.5 PATCH `/material-issues/approve/:id` - Aprobar Salida ⚡🔒

**Parámetros:**
- `id` (path): ID de la salida
- `userId` (query): ID del usuario que aprueba

**Lógica de Negocio:**
1. **VALIDA STOCK DISPONIBLE** para cada item
   - Si no hay stock suficiente → Error 400
2. Cambia status a APPROVED
3. Por cada item:
   - Crea Movement(OUT) con referenceType = 'MATERIAL_ISSUE'
   - Resta quantity del Inventory (article_id, store_id)
4. Operación transaccional (todo o nada)

**Restricción:** Solo si status = DRAFT o PENDING

**Ejemplo de Error:**
```json
{
  "success": false,
  "message": "Stock insuficiente para artículo 10. Disponible: 15, Requerido: 20"
}
```

---

#### 2.6 PATCH `/material-issues/reject/:id` - Rechazar Salida

**Parámetros:**
- `id` (path): ID de la salida
- `userId` (query): ID del usuario que rechaza

**Lógica:** Cambia status a REJECTED (no afecta inventario)

---

#### 2.7 PATCH `/material-issues/cancel/:id` - Cancelar Salida

**Parámetros:**
- `id` (path): ID de la salida

**Lógica:** Cambia status a CANCELLED

**Restricción:** No se puede cancelar si ya está APPROVED

---

## 3. ESTADOS DEL SISTEMA

### Estados de MaterialReceipt y MaterialIssue:

| Estado | Descripción | Puede Editar | Puede Aprobar | Puede Rechazar | Afecta Inventario |
|--------|-------------|--------------|---------------|----------------|-------------------|
| **DRAFT** | Borrador inicial | ✅ Sí | ✅ Sí | ✅ Sí | ❌ No |
| **PENDING** | Pendiente de aprobación | ❌ No | ✅ Sí | ✅ Sí | ❌ No |
| **APPROVED** | Aprobado | ❌ No | ❌ No | ❌ No | ✅ **SÍ** |
| **REJECTED** | Rechazado | ❌ No | ❌ No | ❌ No | ❌ No |
| **CANCELLED** | Cancelado | ❌ No | ❌ No | ❌ No | ❌ No |

---

## 4. FLUJO DE INVENTARIO

### Recepción de Material (Entrada):
```
1. POST /material-receipts/create → status: DRAFT
2. PATCH /material-receipts/update/:id (opcional)
3. PATCH /material-receipts/approve/:id
   ↓
   - Crea Movement(IN)
   - Inventory.quantity += item.quantity
   - status: APPROVED
```

### Salida de Material (Salida):
```
1. POST /material-issues/create → status: DRAFT
2. PATCH /material-issues/update/:id (opcional)
3. PATCH /material-issues/approve/:id
   ↓
   - Valida stock disponible ⚠️
   - Crea Movement(OUT)
   - Inventory.quantity -= item.quantity
   - status: APPROVED
```

---

## 5. REGLAS DE NEGOCIO CRÍTICAS

### ✅ Invariantes del Sistema:

1. **Inventario solo cambia con aprobaciones**
   - Crear/editar NO afecta inventario
   - Solo APPROVE modifica stock

2. **Movimientos son inmutables**
   - Se crean automáticamente al aprobar
   - NUNCA se editan o eliminan

3. **Operaciones son transaccionales**
   - Si falla algo, se revierte todo
   - Garantiza consistencia

4. **Validación de stock en salidas**
   - Antes de aprobar MaterialIssue
   - Error si stock insuficiente

5. **Auditoría completa**
   - createdBy: quién creó
   - approvedBy: quién aprobó
   - Timestamps automáticos

---

## 6. SERVICIOS COMPARTIDOS

### InventoryService (Uso Interno)

Métodos disponibles para otros módulos:

```typescript
// Actualizar stock (en transacción)
updateStock(queryRunner, tenant, article_id, store_id, quantity, operation)
  - operation: 'ADD' | 'SUBTRACT' | 'SET'

// Validar stock disponible
validateStock(tenant, article_id, store_id, requiredQuantity): boolean

// Obtener stock actual
getStock(tenant, article_id, store_id): number

// Crear movimiento (inmutable)
createMovement(queryRunner, tenant, data)
```

---

## 7. EJEMPLOS DE USO

### Ejemplo 1: Recibir material de una compra

```bash
# 1. Crear recepción
POST /material-receipts/create?userId=user123
{
  "store_id": 1,
  "purchaseOrder_id": 5,
  "items": [
    { "article_id": 10, "quantity": 100, "unitCost": 25.50 }
  ]
}

# 2. Aprobar (genera Movement IN y actualiza Inventory)
PATCH /material-receipts/approve/1?userId=user456
```

### Ejemplo 2: Salida de material para reparación

```bash
# 1. Crear salida
POST /material-issues/create?userId=user123
{
  "store_id": 1,
  "items": [
    { 
      "article_id": 10, 
      "quantity": 5, 
      "destinationReference": "service_order_789" 
    }
  ]
}

# 2. Aprobar (valida stock, genera Movement OUT y actualiza Inventory)
PATCH /material-issues/approve/1?userId=user456
```

---

## 8. CÓDIGOS DE ERROR

| Código | Mensaje | Causa |
|--------|---------|-------|
| 400 | Solo se pueden editar en estado DRAFT | Intentar editar documento aprobado |
| 400 | Solo se pueden aprobar en estado DRAFT o PENDING | Estado inválido para aprobar |
| 400 | Stock insuficiente | No hay suficiente inventario para salida |
| 400 | No se pueden cancelar recepciones aprobadas | Intentar cancelar documento aprobado |
| 404 | Recepción/Salida no encontrada | ID no existe |

---

## 9. NOTAS IMPORTANTES

⚠️ **Autenticación:** Todos los endpoints requieren TenantSelectionGuard

⚠️ **Transacciones:** Las aprobaciones usan transacciones de base de datos

⚠️ **Inmutabilidad:** Los movimientos NUNCA se modifican después de crearse

⚠️ **Consistencia:** Si falla cualquier paso en la aprobación, se revierte todo

✅ **Auditoría:** Todos los cambios quedan registrados con usuario y fecha


---

## 3. PROVIDERS (Proveedores)

### Base URL: `/providers`

#### 3.1 GET `/providers/all` - Listar Proveedores
#### 3.2 GET `/providers/:id` - Obtener Proveedor
#### 3.3 POST `/providers/create` - Crear Proveedor

**Body:**
```json
{
  "name": "Proveedor ABC",
  "contact_info": "contacto@proveedor.com | 555-1234"
}
```

#### 3.4 PATCH `/providers/update/:id` - Actualizar Proveedor
#### 3.5 DELETE `/providers/delete/:id` - Eliminar Proveedor

---

## 4. PURCHASE ORDERS (Órdenes de Compra)

### Base URL: `/purchase-orders`

**IMPORTANTE:** Las órdenes de compra NO generan movimientos de inventario. Son solo intenciones de compra.

#### 4.1 POST `/purchase-orders/create` - Crear Orden

**Body:**
```json
{
  "provider_id": 1,
  "date": "2024-01-15",
  "details": [
    {
      "article_id": 10,
      "quantity": 100,
      "unitCost": 25.50
    }
  ]
}
```

**Estados:** DRAFT → SENT → CLOSED / CANCELLED

#### 4.2 PATCH `/purchase-orders/send/:id` - Enviar Orden
#### 4.3 PATCH `/purchase-orders/close/:id` - Cerrar Orden
#### 4.4 PATCH `/purchase-orders/cancel/:id` - Cancelar Orden

---

## 5. STOCK TRANSFERS (Transferencias entre Almacenes)

### Base URL: `/stock-transfers`

#### 5.1 POST `/stock-transfers/create` - Crear Transferencia

**Body:**
```json
{
  "fromStore_id": 1,
  "toStore_id": 2,
  "items": [
    {
      "article_id": 10,
      "quantity": 20
    }
  ]
}
```

**Validaciones:**
- `fromStore_id` ≠ `toStore_id`
- Stock disponible en almacén origen

#### 5.2 PATCH `/stock-transfers/approve/:id` - Aprobar Transferencia ⚡🔒

**Lógica de Negocio:**
1. **VALIDA STOCK** en almacén origen
2. Cambia status a APPROVED
3. Por cada item:
   - Crea Movement(OUT) en fromStore
   - Resta quantity del Inventory origen
   - Crea Movement(IN) en toStore
   - Suma quantity al Inventory destino
4. Operación transaccional atómica

**Restricción:** Solo si status = DRAFT o PENDING

---

## 6. INVENTORY ADJUSTMENTS (Ajustes de Inventario)

### Base URL: `/inventory-adjustments`

#### 6.1 POST `/inventory-adjustments/create` - Crear Ajuste

**Body:**
```json
{
  "store_id": 1,
  "reason": "Conteo físico - diferencias encontradas",
  "items": [
    {
      "article_id": 10,
      "currentQuantity": 50,
      "newQuantity": 48
    },
    {
      "article_id": 11,
      "currentQuantity": 30,
      "newQuantity": 35
    }
  ]
}
```

**Validaciones:**
- `reason`: Obligatorio (explicar motivo del ajuste)
- `currentQuantity`: Cantidad actual en sistema
- `newQuantity`: Cantidad real después del conteo
- `difference`: Se calcula automáticamente (newQuantity - currentQuantity)

#### 6.2 PATCH `/inventory-adjustments/approve/:id` - Aprobar Ajuste ⚡

**Lógica de Negocio:**
1. Cambia status a APPROVED
2. Por cada item:
   - Si difference > 0: Crea Movement(IN)
   - Si difference < 0: Crea Movement(OUT)
   - Si difference = 0: No crea movimiento
   - Establece Inventory.quantity = newQuantity
3. Operación transaccional

**Ejemplo:**
- Artículo 10: 50 → 48 (difference: -2) → Movement OUT de 2 unidades
- Artículo 11: 30 → 35 (difference: +5) → Movement IN de 5 unidades

---

## 7. FLUJOS COMPLETOS DEL SISTEMA

### Flujo 1: Compra de Material
```
1. POST /purchase-orders/create (DRAFT)
2. PATCH /purchase-orders/send/:id (SENT)
3. POST /material-receipts/create (DRAFT) - vincular con PO
4. PATCH /material-receipts/approve/:id
   → Genera Movement(IN)
   → Actualiza Inventory
5. PATCH /purchase-orders/close/:id (CLOSED)
```

### Flujo 2: Salida para Reparación
```
1. POST /material-issues/create (DRAFT)
2. PATCH /material-issues/approve/:id
   → Valida stock
   → Genera Movement(OUT)
   → Actualiza Inventory
```

### Flujo 3: Transferencia entre Almacenes
```
1. POST /stock-transfers/create (DRAFT)
2. PATCH /stock-transfers/approve/:id
   → Valida stock origen
   → Genera Movement(OUT) en origen
   → Genera Movement(IN) en destino
   → Actualiza ambos Inventory
```

### Flujo 4: Ajuste por Conteo Físico
```
1. Realizar conteo físico
2. POST /inventory-adjustments/create (DRAFT)
   - Incluir currentQuantity (sistema)
   - Incluir newQuantity (conteo real)
3. PATCH /inventory-adjustments/approve/:id
   → Genera Movement(IN/OUT) según diferencia
   → Establece Inventory = newQuantity
```

---

## 8. TABLA DE REFERENCIA DE MOVIMIENTOS

| Operación | Movement Type | referenceType | Afecta Inventory |
|-----------|---------------|---------------|------------------|
| MaterialReceipt APPROVED | IN | MATERIAL_RECEIPT | ✅ Suma |
| MaterialIssue APPROVED | OUT | MATERIAL_ISSUE | ✅ Resta |
| StockTransfer APPROVED (origen) | OUT | STOCK_TRANSFER | ✅ Resta |
| StockTransfer APPROVED (destino) | IN | STOCK_TRANSFER | ✅ Suma |
| InventoryAdjustment APPROVED (positivo) | IN | INVENTORY_ADJUSTMENT | ✅ Suma |
| InventoryAdjustment APPROVED (negativo) | OUT | INVENTORY_ADJUSTMENT | ✅ Resta |

---

## 9. ESTADOS Y TRANSICIONES

### MaterialReceipt, MaterialIssue, StockTransfer:
```
DRAFT → PENDING → APPROVED ✓
              ↓
           REJECTED ✗
              ↓
         CANCELLED ✗
```

### InventoryAdjustment:
```
DRAFT → PENDING → APPROVED ✓
              ↓
           REJECTED ✗
```

### PurchaseOrder:
```
DRAFT → SENT → CLOSED ✓
           ↓
      CANCELLED ✗
```

---

## 10. VALIDACIONES CRÍTICAS POR MÓDULO

### MaterialReceipt:
- ✅ Puede crear sin PurchaseOrder
- ✅ PurchaseOrder es opcional e informativo
- ✅ Siempre genera Movement(IN) al aprobar

### MaterialIssue:
- 🔒 **VALIDA STOCK** antes de aprobar
- ✅ Genera Movement(OUT) al aprobar
- ❌ Error si stock insuficiente

### StockTransfer:
- 🔒 **VALIDA STOCK** en origen antes de aprobar
- ✅ Genera 2 Movements (OUT + IN)
- ❌ fromStore ≠ toStore
- ⚡ Operación atómica (todo o nada)

### InventoryAdjustment:
- ✅ Requiere reason obligatorio
- ✅ Calcula difference automáticamente
- ✅ Genera Movement según signo de difference
- ✅ Establece cantidad exacta (SET)

### PurchaseOrder:
- ❌ **NO genera movimientos**
- ✅ Solo intención de compra
- ✅ Puede vincularse a MaterialReceipt

---

## 11. RESUMEN DE ENDPOINTS

| Módulo | Endpoints | Afecta Inventario |
|--------|-----------|-------------------|
| **Provider** | CRUD básico | ❌ No |
| **PurchaseOrder** | CRUD + estados | ❌ No |
| **MaterialReceipt** | CRUD + approve/reject/cancel | ✅ Sí (approve) |
| **MaterialIssue** | CRUD + approve/reject/cancel | ✅ Sí (approve) |
| **StockTransfer** | CRUD + approve/reject/cancel | ✅ Sí (approve) |
| **InventoryAdjustment** | CRUD + approve/reject | ✅ Sí (approve) |
| **Inventory** | Solo lectura | ✅ Actualización automática |
| **Movement** | Solo lectura | ✅ Creación automática |

---

## 12. CÓDIGOS DE ERROR ADICIONALES

| Código | Mensaje | Módulo |
|--------|---------|--------|
| 400 | El almacén origen y destino no pueden ser el mismo | StockTransfer |
| 400 | Stock insuficiente en almacén origen | StockTransfer |
| 400 | Solo se pueden eliminar órdenes en estado DRAFT | PurchaseOrder |
| 400 | Solo se pueden editar ajustes en estado DRAFT | InventoryAdjustment |

---

## 13. EJEMPLOS COMPLETOS

### Ejemplo 1: Compra completa de material
```bash
# 1. Crear orden de compra
POST /purchase-orders/create
{
  "provider_id": 1,
  "date": "2024-01-15",
  "details": [
    { "article_id": 10, "quantity": 100, "unitCost": 25.50 }
  ]
}
# Response: { id: 5, status: "DRAFT" }

# 2. Enviar orden al proveedor
PATCH /purchase-orders/send/5
# Response: { id: 5, status: "SENT" }

# 3. Recibir material
POST /material-receipts/create?userId=user123
{
  "store_id": 1,
  "purchaseOrder_id": 5,
  "items": [
    { "article_id": 10, "quantity": 100, "unitCost": 25.50 }
  ]
}
# Response: { id: 1, status: "DRAFT" }

# 4. Aprobar recepción (GENERA MOVEMENT + ACTUALIZA INVENTORY)
PATCH /material-receipts/approve/1?userId=user456
# Response: { id: 1, status: "APPROVED" }
# Resultado: Inventory[article:10, store:1].quantity += 100

# 5. Cerrar orden de compra
PATCH /purchase-orders/close/5
# Response: { id: 5, status: "CLOSED" }
```

### Ejemplo 2: Transferencia entre almacenes
```bash
# 1. Crear transferencia
POST /stock-transfers/create?userId=user123
{
  "fromStore_id": 1,
  "toStore_id": 2,
  "items": [
    { "article_id": 10, "quantity": 20 }
  ]
}

# 2. Aprobar (VALIDA STOCK + GENERA 2 MOVEMENTS + ACTUALIZA 2 INVENTORIES)
PATCH /stock-transfers/approve/1?userId=user456
# Resultado:
# - Inventory[article:10, store:1].quantity -= 20
# - Inventory[article:10, store:2].quantity += 20
# - Movement OUT en store 1
# - Movement IN en store 2
```

### Ejemplo 3: Ajuste por conteo físico
```bash
# 1. Realizar conteo físico y crear ajuste
POST /inventory-adjustments/create?userId=user123
{
  "store_id": 1,
  "reason": "Conteo físico mensual - enero 2024",
  "items": [
    {
      "article_id": 10,
      "currentQuantity": 50,
      "newQuantity": 48
    }
  ]
}

# 2. Aprobar ajuste
PATCH /inventory-adjustments/approve/1?userId=user456
# Resultado:
# - difference = 48 - 50 = -2
# - Movement OUT de 2 unidades
# - Inventory[article:10, store:1].quantity = 48
```

---

## 14. ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────────┐
│                  BUSINESS ENTITIES                       │
│  (Generan movimientos al aprobar)                       │
├─────────────────────────────────────────────────────────┤
│  MaterialReceipt  │  MaterialIssue  │  StockTransfer   │
│  InventoryAdjustment                                    │
└──────────────────┬──────────────────────────────────────┘
                   │ approve()
                   ↓
┌─────────────────────────────────────────────────────────┐
│              INVENTORY CORE SERVICE                      │
│  (Servicio compartido transaccional)                    │
├─────────────────────────────────────────────────────────┤
│  • createMovement()                                     │
│  • updateStock()                                        │
│  • validateStock()                                      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│                 TRUTH ENTITIES                           │
│  (Solo lectura desde API, escritura automática)         │
├─────────────────────────────────────────────────────────┤
│  Movement (inmutable)  │  Inventory (derivado)          │
└─────────────────────────────────────────────────────────┘
```

---

## 15. CHECKLIST DE IMPLEMENTACIÓN ✅

- ✅ InventoryService (base transaccional)
- ✅ MaterialReceipt (entradas)
- ✅ MaterialIssue (salidas con validación)
- ✅ Provider (catálogo)
- ✅ PurchaseOrder (intenciones de compra)
- ✅ StockTransfer (transferencias)
- ✅ InventoryAdjustment (ajustes manuales)
- ✅ Entidades StockTransfer + StockTransferItem
- ✅ Entidades InventoryAdjustment + InventoryAdjustmentItem
- ✅ Validaciones de stock
- ✅ Operaciones transaccionales
- ✅ Movimientos inmutables
- ✅ Auditoría completa

---

## 16. PRÓXIMOS PASOS OPCIONALES

1. **Movement API** (solo lectura)
   - GET /movements/all
   - GET /movements/:id
   - Filtros por tipo, artículo, almacén, fecha

2. **Inventory API** (solo lectura)
   - GET /inventory/all
   - GET /inventory/:id
   - GET /inventory/by-article/:articleId
   - GET /inventory/by-store/:storeId
   - Alertas de stock mínimo

3. **Reportes**
   - Kardex por artículo
   - Movimientos por período
   - Stock valorizado
   - Artículos bajo stock mínimo

4. **Devoluciones**
   - MaterialReturn (como MaterialReceipt especial)

---

**Sistema de Inventario Completo - Implementado según inventory-rules.md** ✅
