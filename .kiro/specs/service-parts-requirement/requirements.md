# Requirements Document

## Introduction

Este documento define los requerimientos para agregar la parametrización de artículos (partes de recambio) a los servicios del sistema FixSite. Actualmente, para efectuar una reparación se necesita un tipo de servicio y una falla asociada. El nuevo cambio permite indicar si un servicio requiere o no artículos de recambio, configurar qué artículos puede usar cada servicio (relación uno a muchos), y validar al momento de asignar un servicio a una orden que las partes requeridas se soliciten del stock mediante el flujo de MaterialIssue existente.

## Glossary

- **Service**: Entidad de catálogo de servicios ofrecidos (tabla `services`). Campos: `code`, `description`, `base_price`, `is_active`.
- **ServiceOrderType**: Entidad de catálogo de precios por tipo de orden y falla (tabla `service_order_types`).
- **ServiceArticle**: Nueva entidad de configuración que vincula un Service con los Article permitidos (tabla `service_articles`).
- **Article**: Entidad de catálogo de artículos/repuestos del inventario (tabla `articles`).
- **OrderService**: Servicio aplicado a una orden de reparación (tabla `order_services`).
- **OrderServicePart**: Nueva entidad que registra los artículos consumidos por un OrderService (tabla `order_service_parts`).
- **MaterialIssue**: Entidad de egreso de inventario. Genera Movement(OUT) al ser aprobada.
- **MaterialIssueItem**: Línea de detalle de un MaterialIssue con artículo y cantidad.
- **Inventory**: Stock actual por artículo y almacén. Solo cambia mediante movimientos aprobados.
- **Store**: Almacén físico o lógico donde existe inventario.

## Requirements

### Requirement 1: Indicador de requerimiento de artículos en Service

**User Story:** Como administrador del catálogo de servicios, quiero indicar si un servicio requiere artículos de recambio, para que el sistema sepa cuándo solicitar partes al crear un OrderService.

#### Acceptance Criteria

1. THE Service entity SHALL include a boolean field `requires_articles` with a default value of `false`.
2. WHEN a Service is created or updated with the `requires_articles` field provided, THE System SHALL persist the value and return it in the response body.
3. WHEN the `requires_articles` field is not provided in the creation payload, THE System SHALL store the value as `false`.
4. WHEN the `requires_articles` field is not provided in an update payload, THE System SHALL preserve the existing stored value without modification.
5. IF the `requires_articles` field is provided with a non-boolean value, THEN THE System SHALL reject the request with a validation error indicating the field must be a boolean.
6. WHEN a Service is retrieved via GET endpoints, THE System SHALL include the `requires_articles` field in the response.

### Requirement 2: Configuración de artículos permitidos por servicio

**User Story:** Como administrador del catálogo, quiero configurar qué artículos puede usar cada servicio, para restringir las partes de recambio a las que son compatibles con el tipo de reparación.

#### Acceptance Criteria

1. THE ServiceArticle entity SHALL store a relationship between a Service and an Article, with fields: `service_id`, `article_id`, `default_quantity` (decimal, range 0.01 to 9999.99), `is_active` (boolean, default `true`).
2. THE ServiceArticle entity SHALL enforce a unique constraint on the combination `(service_id, article_id)`.
3. WHEN a ServiceArticle is created and the referenced Service has `requires_articles` set to `false`, THE System SHALL reject the request with an error message indicating that the service does not allow article configuration.
4. WHEN a ServiceArticle is created and the referenced Article does not exist or has `active` set to `false`, THE System SHALL reject the request with an error message indicating that the article is not available.
5. THE System SHALL provide CRUD endpoints for ServiceArticle: list by service (with pagination: page, limit, filter), create, update (`default_quantity`, `is_active`), and delete.
6. WHEN a ServiceArticle list is requested for a Service, THE System SHALL return all active ServiceArticle records including for each record the associated Article's `id`, `sku`, `name`, `unit_measurement`, and `active` status.
7. IF a ServiceArticle creation request specifies a `(service_id, article_id)` combination that already exists, THEN THE System SHALL reject the request with an error message indicating the article is already configured for that service.
8. WHEN a ServiceArticle is updated, THE System SHALL validate that `default_quantity` is within the range 0.01 to 9999.99 and reject the request with an error message indicating invalid quantity if the value is outside this range.

### Requirement 3: Validación de partes al crear OrderService

**User Story:** Como técnico, quiero que al asignar un servicio que requiere artículos a una orden, el sistema me obligue a seleccionar las partes necesarias, para garantizar que se registre correctamente el consumo de inventario.

#### Acceptance Criteria

1. WHEN an OrderService is created for a Service where `requires_articles` is `true`, THE System SHALL require a non-empty `parts` array containing between 1 and 50 items in the request payload.
2. WHEN an OrderService is created for a Service where `requires_articles` is `true` and the `parts` array is empty or missing, THE System SHALL return a 400 error with a message indicating that parts are required for this service.
3. WHEN an OrderService is created for a Service where `requires_articles` is `false`, THE System SHALL accept the request regardless of whether a `parts` array is provided or not; if provided, the `parts` array SHALL be ignored.
4. WHEN a `parts` array is provided, THE System SHALL validate that each `article_id` exists in the ServiceArticle configuration for that Service and that the corresponding ServiceArticle record has `is_active` set to `true`.
5. WHEN a `parts` array contains an `article_id` not configured for the Service or configured but inactive, THE System SHALL return a 400 error indicating which article is not allowed for the service.
6. WHEN a `parts` array is provided, THE System SHALL validate that each `quantity` is an integer greater than zero and no greater than 10,000.
7. WHEN a `parts` array contains duplicate `article_id` values, THE System SHALL return a 400 error indicating that duplicate articles are not allowed in the same request.

