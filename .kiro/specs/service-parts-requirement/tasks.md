# Implementation Plan: Service Parts Requirement

## Overview

Implementación incremental de la parametrización de artículos en servicios y su consumo automático de inventario al asignar servicios a órdenes. Se comienza con entidades base, luego el módulo CRUD de ServiceArticle, seguido por las modificaciones al módulo OrderService para soportar partes, validación de stock, y generación de MaterialIssue.

## Tasks

- [x] 1. Entities and data model setup
  - [x] 1.1 Add `requires_articles` field to Service entity and create ServiceArticle entity
    - Add `requires_articles: boolean` column (default `false`) to `src/entities/branch/service.entity.ts`
    - Add `@OneToMany(() => ServiceArticle, sa => sa.service)` relation to Service
    - Create `src/entities/branch/service-article.entity.ts` with fields: `id`, `service_id`, `article_id`, `default_quantity`, `is_active`, `createdAt`, `updatedAt`
    - Add `@Unique(['service_id', 'article_id'])` constraint
    - Add ManyToOne relations to Service and Article with explicit FK columns
    - Export in `src/entities/branch/index.ts`
    - _Requirements: 1.1, 2.1, 2.2_

  - [x] 1.2 Create OrderServicePart entity and modify OrderService entity
    - Create `src/entities/branch/order-service-part.entity.ts` with fields: `id`, `order_service_id`, `article_id`, `quantity` (int), `store_id`, `createdAt`, `updatedAt`
    - Add ManyToOne relations to OrderService (onDelete CASCADE), Article, and Store with explicit FK columns
    - Modify `src/entities/branch/order-service.entity.ts`: add `material_issue_id` (nullable), ManyToOne to MaterialIssue, and OneToMany to OrderServicePart
    - Export OrderServicePart in `src/entities/branch/index.ts`
    - _Requirements: 4.1, 5.3_

- [x] 2. ServiceArticle module (CRUD)
  - [x] 2.1 Create ServiceArticle DTOs
    - Create `src/modules/service-article/dto/create-service-article.dto.ts` with validations: `service_id` (IsInt), `article_id` (IsInt), `default_quantity` (IsNumber, Min 0.01, Max 9999.99), `is_active` (IsOptional, IsBoolean)
    - Create `src/modules/service-article/dto/update-service-article.dto.ts` with: `default_quantity` (IsOptional, Min 0.01, Max 9999.99), `is_active` (IsOptional, IsBoolean)
    - _Requirements: 2.1, 2.8_

  - [x] 2.2 Implement ServiceArticleService
    - Create `src/modules/service-article/service-article.service.ts`
    - Implement `findAll(tenant, serviceId, page, limit, filter)`: query with joins to Article (id, sku, name, unit_measurement, active), filter by service_id, paginate
    - Implement `create(tenant, dto)`: validate Service has `requires_articles=true`, validate Article exists and is active, handle unique constraint error (409)
    - Implement `update(tenant, id, dto)`: validate default_quantity range
    - Implement `remove(tenant, id)`: delete ServiceArticle record
    - Implement `validateArticlesForService(tenant, serviceId, articleIds)`: check all articleIds exist in active ServiceArticle records for the service
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [x] 2.3 Implement ServiceArticleController
    - Create `src/modules/service-article/service-article.controller.ts`
    - GET `/service-articles` with query params: `service_id`, `page`, `limit`, `filter`
    - POST `/service-articles` — create
    - PATCH `/service-articles/:id` — update
    - DELETE `/service-articles/:id` — remove
    - Follow standard response format, use TenantSelectionGuard
    - _Requirements: 2.5, 2.6_

  - [x] 2.4 Create ServiceArticleModule and register in AppModule
    - Create `src/modules/service-article/service-article.module.ts`
    - Register module in `src/app.module.ts` imports and add `'service-articles/*path'` in middleware forRoutes
    - _Requirements: 2.5_

  - [ ]* 2.5 Write property tests for ServiceArticle validations
    - **Property 2: ServiceArticle unique constraint enforcement** — Generate pairs (service_id, article_id), attempt to create duplicate, verify 409 error
    - **Property 3: ServiceArticle creation requires requires_articles=true** — Generate Services with requires_articles=false, attempt to create ServiceArticle, verify 400 error
    - **Property 4: ServiceArticle creation requires active Article** — Generate inactive/nonexistent articles, attempt to create ServiceArticle, verify 400 error
    - **Property 5: ServiceArticle default_quantity range validation** — Generate values outside [0.01, 9999.99], verify rejection
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.7, 2.8**

