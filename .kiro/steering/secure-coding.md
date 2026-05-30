# FixSite – Desarrollo Seguro

Guía de seguridad para prevenir vulnerabilidades comunes (OWASP Top 10, CWEs críticos) en el contexto de NestJS + TypeORM + PostgreSQL multi-tenant.

---

## 1. Inyección (SQL, NoSQL, Command)

- **NUNCA** concatenar valores en queries SQL/TypeORM. Usar siempre parámetros nombrados:
  ```typescript
  // ✅ Correcto
  qb.where('order.id = :id', { id });

  // ❌ Prohibido
  qb.where(`order.id = ${id}`);
  ```
- **NUNCA** usar `query()` con interpolación de strings. Si se necesita raw SQL, usar parámetros posicionales:
  ```typescript
  await connection.query('SELECT * FROM orders WHERE id = $1', [id]);
  ```
- **NUNCA** ejecutar comandos del sistema (`exec`, `spawn`, `child_process`) con input del usuario sin sanitizar.
- Preferir métodos de TypeORM (`find`, `findOne`, `createQueryBuilder`) sobre raw SQL.

---

## 2. Autenticación y Sesiones

- Tokens JWT deben tener expiración corta (≤ 24h para temp, ≤ 8h para full).
- **NUNCA** almacenar secretos (JWT_SECRET, DB passwords) en código fuente — solo `.env`.
- **NUNCA** loguear tokens, passwords o datos sensibles.
- Usar `httpOnly`, `secure`, y `sameSite: 'strict'` en cookies (ya configurado).
- Validar que el `tenantId` del token coincida con el tenant solicitado en cada operación.

---

## 3. Autorización y Control de Acceso

- **SIEMPRE** usar guards (`TenantSelectionGuard`, `FullTokenGuard`) en controladores.
- **NUNCA** confiar en datos del cliente para determinar permisos — validar en backend.
- Verificar que el usuario tiene acceso al tenant antes de ejecutar operaciones.
- En operaciones sensibles (delete, approve), validar roles/permisos explícitamente.
- Prevenir IDOR (Insecure Direct Object Reference): al acceder a un recurso por ID, verificar que pertenece al tenant actual.

---

## 4. Validación de Entrada

- **SIEMPRE** usar DTOs con `class-validator` en todos los endpoints que reciben body/params.
- Activar `ValidationPipe` global con `whitelist: true` y `forbidNonWhitelisted: true`:
  ```typescript
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  ```
- Validar tipos numéricos con `ParseIntPipe` en `@Param()`.
- Limitar longitud de strings con `@MaxLength()`.
- Validar formatos (email, UUID, URL) con decoradores específicos.
- Sanitizar HTML/scripts en campos de texto libre si se renderizan en frontend.

---

## 5. Exposición de Datos Sensibles

- **NUNCA** retornar passwords, tokens, o secretos en respuestas HTTP.
- Usar `@Exclude()` de `class-transformer` en campos sensibles de entidades.
- No exponer stack traces ni detalles internos en errores de producción — usar `HttpExceptionFilter`.
- No retornar queries SQL ni nombres de tablas en mensajes de error.
- Loguear errores internos con Winston pero retornar mensajes genéricos al cliente.

---

## 6. Protección contra XSS y CSRF

- Cookies con `httpOnly: true` previenen acceso desde JavaScript (ya configurado).
- `sameSite: 'strict'` previene CSRF (ya configurado).
- Si se almacena HTML del usuario, sanitizar con una librería (ej: `sanitize-html`) antes de guardar.
- Configurar headers de seguridad con `helmet`:
  ```typescript
  import helmet from 'helmet';
  app.use(helmet());
  ```

---

## 7. Rate Limiting y DoS

- Implementar rate limiting en endpoints públicos y de autenticación:
  ```typescript
  import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

  ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]) // 10 req/min
  ```
- Limitar tamaño de payload (`app.use(json({ limit: '1mb' }))`).
- Limitar cantidad de items en arrays del body (ej: `@ArrayMaxSize(50)`).
- Endpoints de login deben tener throttling más agresivo (5 intentos/min).

---

## 8. Seguridad en Uploads

- **SIEMPRE** validar extensión Y MIME type del archivo (no confiar solo en extensión).
- Limitar tamaño máximo (ya configurado: 5MB imágenes, 10MB documentos).
- Generar nombres de archivo aleatorios (UUID) — nunca usar el nombre original del usuario.
- Almacenar uploads fuera del directorio de código fuente.
- No servir archivos directamente sin validar acceso.

---

## 9. Dependencias y Supply Chain

- Mantener dependencias actualizadas (`npm audit` periódicamente).
- Usar versiones exactas en `package.json` (no rangos abiertos como `^` o `~` en producción).
- No instalar paquetes desconocidos o con nombres sospechosos sin verificar.
- Revisar changelogs antes de actualizar dependencias mayores.

---

## 10. Multi-Tenant: Aislamiento de Datos

- **CRÍTICO**: Cada query DEBE ejecutarse contra la conexión del tenant correcto.
- **NUNCA** mezclar datos entre tenants — el `DataSource` se obtiene via `ConnectionDatabaseService`.
- Validar que `tenant.id` del token JWT coincide con el tenant resuelto por middleware.
- En WebSockets, verificar tenant antes de unirse a rooms o emitir eventos.
- Loguear `tenantId` en cada operación para auditoría.

---

## 11. Logging y Auditoría

- Loguear acciones sensibles: login, logout, cambios de permisos, aprobaciones de inventario, eliminaciones.
- **NUNCA** loguear: passwords, tokens JWT completos, números de tarjeta, datos PII sin enmascarar.
- Incluir en logs: `userId`, `tenantId`, `action`, `resourceId`, `timestamp`, `ip`.
- Rotar logs periódicamente (ya configurado con Winston daily rotate).

---

## 12. Configuración Segura

- `NODE_ENV=production` en producción (desactiva stack traces, habilita optimizaciones).
- CORS restringido a dominios conocidos (`FRONTEND_URL`), no usar `origin: '*'` en producción.
- Deshabilitar `X-Powered-By` header (helmet lo hace automáticamente).
- No exponer endpoints de debug, health-check detallado, o documentación Swagger en producción sin autenticación.

---

## 13. Manejo de Errores Seguro

- Usar `HttpExceptionFilter` global para formatear errores consistentemente.
- En producción, retornar solo `message` genérico — nunca el error original de la DB o del runtime.
- Capturar errores de TypeORM (constraint violations, connection errors) y mapear a HTTP status apropiados:
  ```typescript
  // ✅ Correcto
  catch (error) {
    if (error.code === '23505') throw new ConflictException('El recurso ya existe');
    throw new InternalServerErrorException('Error interno del servidor');
  }
  ```

---

## 14. Secrets Management

- Variables sensibles solo en `.env` (nunca en código, nunca en git).
- `.env` debe estar en `.gitignore`.
- En producción, usar variables de entorno del sistema o un secrets manager (AWS Secrets Manager, Vault).
- Rotar secretos (JWT_SECRET, DB passwords) periódicamente.

---

## Checklist Rápido (antes de cada PR)

- [ ] ¿Todos los inputs están validados con DTOs?
- [ ] ¿Las queries usan parámetros nombrados (no interpolación)?
- [ ] ¿El endpoint tiene guard de autenticación?
- [ ] ¿Se verifica que el recurso pertenece al tenant actual?
- [ ] ¿Los errores no exponen detalles internos?
- [ ] ¿No se loguean datos sensibles?
- [ ] ¿Los uploads validan tipo y tamaño?
- [ ] ¿Las dependencias nuevas son conocidas y confiables?
