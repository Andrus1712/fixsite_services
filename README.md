# FixSite Services – Backend API

Backend multi-tenant para gestión de órdenes de servicio, inventario y técnicos. Construido con NestJS + TypeORM + PostgreSQL.

## Stack

- **NestJS** + TypeScript
- **TypeORM** + PostgreSQL (una DB por tenant)
- **JWT** con cookies httpOnly
- **Socket.io** para tiempo real
- **Winston** para logging
- **Multer** para subida de archivos

## Requisitos

- Node.js >= 18
- PostgreSQL >= 14

## Instalación

```bash
npm install
```

## Variables de entorno

Copia `.env.example` a `.env` y configura:

```env
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=tu_jwt_secret_aqui

# Base de datos global
GLOBAL_DB_HOST=localhost
GLOBAL_DB_PORT=5432
GLOBAL_DB_USERNAME=postgres
GLOBAL_DB_PASSWORD=password
GLOBAL_DB_DATABASE=fixsite_global
```

## Correr el proyecto

```bash
# Desarrollo
npm run start:dev

# Producción
npm run start:prod
```

## Módulos principales

| Módulo | Ruta base | Descripción |
|---|---|---|
| Auth | `/auth` | Login, registro, selección de tenant |
| Orders | `/orders` | Órdenes de servicio |
| Order Services | `/orders-service` | Servicios asociados a una orden |
| Customers | `/customers` | Gestión de clientes |
| Technicians | `/technicians` | Gestión de técnicos |
| Inventory | `/material-receipts`, `/material-issues`, etc. | Sistema de inventario completo |
| Maintenance | `/maintenance` | Categorías, códigos y severidades de fallas |
| Info Devices | `/info-devices` | Marcas, modelos y tipos de dispositivos |
| Services | `/services` | Catálogo de servicios |
| Upload | `/upload` | Subida de imágenes y documentos |
| Realtime | WebSocket | Notificaciones y stats en tiempo real |

## Documentación interna

La documentación del proyecto está en `.kiro/steering/`:

- `project-overview.md` — arquitectura, auth, estructura de carpetas
- `coding-conventions.md` — patrones de código, DTOs, servicios, controladores
- `inventory-domain.md` — reglas de negocio del sistema de inventario

## Arquitectura multi-tenant

Cada tenant tiene su propia base de datos PostgreSQL. Las credenciales se almacenan en la entidad `Tenant` de la DB global. `ConnectionDatabaseService` gestiona el pool de conexiones dinámicamente.

## Logs

Los logs se guardan en `logs/` con rotación diaria:
- `combined-YYYY-MM-DD.log` — todos los logs
- `error-YYYY-MM-DD.log` — solo errores
- `sql-YYYY-MM-DD.log` — queries SQL