### Requirement 4: Registro de partes consumidas en OrderService

**User Story:** Como administrador, quiero que el sistema registre qué artículos y en qué cantidad se consumieron por cada servicio aplicado, para tener trazabilidad del uso de partes.

#### Acceptance Criteria

1. THE OrderServicePart entity SHALL store: `order_service_id` (FK to OrderService), `article_id` (FK to Article), `quantity` (integer, minimum value 1, maximum value 9999), and `store_id` (FK to Store).
2. WHEN an OrderService with a `parts` array (maximum 50 items) is created, THE System SHALL persist one OrderServicePart record per each item in the `parts` array within the same transaction used to create the OrderService.
3. IF any `article_id` or `store_id` in the `parts` array does not reference an existing record, THEN THE System SHALL reject the entire creation request with an error message indicating which reference is invalid, without persisting any OrderServicePart records.
4. WHEN an OrderService is deleted, THE System SHALL delete all associated OrderServicePart records within the same transaction used to delete the OrderService.
5. WHEN an OrderService with parts is queried, THE System SHALL include the associated OrderServicePart records with each record's related Article entity (id, name, sku) and Store entity (id, name).
6. IF any item in the `parts` array has a `quantity` less than 1, THEN THE System SHALL reject the creation request with an error message indicating the invalid quantity.

### Requirement 5: Generación automática de MaterialIssue al crear OrderService con partes

**User Story:** Como administrador de inventario, quiero que al crear un servicio con partes, el sistema genere automáticamente un egreso de material (MaterialIssue), para que el stock se descuente siguiendo el flujo de inventario existente.

#### Acceptance Criteria

1. WHEN an OrderService with parts is created, THE System SHALL create a single MaterialIssue in status DRAFT with one MaterialIssueItem per entry in the `parts` array, each containing the corresponding `article_id`, `quantity`, and the `store_id` specified in the request.
2. WHEN the MaterialIssue is created, THE System SHALL associate each MaterialIssueItem with the destination Order (from the OrderService's `order_id`) via the `destinationReference` relation.
3. WHEN an OrderService with parts is created, THE System SHALL store the `material_issue_id` reference in the OrderService entity for traceability.
4. IF the MaterialIssue creation fails, THEN THE System SHALL rollback the entire OrderService creation (including OrderServicePart records) within the same database transaction.
5. THE System SHALL NOT automatically approve the MaterialIssue; approval remains a separate manual step following existing inventory workflow.
6. WHEN an OrderService with a linked MaterialIssue is deleted, IF the MaterialIssue is in status DRAFT or PENDING, THEN THE System SHALL cancel the associated MaterialIssue.
7. WHEN an OrderService with a linked MaterialIssue is deleted, IF the MaterialIssue is in status APPROVED, THEN THE System SHALL prevent the deletion and return a 400 error indicating the material issue has already been approved.

### Requirement 6: Validación de stock disponible al crear OrderService con partes

**User Story:** Como técnico, quiero que el sistema me informe si hay stock disponible antes de asignar un servicio con partes, para evitar asignar servicios que no pueden completarse por falta de repuestos.

#### Acceptance Criteria

1. WHEN an OrderService with parts is created, THE System SHALL validate stock availability for each distinct `article_id` in the specified store before persisting, aggregating quantities when the same `article_id` appears multiple times in the `parts` array.
2. IF any article in the `parts` array has insufficient stock in the specified store, THEN THE System SHALL return a 400 error including all articles with insufficient stock, indicating for each one the `article_id`, the required quantity, and the current available quantity.
3. THE stock validation SHALL use the existing `InventoryService.validateStock` method to check availability and `InventoryService.getStock` to retrieve the current quantity for error reporting.
4. THE stock validation SHALL occur before the transaction that persists the OrderService and MaterialIssue, serving as a pre-creation blocking check.
5. IF an article in the `parts` array has no inventory record in the specified store, THEN THE System SHALL treat the available stock as 0 and include that article in the insufficient stock error response.

### Requirement 7: Parametrización del almacén de origen para partes

**User Story:** Como técnico, quiero indicar de qué almacén se extraen las partes al crear un OrderService, para que el egreso de material se registre contra el almacén correcto.

#### Acceptance Criteria

1. WHEN an OrderService with parts is created, THE System SHALL require a `store_id` field (positive integer) in the request payload.
2. WHEN an OrderService with parts is created, THE System SHALL validate that the Store referenced by `store_id` exists and has `active` equal to `true` in the tenant database.
3. IF the `store_id` references a non-existent or inactive Store, THEN THE System SHALL return a 400 error with a message indicating that the store was not found or is inactive.
4. WHEN an OrderService with parts is created successfully, THE System SHALL use the provided `store_id` as the `store_id` in all resulting OrderServicePart records and as the store in the generated MaterialIssue entity.
5. WHEN an OrderService is created for a Service where `requires_articles` is `false` and no `parts` array is provided, THE System SHALL not require the `store_id` field.
