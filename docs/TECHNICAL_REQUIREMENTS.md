# FixSite – Documento de Requisitos Técnicos (SRS)

> **Versión:** 1.0  
> **Fecha:** 26 de mayo de 2026  
> **Autor:** Equipo FixSite  
> **Estado:** Borrador

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Alcance del Producto](#2-alcance-del-producto)
3. [Stakeholders y Usuarios](#3-stakeholders-y-usuarios)
4. [Arquitectura del Sistema](#4-arquitectura-del-sistema)
5. [Requisitos Funcionales (RF)](#5-requisitos-funcionales-rf)
6. [Requisitos No Funcionales (RNF)](#6-requisitos-no-funcionales-rnf)
7. [Modelo de Datos](#7-modelo-de-datos)
8. [Matriz de Trazabilidad](#8-matriz-de-trazabilidad)
9. [Roadmap y Priorización](#9-roadmap-y-priorización)
10. [Glosario](#10-glosario)

---

## 1. Resumen Ejecutivo

**FixSite** es una plataforma SaaS multi-tenant orientada a centros de reparación de dispositivos electrónicos (teléfonos móviles, laptops, tablets y accesorios). Facilita la gestión integral de órdenes de servicio, diagnóstico de fallas, catálogo de servicios, inventario de repuestos, clientes, técnicos, pagos y reportes.

### 1.1 Objetivo de Negocio

Ofrecer a talleres de reparación una solución asequible y escalable para:
- Administrar órdenes de servicio de principio a fin
- Reducir tiempos de espera y mejorar la eficiencia operativa
- Mejorar la comunicación con clientes mediante transparencia y notificaciones en tiempo real
- Controlar el inventario de repuestos con trazabilidad completa

### 1.2 Propuesta de Valor

| Beneficio | Descripción |
|-----------|-------------|
| Reducción administrativa | Automatización de flujos de trabajo, estados y notificaciones |
| Satisfacción del cliente | Seguimiento en tiempo real, notificaciones push, portal de consulta |
| Control de inventario | Movimientos auditables, alertas de stock mínimo, trazabilidad |
| Escalabilidad | Arquitectura multi-tenant con BD independiente por sucursal |
| Monetización | Suscripción mensual por tenant + comisiones opcionales por pago |

### 1.3 Modelo de Negocio

- **Suscripción mensual** por tenant (taller/sucursal)
- **Comisión opcional** por transacción de pago procesada
- **Planes escalonados** según cantidad de usuarios, órdenes mensuales y almacenamiento

---

## 2. Alcance del Producto

### 2.1 Dentro del Alcance (In-Scope)

- Panel web para administradores y técnicos del taller
- Portal de consulta para clientes (seguimiento de órdenes)
- Landing page pública para registro de problemas por parte del cliente
- Gestión completa de órdenes de reparación (CRUD + flujo de estados)
- Sistema de diagnóstico de fallas con catálogo maestro
- Catálogo de servicios con precios configurables por tipo de orden y falla
- Inventario de repuestos con movimientos auditables
- Gestión de clientes y técnicos
- Notificaciones en tiempo real (WebSocket) y diferidas (email/push)
- Sistema de roles, permisos y control de acceso granular
- Reportes y analítica básica
- Integración de pagos (Stripe)
- Comunicación interna (chat entre técnicos y administradores)

### 2.2 Fuera del Alcance (Out-of-Scope) — Fase 1

- Aplicación móvil nativa (iOS/Android)
- Integración con ERP externos
- Marketplace de repuestos entre talleres
- Sistema de garantías extendidas
- Módulo de contabilidad completo
- Integración con operadores de mensajería (WhatsApp Business API)

---

## 3. Stakeholders y Usuarios

### 3.1 Tipos de Usuario

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| **Super Admin** | Administrador global de la plataforma | Panel global, gestión de tenants, métricas globales |
| **Admin Taller** | Dueño/administrador del taller (tenant) | Panel completo del tenant, configuración, reportes |
| **Técnico** | Personal de reparación asignado a sucursal | Órdenes asignadas, inventario, chat |
| **Recepcionista** | Personal de atención al cliente | Crear órdenes, gestionar clientes, cobros |
| **Cliente** | Usuario final que lleva su dispositivo | Portal de seguimiento, historial, calificaciones |

### 3.2 Matriz de Permisos por Rol (Ejemplo)

| Módulo | Super Admin | Admin Taller | Técnico | Recepcionista | Cliente |
|--------|:-----------:|:------------:|:-------:|:-------------:|:-------:|
| Gestión de tenants | ✅ | ❌ | ❌ | ❌ | ❌ |
| Usuarios y roles | ✅ | ✅ | ❌ | ❌ | ❌ |
| Órdenes (crear) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Órdenes (ver todas) | ✅ | ✅ | ❌ | ✅ | ❌ |
| Órdenes (ver propias) | — | — | ✅ | — | ✅ |
| Inventario | ✅ | ✅ | ✅ (lectura) | ❌ | ❌ |
| Reportes | ✅ | ✅ | ❌ | ❌ | ❌ |
| Pagos | ✅ | ✅ | ❌ | ✅ | ✅ |
| Chat interno | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## 4. Arquitectura del Sistema

### 4.1 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Backend** | NestJS (Node.js) + TypeScript |
| **ORM** | TypeORM |
| **Base de datos** | PostgreSQL (multi-tenant, 1 BD por tenant + 1 BD global) |
| **Autenticación** | JWT con cookies httpOnly (Passport.js) |
| **WebSockets** | Socket.io via `@nestjs/websockets` |
| **File Upload** | Multer via `@nestjs/platform-express` |
| **Logging** | Winston via `nest-winston` |
| **Frontend** | React 18+ con TypeScript + Tailwind CSS |
| **Pagos** | Stripe (planificado) |
| **Despliegue** | Por definir (Docker + VPS / Cloud) |

### 4.2 Arquitectura Multi-Tenant

```
┌─────────────────────────────────────────────────────┐
│                   API Gateway (NestJS)               │
├─────────────────────────────────────────────────────┤
│  TenantResolverMiddleware (X-Tenant-ID / subdomain) │
├──────────────┬──────────────┬───────────────────────┤
│  BD Global   │  BD Tenant A │  BD Tenant B │  ...   │
│  (users,     │  (orders,    │  (orders,    │        │
│   tenants,   │   inventory, │   inventory, │        │
│   roles)     │   customers) │   customers) │        │
└──────────────┴──────────────┴───────────────────────┘
```

**Decisiones clave:**
- Cada tenant tiene su propia BD PostgreSQL con credenciales independientes
- `ConnectionDatabaseService` gestiona un pool de `DataSource` por tenant
- Aislamiento total de datos entre tenants
- La BD global almacena: usuarios, tenants, roles, permisos, módulos, componentes

### 4.3 Flujo de Autenticación

```
[Login] → cookie(temp_token, 24h) → [Select Tenant] → cookie(full_token + tenantId)
                                                     → [Switch Tenant] → actualiza tenantId
                                                     → [Logout Tenant] → remueve tenantId
[Logout] → limpia cookie completamente
```

### 4.4 Comunicación en Tiempo Real

- **Gateway:** `RealtimeGateway` con Socket.io
- **Rooms:** `tenant:{id}`, `user:{id}`, `chat:{chatId}`
- **Eventos:** notificaciones, stats, chat, typing indicators
- **Inyectable:** `RealtimeService` disponible en cualquier módulo

---

## 5. Requisitos Funcionales (RF)

### RF-001: Autenticación y Gestión de Cuentas

**Prioridad:** Alta | **Estado:** ✅ Implementado (parcial)

#### RF-001.1: CRUD de Usuarios, Roles y Permisos

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-001.1.1 | CRUD completo de usuarios (crear, listar, editar, desactivar) | ✅ |
| RF-001.1.2 | CRUD de roles con nombre y descripción | ✅ |
| RF-001.1.3 | CRUD de permisos asociados a componentes del sistema | ✅ |
| RF-001.1.4 | Asignación de roles a usuarios (N:N) | ✅ |
| RF-001.1.5 | Asignación de permisos directos a usuario (sin rol) | ✅ |
| RF-001.1.6 | Sistema de módulos y componentes para control de vistas | ✅ |
| RF-001.1.7 | Usuario super admin con acceso global a todos los tenants | ✅ |
| RF-001.1.8 | Validación de permisos en frontend para mostrar/ocultar vistas | 🔲 Pendiente |
| RF-001.1.9 | Guard de permisos en backend para proteger endpoints | 🔲 Pendiente |

#### RF-001.2: CRUD de Sucursales (Tenants)

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-001.2.1 | Crear tenant con nombre, subdominio y credenciales de BD | ✅ |
| RF-001.2.2 | Creación automática de BD al registrar nuevo tenant | ✅ |
| RF-001.2.3 | Asignación de usuarios a tenants (N:N) | ✅ |
| RF-001.2.4 | Activar/desactivar tenants | ✅ |
| RF-001.2.5 | Listar tenants del usuario autenticado | ✅ |

#### RF-001.3: Autenticación y Seguridad

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-001.3.1 | Login con email/password → token temporal (sin tenant) | ✅ |
| RF-001.3.2 | Selección de tenant → token completo con tenantId | ✅ |
| RF-001.3.3 | Switch de tenant sin re-login | ✅ |
| RF-001.3.4 | Logout parcial (tenant) y total | ✅ |
| RF-001.3.5 | Cookies httpOnly + secure + sameSite strict | ✅ |
| RF-001.3.6 | Cifrado de passwords con bcrypt | ✅ |
| RF-001.3.7 | Guards: TenantSelectionGuard, FullTokenGuard | ✅ |
| RF-001.3.8 | OAuth (Google, Facebook) — opcional | 🔲 Pendiente |
| RF-001.3.9 | Recuperación de contraseña por email | 🔲 Pendiente |
| RF-001.3.10 | Bloqueo de cuenta tras N intentos fallidos | 🔲 Pendiente |
| RF-001.3.11 | Refresh token para renovación automática | 🔲 Pendiente |

---

### RF-002: Perfiles

**Prioridad:** Alta | **Estado:** ✅ Implementado (parcial)

#### RF-002.1: Perfil de Cliente

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-002.1.1 | CRUD de clientes (nombre, email, teléfono, dirección, ciudad, país) | ✅ |
| RF-002.1.2 | Tipo de cliente (particular, empresa) | ✅ |
| RF-002.1.3 | Método de contacto preferido | ✅ |
| RF-002.1.4 | Historial de reparaciones (órdenes asociadas) | ✅ |
| RF-002.1.5 | Landing page pública para registro de problemas | 🔲 Pendiente |
| RF-002.1.6 | Formulario de issues: dispositivo, falla, info del cliente | 🔲 Pendiente |
| RF-002.1.7 | Portal de consulta para el cliente (ver estado de su orden) | 🔲 Pendiente |
| RF-002.1.8 | Autenticación de cliente (acceso limitado a sus órdenes) | 🔲 Pendiente |

#### RF-002.2: Perfil de Taller y Técnicos

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-002.2.1 | CRUD de técnicos (nombre, email, teléfono, especialidad, nivel) | ✅ |
| RF-002.2.2 | Certificaciones del técnico | ✅ |
| RF-002.2.3 | Órdenes asignadas al técnico | ✅ |
| RF-002.2.4 | Perfil público del taller (info, ubicación, servicios) | 🔲 Pendiente |
| RF-002.2.5 | Horarios de atención del taller | 🔲 Pendiente |
| RF-002.2.6 | Disponibilidad del técnico (agenda) | 🔲 Pendiente |

---

### RF-003: Gestión de Órdenes de Reparación

**Prioridad:** Crítica | **Estado:** ✅ Implementado

#### RF-003.1: CRUD de Órdenes

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-003.1.1 | Crear orden completa (dispositivo + fallas + notas + cliente) | ✅ |
| RF-003.1.2 | Código de orden único auto-generado | ✅ |
| RF-003.1.3 | Asignación de tipo de orden (Reparación, Garantía, Mantenimiento, etc.) | ✅ |
| RF-003.1.4 | Asignación de técnico a la orden | ✅ |
| RF-003.1.5 | Prioridad de la orden (con descripción) | ✅ |
| RF-003.1.6 | Costos: estimado, real, mano de obra, repuestos | ✅ |
| RF-003.1.7 | Timeline: fecha estimada, fecha real, horas estimadas/reales | ✅ |
| RF-003.1.8 | SLA deadline configurable | ✅ |
| RF-003.1.9 | Aprobación de costo por el cliente | ✅ |
| RF-003.1.10 | Listar órdenes con paginación y filtros | ✅ |
| RF-003.1.11 | Buscar orden por código | ✅ |
| RF-003.1.12 | Asociar múltiples dispositivos a una orden | ✅ |
| RF-003.1.13 | Notas internas y externas en la orden | ✅ |
| RF-003.1.14 | Log de eventos (historial de acciones) | ✅ |

#### RF-003.2: Gestión de Estados de Orden

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-003.2.1 | Estados configurables (recibido, diagnóstico, reparación, esperando repuestos, listo, entregado) | ✅ |
| RF-003.2.2 | Historial de cambios de estado (StatusHistory) | ✅ |
| RF-003.2.3 | Flujos condicionales por estado (ej: "esperando repuestos" → observaciones obligatorias) | 🔲 Pendiente |
| RF-003.2.4 | Validación de transiciones permitidas entre estados | 🔲 Pendiente |
| RF-003.2.5 | Notificación automática al cambiar estado | 🔲 Pendiente (parcial via WebSocket) |

#### RF-003.3: Gestión de Fallas (OrderIssue)

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-003.3.1 | Reportar fallas al crear la orden | ✅ |
| RF-003.3.2 | Agregar fallas adicionales a orden existente | ✅ |
| RF-003.3.3 | Clasificación via catálogo de fallas (FailureCode) | ✅ |
| RF-003.3.4 | Estados de falla: PENDING, RESOLVED, REJECTED | ✅ |
| RF-003.3.5 | Adjuntos (fotos, videos, docs) en formato JSON | ✅ |
| RF-003.3.6 | Pasos para reproducir la falla | ✅ |
| RF-003.3.7 | Resolución automática al asignar servicio | ✅ |
| RF-003.3.8 | Reversión a PENDING al eliminar servicio | ✅ |

#### RF-003.4: Dispositivos

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-003.4.1 | Registrar dispositivo con modelo, serial, IMEI, color, capacidad | ✅ |
| RF-003.4.2 | Catálogo de marcas de dispositivos | ✅ |
| RF-003.4.3 | Catálogo de modelos por marca | ✅ |
| RF-003.4.4 | Catálogo de tipos de dispositivo | ✅ |
| RF-003.4.5 | Tipos de contraseña del dispositivo | ✅ |

---

### RF-004: Gestión de Inventario y Repuestos

**Prioridad:** Alta | **Estado:** ✅ Implementado

#### RF-004.1: Catálogo de Artículos

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-004.1.1 | CRUD de artículos (repuestos) | ✅ |
| RF-004.1.2 | Categorías jerárquicas de artículos | ✅ |
| RF-004.1.3 | Marcas de artículos | ✅ |
| RF-004.1.4 | Proveedores | ✅ |
| RF-004.1.5 | Almacenes (stores) | ✅ |

#### RF-004.2: Control de Stock

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-004.2.1 | Stock por combinación (artículo + almacén) | ✅ |
| RF-004.2.2 | Stock mínimo y máximo configurable | ✅ |
| RF-004.2.3 | Movimientos inmutables (IN/OUT) con referencia | ✅ |
| RF-004.2.4 | Stock solo cambia mediante movimientos aprobados | ✅ |
| RF-004.2.5 | Alertas de stock mínimo | 🔲 Pendiente |
| RF-004.2.6 | Dashboard de inventario en tiempo real (stats via WebSocket) | ✅ |

#### RF-004.3: Ingresos de Material (Material Receipt)

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-004.3.1 | Crear ingreso en estado DRAFT | ✅ |
| RF-004.3.2 | Editar solo en estado DRAFT | ✅ |
| RF-004.3.3 | Flujo: DRAFT → PENDING → APPROVED/REJECTED | ✅ |
| RF-004.3.4 | Al aprobar: genera Movement(IN) por cada ítem | ✅ |
| RF-004.3.5 | Cancelar (no si ya está APPROVED) | ✅ |
| RF-004.3.6 | Vinculación opcional con orden de compra | ✅ |

#### RF-004.4: Egresos de Material (Material Issue)

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-004.4.1 | Crear egreso en estado DRAFT | ✅ |
| RF-004.4.2 | Validación de stock disponible al aprobar | ✅ |
| RF-004.4.3 | Al aprobar: genera Movement(OUT) por cada ítem | ✅ |
| RF-004.4.4 | Vinculación con orden de reparación (destino) | ✅ |

#### RF-004.5: Transferencias entre Almacenes

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-004.5.1 | Transferir stock entre almacenes | ✅ |
| RF-004.5.2 | Validación: almacén origen ≠ destino | ✅ |
| RF-004.5.3 | Validación de stock en origen | ✅ |
| RF-004.5.4 | Operación atómica: OUT en origen + IN en destino | ✅ |

#### RF-004.6: Ajustes de Inventario

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-004.6.1 | Ajuste manual con razón obligatoria | ✅ |
| RF-004.6.2 | Establece cantidad exacta (SET) | ✅ |
| RF-004.6.3 | Genera Movement según diferencia (IN si positiva, OUT si negativa) | ✅ |

#### RF-004.7: Órdenes de Compra

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-004.7.1 | CRUD de órdenes de compra | ✅ |
| RF-004.7.2 | Flujo: DRAFT → SENT → CLOSED/CANCELLED | ✅ |
| RF-004.7.3 | NO genera movimientos (solo intención de compra) | ✅ |
| RF-004.7.4 | Vinculación informativa con Material Receipt | ✅ |

---

### RF-005: Catálogo de Servicios y Precios

**Prioridad:** Alta | **Estado:** ✅ Implementado

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-005.1 | CRUD de servicios (código único, descripción, precio base) | ✅ |
| RF-005.2 | Tipos de orden (Reparación Express, Garantía, Mantenimiento, etc.) | ✅ |
| RF-005.3 | Precios por combinación (servicio + tipo de orden + falla opcional) | ✅ |
| RF-005.4 | Buscar servicios disponibles para fallas de una orden | ✅ |
| RF-005.5 | Asignar servicio a orden → resuelve fallas vinculadas | ✅ |
| RF-005.6 | Eliminar servicio de orden → revierte fallas a PENDING | ✅ |
| RF-005.7 | Precio final ajustable por orden (independiente del catálogo) | ✅ |

---

### RF-006: Catálogo de Fallas (Mantenimiento)

**Prioridad:** Alta | **Estado:** ✅ Implementado

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-006.1 | CRUD de categorías de falla (Pantalla, Batería, Audio, etc.) | ✅ |
| RF-006.2 | CRUD de severidades (Crítica, Alta, Media, Baja) con prioridad numérica | ✅ |
| RF-006.3 | CRUD de códigos de falla (código único, tipo dispositivo, categoría, severidad) | ✅ |
| RF-006.4 | CRUD de acciones de reparación asociadas a códigos de falla | ✅ |
| RF-006.5 | Tiempo estimado de reparación por código de falla | ✅ |
| RF-006.6 | Indicador de si requiere repuestos | ✅ |

---

### RF-007: Seguimiento de Órdenes (Cliente)

**Prioridad:** Media | **Estado:** 🔲 Pendiente

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-007.1 | Cliente puede consultar estado de su orden por código | 🔲 Pendiente |
| RF-007.2 | Vista pública (sin login) con código de seguimiento | 🔲 Pendiente |
| RF-007.3 | Timeline visual del progreso de la reparación | 🔲 Pendiente |
| RF-007.4 | Fotos/comentarios del técnico visibles para el cliente | 🔲 Pendiente |
| RF-007.5 | Notificación al cliente cuando hay actualización | 🔲 Pendiente |

---

### RF-008: Pagos y Abonos

**Prioridad:** Media | **Estado:** 🔲 Pendiente

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-008.1 | Integración con Stripe para procesamiento de pagos | 🔲 Pendiente |
| RF-008.2 | Registro de pagos parciales (abonos) | 🔲 Pendiente |
| RF-008.3 | Abono inicial al crear la orden | 🔲 Pendiente |
| RF-008.4 | Pago final al entregar el dispositivo | 🔲 Pendiente |
| RF-008.5 | Historial de pagos por orden | 🔲 Pendiente |
| RF-008.6 | Generación de recibos/facturas (PDF) | 🔲 Pendiente |
| RF-008.7 | Métodos de pago: tarjeta, efectivo, transferencia | 🔲 Pendiente |
| RF-008.8 | Estado de pago en la orden (pendiente, parcial, pagado) | 🔲 Pendiente |
| RF-008.9 | Comisión configurable por transacción procesada | 🔲 Pendiente |

---

### RF-009: Notificaciones

**Prioridad:** Media | **Estado:** ✅ Parcial

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-009.1 | Notificaciones en tiempo real via WebSocket | ✅ |
| RF-009.2 | Notificación al cambiar estado de orden | ✅ (infraestructura lista) |
| RF-009.3 | Notificación al asignar técnico | 🔲 Pendiente |
| RF-009.4 | Notificación al cliente (email) cuando cambia estado | 🔲 Pendiente |
| RF-009.5 | Recordatorio de recogida (dispositivo listo) | 🔲 Pendiente |
| RF-009.6 | Notificaciones push (PWA / Firebase) | 🔲 Pendiente |
| RF-009.7 | Centro de notificaciones (historial, marcar como leída) | 🔲 Pendiente |
| RF-009.8 | Preferencias de notificación por usuario | 🔲 Pendiente |

---

### RF-010: Comunicación Interna (Chat)

**Prioridad:** Media | **Estado:** ✅ Implementado

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-010.1 | Chat en tiempo real entre usuarios del tenant | ✅ |
| RF-010.2 | Rooms por chat (1:1 o grupal) | ✅ |
| RF-010.3 | Indicador de "escribiendo..." (typing) | ✅ |
| RF-010.4 | Historial de mensajes | 🔲 Pendiente (persistencia) |
| RF-010.5 | Adjuntos en chat (imágenes, documentos) | 🔲 Pendiente |

---

### RF-011: Reseñas y Calificaciones

**Prioridad:** Baja | **Estado:** 🔲 Pendiente

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-011.1 | Cliente califica servicio al finalizar la orden (1-5 estrellas) | 🔲 Pendiente |
| RF-011.2 | Comentario opcional del cliente | 🔲 Pendiente |
| RF-011.3 | Calificación por técnico (desempeño) | 🔲 Pendiente |
| RF-011.4 | Promedio de calificación visible en perfil del taller | 🔲 Pendiente |
| RF-011.5 | Moderación de reseñas (admin puede ocultar) | 🔲 Pendiente |

---

### RF-012: Panel de Administración (Super Admin)

**Prioridad:** Media | **Estado:** ✅ Parcial

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-012.1 | Gestión de todos los tenants (crear, editar, activar/desactivar) | ✅ |
| RF-012.2 | Gestión de usuarios globales | ✅ |
| RF-012.3 | Monitoreo de métricas globales (tenants activos, órdenes totales) | 🔲 Pendiente |
| RF-012.4 | Control de suscripciones y planes | 🔲 Pendiente |
| RF-012.5 | Logs de auditoría global | 🔲 Pendiente |
| RF-012.6 | Configuración de planes y precios de suscripción | 🔲 Pendiente |

---

### RF-013: Reportes y Analítica

**Prioridad:** Media | **Estado:** 🔲 Pendiente

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-013.1 | Reporte de ingresos por período | 🔲 Pendiente |
| RF-013.2 | Reporte de tiempos de reparación (promedio, por tipo) | 🔲 Pendiente |
| RF-013.3 | Reporte de repuestos más usados | 🔲 Pendiente |
| RF-013.4 | Reporte de productividad por técnico | 🔲 Pendiente |
| RF-013.5 | Reporte de fallas más frecuentes por tipo de dispositivo | 🔲 Pendiente |
| RF-013.6 | Dashboard con KPIs en tiempo real | 🔲 Pendiente (stats via WebSocket listo) |
| RF-013.7 | Exportación de reportes (PDF, Excel) | 🔲 Pendiente |
| RF-013.8 | Reporte de órdenes por estado y período | 🔲 Pendiente |
| RF-013.9 | Reporte de clientes recurrentes | 🔲 Pendiente |

---

### RF-014: Subida de Archivos

**Prioridad:** Alta | **Estado:** ✅ Implementado

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-014.1 | Subida de imágenes (jpg, png, gif, webp) — máx 5MB | ✅ |
| RF-014.2 | Subida de documentos (pdf, doc, xls, txt) — máx 10MB | ✅ |
| RF-014.3 | Subida múltiple (hasta 10 archivos, 5MB c/u) | ✅ |
| RF-014.4 | Almacenamiento local (./uploads/) | ✅ |
| RF-014.5 | Migración a almacenamiento cloud (S3/GCS) | 🔲 Pendiente |

---

### RF-015: Log de Eventos y Auditoría

**Prioridad:** Alta | **Estado:** ✅ Implementado

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-015.1 | Registro de eventos por orden (quién, qué, cuándo) | ✅ |
| RF-015.2 | Eventos automáticos al cambiar estado | ✅ |
| RF-015.3 | Eventos al asignar/reasignar técnico | ✅ |
| RF-015.4 | Logging centralizado con Winston (archivos por fecha) | ✅ |
| RF-015.5 | Logs separados: combined, error, sql | ✅ |

---

## 6. Requisitos No Funcionales (RNF)

### RNF-001: Rendimiento

| ID | Requisito | Métrica |
|----|-----------|---------|
| RNF-001.1 | Tiempo de respuesta API < 500ms para operaciones CRUD | p95 < 500ms |
| RNF-001.2 | Tiempo de respuesta API < 2s para reportes complejos | p95 < 2000ms |
| RNF-001.3 | Soporte de al menos 100 usuarios concurrentes por tenant | Load test |
| RNF-001.4 | WebSocket: latencia de notificación < 200ms | p95 < 200ms |
| RNF-001.5 | Paginación obligatoria en listados (máx 100 items por página) | Validación DTO |

### RNF-002: Escalabilidad

| ID | Requisito | Descripción |
|----|-----------|-------------|
| RNF-002.1 | Arquitectura multi-tenant con BD independiente | Aislamiento total |
| RNF-002.2 | Pool de conexiones por tenant (lazy initialization) | Eficiencia de recursos |
| RNF-002.3 | Soporte para al menos 50 tenants simultáneos | Fase 1 |
| RNF-002.4 | Escalamiento horizontal del backend (stateless) | Cookies + JWT |
| RNF-002.5 | Caché de conexiones de BD activas | ConnectionDatabaseService |

### RNF-003: Seguridad

| ID | Requisito | Implementación |
|----|-----------|----------------|
| RNF-003.1 | Autenticación JWT con cookies httpOnly | ✅ Implementado |
| RNF-003.2 | Cifrado de passwords (bcrypt, cost factor ≥ 10) | ✅ Implementado |
| RNF-003.3 | Protección CSRF (sameSite: strict) | ✅ Implementado |
| RNF-003.4 | Protección XSS (httpOnly cookies) | ✅ Implementado |
| RNF-003.5 | HTTPS obligatorio en producción (secure cookies) | ✅ Configurado |
| RNF-003.6 | Validación de input en todos los endpoints (class-validator) | ✅ Implementado |
| RNF-003.7 | Queries parametrizadas (sin concatenación SQL) | ✅ TypeORM |
| RNF-003.8 | CORS configurado solo para FRONTEND_URL | ✅ Implementado |
| RNF-003.9 | Rate limiting en endpoints públicos | 🔲 Pendiente |
| RNF-003.10 | Auditoría de acceso (quién accedió a qué) | 🔲 Pendiente |
| RNF-003.11 | Encriptación de datos sensibles en BD (credenciales tenant) | 🔲 Pendiente |

---

### RNF-004: Disponibilidad y Confiabilidad

| ID | Requisito | Métrica |
|----|-----------|---------|
| RNF-004.1 | Uptime objetivo: 99.5% | Monitoreo |
| RNF-004.2 | Backups automáticos de BD (diarios) | Cron/Cloud |
| RNF-004.3 | Recuperación ante desastres < 4 horas (RTO) | Procedimiento |
| RNF-004.4 | Pérdida máxima de datos: 1 hora (RPO) | Backup frecuencia |
| RNF-004.5 | Graceful shutdown del servidor | NestJS lifecycle |
| RNF-004.6 | Health check endpoint | 🔲 Pendiente |

### RNF-005: Mantenibilidad

| ID | Requisito | Implementación |
|----|-----------|----------------|
| RNF-005.1 | Arquitectura modular (1 módulo = 1 feature) | ✅ NestJS modules |
| RNF-005.2 | Separación de capas (Controller → Service → Repository) | ✅ |
| RNF-005.3 | DTOs con validación para toda entrada | ✅ class-validator |
| RNF-005.4 | Logging estructurado con niveles (error, warn, info, debug) | ✅ Winston |
| RNF-005.5 | Código TypeScript estricto (no `any`) | Parcial |
| RNF-005.6 | Convenciones de nomenclatura documentadas | ✅ Steering files |
| RNF-005.7 | Cobertura de tests > 60% | 🔲 Pendiente |
| RNF-005.8 | Documentación de API (Swagger/OpenAPI) | 🔲 Pendiente |

### RNF-006: Usabilidad (Frontend)

| ID | Requisito | Descripción |
|----|-----------|-------------|
| RNF-006.1 | Diseño responsive (mobile-first) | Tailwind CSS |
| RNF-006.2 | Tiempo de carga inicial < 3 segundos | Lazy loading |
| RNF-006.3 | Feedback visual en operaciones (loading, success, error) | UX estándar |
| RNF-006.4 | Accesibilidad WCAG 2.1 nivel AA | Semántica + ARIA |
| RNF-006.5 | Soporte de idioma español (interfaz principal) | i18n ready |
| RNF-006.6 | Navegación intuitiva con breadcrumbs | UX |
| RNF-006.7 | Modo oscuro (opcional) | Tailwind dark mode |

### RNF-007: Compatibilidad

| ID | Requisito | Descripción |
|----|-----------|-------------|
| RNF-007.1 | Navegadores: Chrome 90+, Firefox 90+, Safari 14+, Edge 90+ | Evergreen browsers |
| RNF-007.2 | Node.js: v18+ (LTS) | Runtime |
| RNF-007.3 | PostgreSQL: v14+ | Base de datos |
| RNF-007.4 | API RESTful con JSON | Estándar HTTP |

### RNF-008: Despliegue y DevOps

| ID | Requisito | Estado |
|----|-----------|--------|
| RNF-008.1 | Containerización con Docker | 🔲 Pendiente |
| RNF-008.2 | Docker Compose para desarrollo local | 🔲 Pendiente |
| RNF-008.3 | CI/CD pipeline (build, test, deploy) | 🔲 Pendiente |
| RNF-008.4 | Variables de entorno para configuración (no hardcoded) | ✅ |
| RNF-008.5 | Ambientes separados: development, staging, production | Parcial (.env, .env.prod) |
| RNF-008.6 | Migrations de BD versionadas | 🔲 Pendiente (usa sync) |

---

## 7. Modelo de Datos

### 7.1 Base de Datos Global

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   users     │────▶│ user_tenants│◀────│   tenants    │
│             │     └─────────────┘     │              │
│  id         │                         │  id          │
│  name       │     ┌─────────────┐     │  name        │
│  username   │────▶│ user_roles  │     │  subdomain   │
│  email      │     └──────┬──────┘     │  databaseName│
│  password   │            │            │  dbHost/Port │
│  isActive   │            ▼            │  dbUser/Pass │
└─────────────┘     ┌─────────────┐     │  isActive    │
                    │   roles     │     └──────────────┘
                    │             │
                    │  id         │     ┌──────────────┐
                    │  name       │◀───▶│ permissions  │
                    │  description│     │              │
                    └─────────────┘     │  id          │
                                        │  key         │
┌─────────────┐     ┌──────────────┐    │  assignedBy  │
│  modules    │────▶│module_comps  │    │  userId (opt)│
│             │     └──────┬───────┘    │  componentId │
│  id         │            │            └──────────────┘
│  name       │            ▼
│  icon       │     ┌──────────────┐
└─────────────┘     │ components   │
                    │              │
                    │  id, label   │
                    │  componentKey│
                    │  path, action│
                    │  type (G/T)  │
                    └──────────────┘
```

### 7.2 Base de Datos por Tenant (Branch)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  customers   │────▶│   orders     │◀────│ technicians  │
└──────────────┘     │              │     └──────────────┘
                     │  order_code  │
                     │  status      │     ┌──────────────┐
                     │  priority    │────▶│ order_types  │
                     │  costs...    │     └──────────────┘
                     └──────┬───────┘
                            │
              ┌─────────────┼─────────────────┐
              ▼             ▼                  ▼
     ┌──────────────┐ ┌──────────┐    ┌──────────────┐
     │   devices    │ │  issues  │    │    notes     │
     │              │ │(OrderIssue)    │              │
     │  serial_num  │ │  title   │    │  content     │
     │  imei        │ │  status  │    │  type        │
     │  model       │ │  failure │    │  author      │
     └──────────────┘ │  _code_id│    └──────────────┘
                      └────┬─────┘
                           │ N:N
                      ┌────▼─────────────┐
                      │  order_services  │
                      │                  │
                      │  service_id      │
                      │  price           │
                      │  estimated_min   │
                      └────┬─────────────┘
                           │
                      ┌────▼─────────────┐
                      │    services      │
                      │                  │
                      │  code (unique)   │
                      │  description     │
                      │  base_price      │
                      └──────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  articles    │────▶│  inventory   │◀────│   stores     │
│              │     │              │     │              │
│  name        │     │  stock       │     │  name        │
│  category_id │     │  min_stock   │     │  location    │
│  brand_id    │     │  max_stock   │     └──────────────┘
└──────────────┘     └──────────────┘
                            │
                     ┌──────▼───────┐
                     │  movements   │
                     │              │
                     │  type(IN/OUT)│
                     │  quantity    │
                     │  refType     │
                     │  refId       │
                     └──────────────┘

┌────────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ material_receipts  │  │ material_issues │  │ stock_transfers │
│ (ingreso)          │  │ (egreso)        │  │ (transferencia) │
│                    │  │                 │  │                 │
│ status: DRAFT →    │  │ status: DRAFT → │  │ fromStore       │
│   PENDING →        │  │   PENDING →     │  │ toStore         │
│   APPROVED         │  │   APPROVED      │  │ status...       │
└────────────────────┘  └─────────────────┘  └─────────────────┘

┌────────────────────┐  ┌─────────────────┐
│ failure_codes      │  │ failure_categories│
│                    │  └─────────────────┘
│ code (SCR-001)     │  ┌─────────────────┐
│ device_type_id     │  │ failure_severities│
│ category_id        │  └─────────────────┘
│ severity_id        │  ┌─────────────────┐
│ repair_actions[]   │  │ repair_actions  │
└────────────────────┘  └─────────────────┘
```

---

## 8. Matriz de Trazabilidad

Relación entre requisitos funcionales y módulos implementados:

| RF | Módulo Backend | Entidades | Estado |
|----|---------------|-----------|--------|
| RF-001 | `auth`, `global/user`, `global/permission` | User, Role, Permission, Tenant, Modules, Components | ✅ Core listo |
| RF-002 | `customer`, `technician` | Customer, Technician | ✅ CRUD listo |
| RF-003 | `order`, `order-service`, `log-events` | Order, OrderIssue, Device, Note, LogEvents, StatusHistory | ✅ Completo |
| RF-004 | `inventory/*` (8 sub-módulos) | Inventory, Movement, MaterialReceipt/Issue, StockTransfer, etc. | ✅ Completo |
| RF-005 | `services` | Service, OrderType, ServiceOrderType | ✅ Completo |
| RF-006 | `maintenance` | FailureCode, FailureCategory, FailureSeverity, RepairAction | ✅ Completo |
| RF-007 | — | — | 🔲 No iniciado |
| RF-008 | — | — | 🔲 No iniciado |
| RF-009 | `realtime` | — (in-memory) | ✅ Infraestructura |
| RF-010 | `realtime` | — (in-memory) | ✅ Parcial |
| RF-011 | — | — | 🔲 No iniciado |
| RF-012 | `global/tenant`, `global/user` | Tenant, User | ✅ Parcial |
| RF-013 | — | — | 🔲 No iniciado |
| RF-014 | `upload` | — (filesystem) | ✅ Completo |
| RF-015 | `log-events` | LogEvents | ✅ Completo |

---

## 9. Roadmap y Priorización

### Fase 1 — MVP (Actual) ✅

> Core del negocio: gestionar órdenes de reparación con inventario

- [x] Autenticación multi-tenant con JWT + cookies
- [x] CRUD de usuarios, roles y permisos
- [x] CRUD de clientes y técnicos
- [x] Gestión completa de órdenes (crear, estados, fallas, servicios)
- [x] Catálogo de fallas y servicios con precios
- [x] Inventario completo (ingresos, egresos, transferencias, ajustes)
- [x] WebSocket para notificaciones y chat básico
- [x] Subida de archivos
- [x] Logging y auditoría

### Fase 2 — Experiencia del Cliente (Próxima)

> Abrir la plataforma al cliente final

- [ ] Portal de seguimiento público (por código de orden)
- [ ] Landing page para registro de problemas
- [ ] Notificaciones por email al cliente
- [ ] Validación de transiciones de estado
- [ ] Guard de permisos en backend (endpoint-level)
- [ ] Refresh token
- [ ] Health check endpoint
- [ ] Documentación Swagger/OpenAPI

### Fase 3 — Monetización y Pagos

> Generar ingresos y facilitar cobros

- [ ] Integración Stripe (pagos y abonos)
- [ ] Sistema de suscripciones por tenant
- [ ] Generación de recibos/facturas PDF
- [ ] Reportes financieros básicos

### Fase 4 — Analítica y Optimización

> Datos para tomar decisiones

- [ ] Dashboard con KPIs en tiempo real
- [ ] Reportes de productividad, tiempos, fallas frecuentes
- [ ] Exportación PDF/Excel
- [ ] Alertas de stock mínimo
- [ ] Reseñas y calificaciones

### Fase 5 — Escala y DevOps

> Preparar para producción a escala

- [ ] Docker + Docker Compose
- [ ] CI/CD pipeline
- [ ] Migrations versionadas (dejar sync)
- [ ] Rate limiting
- [ ] Almacenamiento cloud (S3)
- [ ] Encriptación de credenciales de tenant
- [ ] Monitoreo y alertas (APM)

---

## 10. Glosario

| Término | Definición |
|---------|-----------|
| **Tenant** | Instancia de un taller/sucursal con su propia base de datos |
| **Orden** | Solicitud de reparación de uno o más dispositivos |
| **OrderIssue** | Falla reportada en un dispositivo dentro de una orden |
| **OrderService** | Servicio aplicado a una orden para resolver una o más fallas |
| **FailureCode** | Código del catálogo maestro que clasifica una falla |
| **Movement** | Registro inmutable de entrada (IN) o salida (OUT) de inventario |
| **Material Receipt** | Documento de ingreso de material al almacén |
| **Material Issue** | Documento de egreso de material del almacén |
| **Stock Transfer** | Movimiento de material entre almacenes |
| **Inventory Adjustment** | Corrección manual de stock con justificación |
| **Purchase Order** | Intención de compra (no genera movimientos) |
| **Store** | Almacén físico o lógico donde se almacena inventario |
| **ServiceOrderType** | Precio de un servicio para un tipo de orden + falla específica |
| **Guard** | Middleware de NestJS que protege rutas según autenticación/autorización |
| **DTO** | Data Transfer Object — estructura validada para entrada de datos |

---

## Apéndice A: Endpoints Implementados

### Autenticación (`/auth`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/login` | Login → cookie temporal |
| POST | `/register` | Registro de usuario |
| POST | `/select-tenant` | Seleccionar tenant → cookie completa |
| POST | `/switch-tenant` | Cambiar de tenant |
| POST | `/logout-tenant` | Logout de tenant |
| POST | `/logout` | Logout completo |

### Órdenes (`/orders`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/create` | Crear orden completa |
| GET | `/all` | Listar con paginación |
| GET | `/:order_code` | Obtener por código |
| POST | `/issues/create` | Agregar falla |
| POST | `/assign` | Asignar técnico |

### Servicios de Orden (`/orders-service`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/all` | Listar |
| GET | `/:id` | Por ID |
| GET | `/order/:order_id` | Por orden |
| POST | `/create` | Crear (resuelve fallas) |
| PUT | `/:id` | Actualizar |
| DELETE | `/:id` | Eliminar (revierte fallas) |

### Catálogo de Servicios (`/services`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Listar todos |
| POST | `/` | Crear |
| POST | `/available` | Servicios disponibles para fallas |
| CRUD | `/order-types/*` | Tipos de orden |
| CRUD | `/service-order-types/*` | Precios |

### Inventario (`/material-receipts`, `/material-issues`, `/stock-transfers`, `/inventory-adjustments`, `/purchase-orders`)
| Patrón | Descripción |
|--------|-------------|
| GET `/all` | Listar con paginación |
| GET `/:id` | Obtener por ID |
| POST `/create` | Crear (DRAFT) |
| PATCH `/update/:id` | Editar (solo DRAFT) |
| PATCH `/approve/:id` | Aprobar → genera movimientos |
| PATCH `/reject/:id` | Rechazar |
| PATCH `/cancel/:id` | Cancelar |

### Mantenimiento (`/maintenance`)
| Patrón | Recursos |
|--------|----------|
| CRUD | `/failure-categories`, `/failure-codes`, `/failure-severities`, `/repair-actions` |

### Otros
| Ruta | Descripción |
|------|-------------|
| `/customers` | CRUD clientes |
| `/technicians` | CRUD técnicos |
| `/info-devices` | Marcas, modelos, tipos de dispositivo |
| `/upload` | Subida de archivos |
| `/global/tenants` | Gestión de tenants |
| `/global/users` | Gestión de usuarios |
| `/global/permissions` | Gestión de permisos |

---

## Apéndice B: Variables de Entorno

```env
# Aplicación
NODE_ENV=development|production
FRONTEND_URL=http://localhost:5173

# Autenticación
JWT_SECRET=<secret>

# Base de datos global
GLOBAL_DB_HOST=localhost
GLOBAL_DB_PORT=5432
GLOBAL_DB_USERNAME=postgres
GLOBAL_DB_PASSWORD=<password>
GLOBAL_DB_DATABASE=fixsite_global
```

> Las credenciales de cada tenant se almacenan en la tabla `tenants` de la BD global.

---

## Apéndice C: Decisiones Arquitectónicas (ADR)

### ADR-001: Multi-tenant con BD separada
- **Contexto:** Necesidad de aislamiento total de datos entre talleres
- **Decisión:** Una BD PostgreSQL por tenant
- **Consecuencia:** Mayor complejidad operativa, pero aislamiento y seguridad máximos

### ADR-002: JWT en cookies httpOnly
- **Contexto:** Protección contra XSS y CSRF
- **Decisión:** Token en cookie httpOnly + sameSite strict
- **Consecuencia:** Frontend debe usar `withCredentials: true`; no se puede leer el token desde JS

### ADR-003: Movimientos inmutables de inventario
- **Contexto:** Necesidad de trazabilidad y auditoría
- **Decisión:** Movement solo tiene tipo IN/OUT, nunca se edita ni elimina
- **Consecuencia:** El stock se deriva de movimientos; cualquier corrección requiere un ajuste formal

### ADR-004: Separación Order vs OrderService vs OrderIssue
- **Contexto:** Una orden puede tener múltiples fallas y múltiples servicios
- **Decisión:** Relación N:N entre OrderService y OrderIssue
- **Consecuencia:** Flexibilidad para que un servicio resuelva varias fallas y una falla sea cubierta por varios servicios

---

*Documento generado el 26 de mayo de 2026. Actualizar conforme avance el desarrollo.*
