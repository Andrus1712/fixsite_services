# Multi-Tenant Setup

## Arquitectura

Este proyecto implementa un patrón multi-tenancy a nivel de esquema con las siguientes características:

- **BD Central (Global)**: Contiene información de tenants
- **BD Branch (Tenant)**: Una base de datos por tenant con sus propias entidades

## Estructura

```
src/
├── config/
│   └── database.config.ts          # Configuración de BDs
├── entities/
│   ├── global/                     # Entidades de BD central
│   │   └── tenant.entity.ts
│   └── branch/                     # Entidades de BD tenant
│       ├── user.entity.ts
│       └── product.entity.ts
├── database/
│   ├── tenant-connection.service.ts # Manejo de conexiones dinámicas
│   ├── tenant-aware.service.ts     # Servicio base para repositorios
│   └── init-database.ts            # Script de inicialización
├── common/
│   ├── decorators/
│   │   └── tenant.decorator.ts     # Decorador @CurrentTenant
│   └── middleware/
│       └── tenant-resolver.middleware.ts # Resolución de tenant
└── modules/
    ├── tenant/                     # Módulo de gestión de tenants
    └── user/                       # Ejemplo de módulo tenant-aware
```

## Configuración

1. **Variables de entorno** (.env):
```env
# BD Central (Global) - Solo necesitas esta configuración
GLOBAL_DB_TYPE=postgres
GLOBAL_DB_HOST=localhost
GLOBAL_DB_PORT=5432
GLOBAL_DB_USERNAME=postgres
GLOBAL_DB_PASSWORD=password
GLOBAL_DB_DATABASE=fixsite_global

# Las credenciales de BD Branch se almacenan en cada tenant
```

2. **Inicializar BD**:
```bash
npm run db:init
```

## Uso

### Crear un tenant
```bash
POST /api/tenants
{
  "name": "Mi Empresa",
  "subdomain": "miempresa",
  "dbHost": "localhost",
  "dbPort": 5432,
  "dbUsername": "postgres",
  "dbPassword": "password"
}
```

### Acceder a recursos del tenant

**Opción 1: Header (Desarrollo)**
```bash
GET /api/users
Headers: X-Tenant-ID: demo
```

**Opción 2: Subdomain (Producción)**
```bash
GET https://demo.tudominio.com/api/users
```

### Crear usuario en tenant
```bash
POST /api/users
Headers: X-Tenant-ID: demo
{
  "name": "Juan Pérez",
  "email": "juan@demo.com",
  "password": "123456"
}
```

## Cómo agregar nuevas entidades

### Para BD Central (Global):
1. Crear entidad en `src/entities/global/`
2. Agregar al `globalDatabaseConfig`

### Para BD Tenant (Branch):
1. Crear entidad en `src/entities/branch/`
2. Crear servicio usando `TenantAwareService`
3. Crear controlador usando `@CurrentTenant()`

Ejemplo de servicio tenant-aware:
```typescript
@Injectable()
export class ProductService {
  constructor(private readonly tenantAwareService: TenantAwareService) {}

  async findAll(tenant: Tenant): Promise<Product[]> {
    const repository = await this.tenantAwareService.getRepository(Product, tenant);
    return repository.find();
  }
}
```

## Ventajas de esta implementación

- ✅ Aislamiento completo de datos por tenant
- ✅ Escalabilidad horizontal
- ✅ Flexibilidad para customizaciones por tenant
- ✅ Gestión automática de conexiones
- ✅ Resolución automática de tenant por subdomain/header
- ✅ **Credenciales dinámicas**: Cada tenant puede tener su propia BD con credenciales diferentes
- ✅ **Flexibilidad de infraestructura**: Tenants pueden estar en diferentes servidores/proveedores