- [x] 3. Checkpoint - Verify ServiceArticle module
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Modify OrderService module for parts handling
  - [x] 4.1 Update CreateOrderServiceDto to accept parts and store_id
    - Add `parts?: OrderServicePartDto[]` with `@IsOptional()`, `@IsArray()`, `@ArrayMaxSize(50)`, `@ValidateNested({ each: true })`, `@Type(() => OrderServicePartDto)`
    - Add `store_id?: number` with `@IsOptional()`, `@IsInt()`, `@Min(1)`
    - Create `OrderServicePartDto` class with `article_id` (IsInt, Min 1) and `quantity` (IsInt, Min 1, Max 10000)
    - _Requirements: 3.1, 3.6, 4.1, 7.1_

  - [x] 4.2 Implement parts validation logic in OrderServiceService.create()
    - Load Service and check `requires_articles` flag
    - If `requires_articles=true`: validate `parts` is non-empty (1-50 items), validate `store_id` is present
    - If `requires_articles=false`: ignore `parts` and `store_id` if provided
    - Validate no duplicate `article_id` in parts array
    - Call `ServiceArticleService.validateArticlesForService()` to check all articles are configured and active
    - Validate Store exists and is active
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 7.2, 7.3, 7.5_

  - [x] 4.3 Implement stock validation in OrderServiceService.create()
    - Before starting transaction, call `InventoryService.validateStock()` for each distinct article/store pair
    - Aggregate quantities for same article_id
    - If any article has insufficient stock, collect ALL failures and return 400 with detail array (`article_id`, `required`, `available`)
    - Use `InventoryService.getStock()` for error reporting
    - Treat missing inventory records as 0
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 4.4 Implement OrderServicePart creation and MaterialIssue generation within transaction
    - Inside existing create transaction: persist OrderServicePart records (one per parts item) with `article_id`, `quantity`, `store_id`
    - Create MaterialIssue in DRAFT status with store_id
    - Create MaterialIssueItem for each part with `article_id`, `quantity`, `destinationReference` (order reference)
    - Update OrderService with `material_issue_id`
    - All within same transaction — rollback entirely on any failure
    - _Requirements: 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 7.4_

  - [x] 4.5 Implement OrderService deletion with MaterialIssue handling
    - In `remove()`: if `material_issue_id` exists, load MaterialIssue and check status
    - If MI status is APPROVED → throw 400 error blocking deletion
    - If MI status is DRAFT or PENDING → cancel the MaterialIssue (set status to CANCELLED)
    - Delete OrderServicePart records within same transaction (CASCADE handles this via entity config)
    - _Requirements: 4.4, 5.6, 5.7_

  - [x] 4.6 Update OrderService queries to include parts in responses
    - Modify `findOne()`: add relations `['parts', 'parts.article', 'parts.store', 'materialIssue']`
    - Modify `findOrderServiceByOrderId()`: include parts with article and store in query
    - Modify `getAll()`: include parts relation
    - Return `material_issue_id` in responses
    - _Requirements: 4.5_

- [x] 5. Checkpoint - Verify OrderService parts integration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Update Services module for requires_articles field
  - [x] 6.1 Update Service DTOs to include requires_articles
    - Add `requires_articles?: boolean` (IsOptional, IsBoolean) to the create and update DTOs in the services module
    - Ensure GET responses include the `requires_articles` field
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 7. Property-based and integration tests
  - [ ]* 7.1 Write property tests for OrderService parts validation
    - **Property 6: Parts required when requires_articles=true** — Generate Services with requires_articles=true, create OrderService without parts, verify 400
    - **Property 7: Parts ignored when requires_articles=false** — Generate Services with requires_articles=false, create with/without parts, verify success
    - **Property 8: Parts article_id validation against service configuration** — Generate invalid article_ids, verify 400
    - **Property 9: Parts quantity validation** — Generate out-of-range quantities, verify rejection
    - **Property 10: Parts duplicate article_id rejection** — Generate arrays with duplicate article_ids, verify 400
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 7.5**

  - [ ]* 7.2 Write property tests for OrderServicePart persistence and MaterialIssue
    - **Property 11: OrderServicePart count invariant** — Generate valid parts arrays of length 1-50, verify exactly N OrderServicePart records persisted
    - **Property 13: MaterialIssue auto-creation correctness** — Verify one MI in DRAFT with correct items and material_issue_id reference
    - **Property 18: Store_id propagation consistency** — Verify all OrderServicePart records and MaterialIssue share same store_id
    - **Validates: Requirements 4.2, 5.1, 5.3, 5.5, 7.4**

  - [ ]* 7.3 Write property tests for stock validation and deletion
    - **Property 12: OrderServicePart cascade deletion** — Create OrderService with parts, delete, verify zero OrderServicePart records remain
    - **Property 14: MaterialIssue cancellation on deletion** — Delete OrderService with DRAFT/PENDING MI, verify MI becomes CANCELLED
    - **Property 15: Deletion blocked when MI is approved** — Attempt to delete OrderService with APPROVED MI, verify 400
    - **Property 16: Stock validation blocks insufficient stock** — Generate insufficient stock scenarios, verify 400 with ALL insufficient articles
    - **Property 17: Store validation** — Generate invalid/inactive store_ids, verify 400
    - **Validates: Requirements 4.4, 5.6, 5.7, 6.1, 6.2, 6.5, 7.2, 7.3**

- [x] 8. Final checkpoint - Full integration verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The design uses TypeScript throughout — all implementation uses NestJS/TypeORM conventions
- The existing `InventoryService.validateStock()` and `InventoryService.getStock()` methods are used as-is
- MaterialIssue is created via direct repository operations within the transaction (not via the MaterialIssueService HTTP endpoint)
- The `ServiceArticleService` is injected into `OrderServiceService` for article validation

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2", "6.1"] },
    { "id": 3, "tasks": ["2.3"] },
    { "id": 4, "tasks": ["2.4", "2.5"] },
    { "id": 5, "tasks": ["4.1"] },
    { "id": 6, "tasks": ["4.2"] },
    { "id": 7, "tasks": ["4.3"] },
    { "id": 8, "tasks": ["4.4"] },
    { "id": 9, "tasks": ["4.5", "4.6"] },
    { "id": 10, "tasks": ["7.1", "7.2", "7.3"] }
  ]
}
```
