# Inventory System – Domain Rules & Movement Flows

## 0. Core Invariants (Non-Negotiable)

- Inventory stock MUST ONLY change through approved movements.
- Inventory MUST NEVER be edited manually.
- Movements are immutable and auditable.
- All inventory-affecting operations MUST be transactional.
- Business cases generate movements; movements do not contain business logic.

---

## 1. Catalog Entities (Do NOT affect inventory)

### Article
- Represents a spare part or replacement item.
- Used by all inventory-related entities.

### ArticleCategory
- Hierarchical classification (self-reference).

### ArticleBrand
- Manufacturer or brand.

### Provider
- External supplier.
- Has many PurchaseOrder.

### Store
- Physical or logical location where inventory exists.

---

## 2. Inventory Truth Entities

### Inventory
- Represents current stock per (Article, Store).
- Derived exclusively from Movement.
- MUST NOT be edited directly.

### Movement
- Represents a single immutable inventory transaction.

Fields:
- type: IN | OUT
- article
- store
- quantity
- referenceType
- referenceId
- createdAt

Rules:
- Created ONLY when a business entity is APPROVED.
- NEVER updated or deleted.
- Contains no business meaning beyond IN or OUT.

---

## 3. Case 1: Material Ingress (Material Receipt)

### Entities
- MaterialReceipt
- MaterialReceiptItem

### Purpose
Represents physical reception of material into a store.

### States
- DRAFT
- PENDING
- APPROVED
- REJECTED
- CANCELLED

### Rules
- Inventory is affected ONLY when status = APPROVED.
- Each receipt item generates exactly one Movement(IN).
- PurchaseOrder is OPTIONAL and informational.

### Movement Generation
For each MaterialReceiptItem:
- Movement.type = IN
- Movement.referenceType = MATERIAL_RECEIPT
- Movement.referenceId = MaterialReceipt.id

---

## 4. Case 2: Material Egress (Material Issue)

### Entities
- MaterialIssue
- MaterialIssueItem

### Purpose
Represents material leaving a store (consumption, disposal, shipment).

### States
- DRAFT
- PENDING
- APPROVED
- REJECTED
- CANCELLED

### Rules
- Stock availability MUST be validated before approval.
- Inventory is reduced ONLY when status = APPROVED.
- Each issue item generates exactly one Movement(OUT).

### Movement Generation
For each MaterialIssueItem:
- Movement.type = OUT
- Movement.referenceType = MATERIAL_ISSUE
- Movement.referenceId = MaterialIssue.id

---

## 5. Case 3: Stock Transfer (Store → Store)

### Entities
- StockTransfer
- StockTransferItem

### Purpose
Moves inventory between two stores.

### States
- DRAFT
- PENDING
- APPROVED
- REJECTED
- CANCELLED

### Rules
- Transfer MUST be atomic (all or nothing).
- Approval generates TWO movements per item.
- Stock is validated in source store before approval.

### Movement Generation (per item)
1. Movement(OUT)
   - store = fromStore
   - referenceType = STOCK_TRANSFER
2. Movement(IN)
   - store = toStore
   - referenceType = STOCK_TRANSFER

Both movements share the same referenceId.

---

## 6. Case 4: Manual Inventory Adjustment

### Entities
- InventoryAdjustment
- InventoryAdjustmentItem

### Purpose
Corrects inventory differences after physical count or error detection.

### States
- DRAFT
- PENDING
- APPROVED
- REJECTED

### Rules
- Adjustment MUST include a reason.
- Difference can be positive or negative.
- Approval generates movements based on difference sign.

### Movement Generation (per item)
- If difference > 0:
  - Movement(IN)
- If difference < 0:
  - Movement(OUT)

referenceType = INVENTORY_ADJUSTMENT

---

## 7. Case 5 (Optional): Inventory Return

### Description
Return of previously issued material back to inventory.

### Implementation
- Modeled as a MaterialReceipt.
- referenceType MAY indicate return source.

Rules:
- No special movement type required.
- Treated as a standard IN movement.

---

## 8. Explicit Prohibitions

- PurchaseOrder MUST NOT generate movements.
- Movement.type MUST NOT include ADJUSTMENT, TRANSFER, RETURN, etc.
- Inventory MUST NOT be recalculated from user input.
- Business meaning MUST NOT be inferred from Movement alone.

---

## 9. Conceptual Flow Summary

MaterialReceipt (APPROVED)
  → Movement(IN)
    → Inventory updated

MaterialIssue (APPROVED)
  → Movement(OUT)
    → Inventory updated

StockTransfer (APPROVED)
  → Movement(OUT) + Movement(IN)
    → Inventory updated

InventoryAdjustment (APPROVED)
  → Movement(IN | OUT)
    → Inventory corrected

---

## 10. Final Rule

If an operation changes inventory:
- It MUST have a business entity
- That entity MUST have states
- Approval MUST generate movements
- Movements MUST update inventory

No exceptions.
