# Reglas de Desarrollo Seguro - FixSite Services

## Políticas de Seguridad

### Protección contra SQL Injection
- **OBLIGATORIO**: Usar TypeORM QueryBuilder con parámetros nombrados
- **PROHIBIDO**: Concatenar strings directamente en consultas SQL
- **EJEMPLO CORRECTO**:
  ```typescript
  queryBuilder.where('entity.field = :value', { value: userInput });
  ```
- **EJEMPLO INCORRECTO**:
  ```typescript
  queryBuilder.where(`entity.field = '${userInput}'`);
  ```

### Protección contra XSS
- **OBLIGATORIO**: Validar y sanitizar todas las entradas del usuario
- **OBLIGATORIO**: Usar DTOs con class-validator para validación
- **OBLIGATORIO**: Escapar contenido HTML antes de renderizar
- **PROHIBIDO**: Insertar datos del usuario directamente sin validación

### Validación de Entrada
- **OBLIGATORIO**: Usar ValidationPipe globalmente
- **OBLIGATORIO**: Implementar DTOs para todos los endpoints
- **OBLIGATORIO**: Validar tipos de datos (parseInt, parseFloat)
- **EJEMPLO**:
  ```typescript
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  ```

## Arquitectura y Patrones

### Estructura de Módulos
- **OBLIGATORIO**: Seguir el patrón Module-Controller-Service
- **ESTRUCTURA REQUERIDA**:
  ```
  src/modules/[nombre-modulo]/
  ├── [nombre-modulo].controller.ts
  ├── [nombre-modulo].service.ts
  ├── [nombre-modulo].module.ts
  └── dto/
      ├── create-[nombre-modulo].dto.ts
      └── update-[nombre-modulo].dto.ts
  ```

### Controladores
- **OBLIGATORIO**: Usar guards de autenticación y autorización
- **OBLIGATORIO**: Implementar TenantSelectionGuard para multi-tenancy
- **OBLIGATORIO**: Usar decoradores @CurrentTenant() para contexto de tenant
- **OBLIGATORIO**: Validar parámetros de paginación
- **EJEMPLO**:
  ```typescript
  @Controller('nombre-recurso')
  @UseGuards(TenantSelectionGuard)
  export class NombreController {
    @Get('all')
    async getAll(
      @CurrentTenant() tenant: Tenant,
      @Query('page') page: string = '1',
      @Query('limit') limit: string = '10'
    ) {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      return this.service.getAll(tenant, pageNum, limitNum);
    }
  }
  ```

### Servicios
- **OBLIGATORIO**: Usar ConnectionDatabaseService para multi-tenancy
- **OBLIGATORIO**: Implementar paginación en métodos de listado
- **OBLIGATORIO**: Usar QueryBuilder para consultas complejas
- **OBLIGATORIO**: Manejar errores apropiadamente

## Convenciones de Nomenclatura

### Archivos
- **Controladores**: `[nombre-modulo].controller.ts`
- **Servicios**: `[nombre-modulo].service.ts`
- **Módulos**: `[nombre-modulo].module.ts`
- **DTOs**: `create-[nombre-modulo].dto.ts`, `update-[nombre-modulo].dto.ts`
- **Entidades**: `[nombre-entidad].entity.ts`
- **Guards**: `[nombre-guard].guard.ts`
- **Interceptors**: `[nombre-interceptor].interceptor.ts`
- **Middlewares**: `[nombre-middleware].middleware.ts`

### Variables y Métodos
- **camelCase** para variables y métodos
- **PascalCase** para clases y interfaces
- **UPPER_SNAKE_CASE** para constantes
- **kebab-case** para rutas de API

### Rutas de API
- **Plural** para recursos: `/maintenance/failure-categories`
- **Consistencia** en nomenclatura: usar guiones para separar palabras
- **Versionado**: considerar `/v1/` para APIs públicas

## Seguridad Multi-Tenant

### Aislamiento de Datos
- **OBLIGATORIO**: Usar TenantSelectionGuard en todos los controladores
- **OBLIGATORIO**: Pasar tenant a todos los métodos de servicio
- **OBLIGATORIO**: Usar ConnectionDatabaseService para obtener repositorios
- **PROHIBIDO**: Acceder directamente a repositorios sin contexto de tenant

### Autenticación y Autorización
- **OBLIGATORIO**: Implementar guards apropiados
- **OBLIGATORIO**: Validar permisos por tenant
- **OBLIGATORIO**: Usar decoradores personalizados para extraer contexto

## Manejo de Errores

### Logging
- **OBLIGATORIO**: Usar el sistema de logging configurado
- **OBLIGATORIO**: Registrar errores con contexto suficiente
- **PROHIBIDO**: Exponer información sensible en logs

### Respuestas de Error
- **OBLIGATORIO**: Usar excepciones HTTP apropiadas de NestJS
- **PROHIBIDO**: Exponer detalles internos del sistema
- **OBLIGATORIO**: Proporcionar mensajes de error útiles pero seguros

## Validación de Datos

### DTOs
- **OBLIGATORIO**: Crear DTOs para todas las operaciones
- **OBLIGATORIO**: Usar class-validator decorators
- **OBLIGATORIO**: Implementar transformaciones cuando sea necesario

### Paginación
- **OBLIGATORIO**: Implementar paginación en endpoints de listado
- **OBLIGATORIO**: Validar y sanitizar parámetros de paginación
- **OBLIGATORIO**: Retornar metadatos de paginación (total, page, limit, totalPages)

## Base de Datos

### Consultas
- **OBLIGATORIO**: Usar QueryBuilder para consultas complejas
- **OBLIGATORIO**: Implementar filtros de búsqueda seguros
- **OBLIGATORIO**: Usar relaciones apropiadas en consultas
- **EJEMPLO**:
  ```typescript
  const queryBuilder = repository.createQueryBuilder('entity')
    .leftJoinAndSelect('entity.relation', 'relation');
  
  if (filter) {
    queryBuilder.where('entity.field LIKE :filter', { filter: `%${filter}%` });
  }
  ```

### Transacciones
- **OBLIGATORIO**: Usar transacciones para operaciones críticas
- **OBLIGATORIO**: Manejar rollback en caso de errores

## Configuración

### Variables de Entorno
- **OBLIGATORIO**: Usar archivos de configuración tipados
- **PROHIBIDO**: Acceder directamente a process.env en servicios
- **OBLIGATORIO**: Validar configuración al inicio de la aplicación

### Secrets
- **PROHIBIDO**: Hardcodear credenciales en el código
- **OBLIGATORIO**: Usar variables de entorno para información sensible
- **OBLIGATORIO**: Rotar secrets regularmente