# FixSite – Dominio de Inventario

## Reglas Invariantes (No Negociables)

- El stock SOLO cambia a través de movimientos aprobados.
- El inventario NUNCA se edita manualmente.
- Los movimientos son inmutables y auditables.
- Todas las operaciones que afectan inventario DEBEN ser transaccionales.
- Las entidades de negocio generan movimientos; los movimientos no contienen lógica de negocio.
- `PurchaseOrder` NUNCA genera movimientos — es solo una intención de compra.
- `Movement.type` SOLO puede ser `IN` o `OUT` (no ADJUSTMENT, TRANSFER, RETURN, etc.).

---

## Entidades de Catálogo (No afectan inventario)

- `Article` — repuesto o ítem de reemplazo
- `ArticleCategory` — clasificación jerárquica (self-reference)
- `ArticleBrand` — fabricante o marca
- `Provider` — proveedor externo, tiene muchas `PurchaseOrder`
- `Store` — ubicación física o lógica donde existe inventario

---

## Entidades de Verdad de Inventario

### Inventory
- Representa stock actual por `(Article, Store)`.
- Derivado exclusivamente de `Movement`.
- NUNCA se edita directamente.

### Movement
- Transacción inmutable de inventario.
- Campos: `type (IN|OUT)`, `article`, `store`, `quantity`, `referenceType`, `referenceId`, `createdAt`
- Se crea SOLO cuando una entidad de negocio es APROBADA.
- NUNCA se actualiza ni elimina.

---

## Estados y Transiciones

### MaterialReceipt, MaterialIssue, StockTransfer
```
DRAFT → PENDING → APPROVED ✓
              ↓
           REJECTED ✗
DRAFT/PENDING → CANCELLED ✗ (no si ya está APPROVED)
```

### InventoryAdjustment
```
DRAFT → PENDING → APPROVED ✓
              ↓
           REJECTED ✗
```

### PurchaseOrder
```
DRAFT → SENT → CLOSED ✓
           ↓
      CANCELLED ✗
```

---

## Caso 1: Material Receipt (Ingreso)

**Ruta base:** `/material-receipts`

| Endpoint | Descripción |
|---|---|
| `GET /all` | Listar con paginación y filtro |
| `GET /:id` | Obtener por ID |
| `POST /create?userId=` | Crear (estado inicial: DRAFT) |
| `PATCH /update/:id` | Editar (solo en DRAFT) |
| `PATCH /approve/:id?userId=` | Aprobar → genera Movement(IN) |
| `PATCH /reject/:id?userId=` | Rechazar |
| `PATCH /cancel/:id` | Cancelar (no si APPROVED) |

**Al aprobar:** por cada `MaterialReceiptItem` → `Movement(IN)` con `referenceType = MATERIAL_RECEIPT`

**Reglas:**
- `PurchaseOrder` es opcional e informativo
- Siempre genera `Movement(IN)` al aprobar

---

## Caso 2: Material Issue (Egreso)

**Ruta base:** `/material-issues`

| Endpoint | Descripción |
|---|---|
| `GET /all` | Listar con paginación y filtro |
| `GET /:id` | Obtener por ID |
| `POST /create?userId=` | Crear (estado inicial: DRAFT) |
| `PATCH /update/:id` | Editar (solo en DRAFT) |
| `PATCH /approve/:id?userId=` | Aprobar → valida stock → genera Movement(OUT) |
| `PATCH /reject/:id?userId=` | Rechazar |
| `PATCH /cancel/:id` | Cancelar (no si APPROVED) |

**Al aprobar:**
1. **VALIDA STOCK** disponible — error 400 si insuficiente
2. Por cada `MaterialIssueItem` → `Movement(OUT)` con `referenceType = MATERIAL_ISSUE`

---

## Caso 3: Stock Transfer (Transferencia entre almacenes)

**Ruta base:** `/stock-transfers`

**Al aprobar:** por cada item genera DOS movimientos:
1. `Movement(OUT)` en `fromStore`
2. `Movement(IN)` en `toStore`

Ambos comparten el mismo `referenceId`. Operación atómica (todo o nada).

**Reglas:**
- `fromStore_id` ≠ `toStore_id`
- Valida stock en almacén origen antes de aprobar

---

## Caso 4: Inventory Adjustment (Ajuste manual)

**Ruta base:** `/inventory-adjustments`

**Al aprobar:** por cada item:
- Si `difference > 0` → `Movement(IN)`
- Si `difference < 0` → `Movement(OUT)`
- Si `difference = 0` → no crea movimiento
- `difference = newQuantity - currentQuantity`
- `referenceType = INVENTORY_ADJUSTMENT`

**Reglas:**
- `reason` es obligatorio
- Establece la cantidad exacta (`SET`)

---

## Tabla de Referencia de Movimientos

| Operación | Movement.type | referenceType | Efecto en Inventory |
|---|---|---|---|
| MaterialReceipt APPROVED | IN | MATERIAL_RECEIPT | += quantity |
| MaterialIssue APPROVED | OUT | MATERIAL_ISSUE | -= quantity |
| StockTransfer APPROVED (origen) | OUT | STOCK_TRANSFER | -= quantity |
| StockTransfer APPROVED (destino) | IN | STOCK_TRANSFER | += quantity |
| InventoryAdjustment APPROVED (diff > 0) | IN | INVENTORY_ADJUSTMENT | += diff |
| InventoryAdjustment APPROVED (diff < 0) | OUT | INVENTORY_ADJUSTMENT | -= diff |

---

## InventoryService (Uso Interno)

Métodos disponibles para otros módulos (requieren `QueryRunner` para transacciones):

```typescript
updateStock(queryRunner, tenant, article_id, store_id, quantity, operation)
  // operation: 'ADD' | 'SUBTRACT' | 'SET'

validateStock(tenant, article_id, store_id, requiredQuantity): Promise<boolean>

getStock(tenant, article_id, store_id): Promise<number>

createMovement(queryRunner, tenant, data): Promise<Movement>
```

---

## Flujos Completos

### Compra de material
```
POST /purchase-orders/create (DRAFT)
→ PATCH /purchase-orders/send/:id (SENT)
→ POST /material-receipts/create (DRAFT, vincular PO)
→ PATCH /material-receipts/approve/:id → Movement(IN) + Inventory++
→ PATCH /purchase-orders/close/:id (CLOSED)
```

### Salida para reparación
```
POST /material-issues/create (DRAFT)
→ PATCH /material-issues/approve/:id → valida stock → Movement(OUT) + Inventory--
```

### Transferencia entre almacenes
```
POST /stock-transfers/create (DRAFT)
→ PATCH /stock-transfers/approve/:id
  → valida stock origen
  → Movement(OUT) en origen + Movement(IN) en destino
  → Inventory origen-- + Inventory destino++
```

### Ajuste por conteo físico
```
POST /inventory-adjustments/create (DRAFT, con reason + currentQuantity + newQuantity)
→ PATCH /inventory-adjustments/approve/:id
  → Movement(IN/OUT) según diferencia
  → Inventory = newQuantity
```

---

## Prohibiciones Explícitas

- `PurchaseOrder` NO debe generar movimientos
- `Movement.type` NO debe incluir ADJUSTMENT, TRANSFER, RETURN, etc.
- El inventario NO debe recalcularse desde input del usuario
- El significado de negocio NO debe inferirse solo desde `Movement`
