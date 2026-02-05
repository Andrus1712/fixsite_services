# Guía de Autenticación con Cookies JWT

## Cambios Implementados

### Backend (NestJS)

1. **Configuración de Cookies Seguras**:
   - `httpOnly: true` - Previene acceso desde JavaScript del cliente
   - `secure: true` - Solo HTTPS en producción
   - `sameSite: 'strict'` - Protección CSRF
   - Tiempos de expiración apropiados

2. **Cookie de Autenticación**:
   - `access_token`: Token de acceso (24 horas)
     - Inicialmente sin tenant (tenantId: null)
     - Se actualiza con tenantId al seleccionar tenant
     - Permite operaciones generales y específicas de tenant

3. **Endpoints Modificados**:
   - `POST /auth/login` - Establece cookie de acceso (sin tenant)
   - `POST /auth/select-tenant` - Actualiza cookie con tenantId
   - `POST /auth/switch-tenant` - Cambia tenantId en cookie
   - `POST /auth/logout-tenant` - Remueve tenantId de cookie
   - `POST /auth/logout` - Limpia cookie de acceso

4. **Guards Disponibles**:
   - `FullTokenGuard` - Requiere token válido (con o sin tenant)
   - `TenantRequiredGuard` - Requiere token con tenant seleccionado

### Frontend (Recomendaciones)

#### 1. Configuración de Axios/Fetch
```javascript
// Axios
axios.defaults.withCredentials = true;

// Fetch
fetch('/api/endpoint', {
  credentials: 'include'
});
```

#### 2. Eliminar Manejo Manual de Tokens
```javascript
// ❌ ANTES - Manual token management
localStorage.setItem('token', response.data.token);
headers: { Authorization: `Bearer ${token}` }

// ✅ AHORA - Automático con cookies
// No necesitas manejar tokens manualmente
```

#### 3. Interceptores de Respuesta
```javascript
// Axios interceptor para manejar errores 401
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirigir a login - las cookies se limpiarán automáticamente
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

#### 4. Verificación de Autenticación
```javascript
// ❌ ANTES
const isAuthenticated = !!localStorage.getItem('token');

// ✅ AHORA - Verificar con endpoint
const checkAuth = async () => {
  try {
    await axios.get('/auth/profile');
    return true;
  } catch {
    return false;
  }
};
```

## Beneficios de Seguridad

1. **Protección XSS**: Cookies httpOnly no son accesibles desde JavaScript
2. **Protección CSRF**: SameSite=strict previene ataques cross-site
3. **Transmisión Segura**: Secure flag en producción (HTTPS)
4. **Expiración Automática**: Cookies expiran automáticamente
5. **No Exposición**: Tokens no están en localStorage/sessionStorage

## Uso de Guards

```typescript
// Para operaciones generales (sin tenant requerido)
@Get('users')
@UseGuards(FullTokenGuard)
getUsers() {
  // Puede acceder con o sin tenant
}

// Para operaciones específicas de tenant
@Get('tenant-data')
@UseGuards(TenantRequiredGuard)
getTenantData(@Request() req) {
  const tenantId = req.user.tenantId; // Garantizado que existe
}
```

## Variables de Entorno Requeridas

```env
NODE_ENV=development|production
FRONTEND_URL=http://localhost:3001
JWT_SECRET=tu_jwt_secret_aqui
```

## Migración del Frontend

### Pasos Necesarios:

1. **Habilitar credentials en requests**
2. **Remover manejo manual de tokens**
3. **Actualizar interceptores de error**
4. **Modificar verificación de autenticación**
5. **Probar flujo completo**

### Ejemplo de Migración:

```javascript
// ANTES
const login = async (credentials) => {
  const response = await axios.post('/auth/login', credentials);
  localStorage.setItem('token', response.data._token);
  return response.data;
};

// DESPUÉS
const login = async (credentials) => {
  const response = await axios.post('/auth/login', credentials, {
    withCredentials: true
  });
  // Token se maneja automáticamente en cookies
  return response.data;
};
```

## Testing

Para probar la implementación:

1. Verificar que las cookies se establecen correctamente en DevTools
2. Confirmar que los requests incluyen cookies automáticamente
3. Probar logout y verificar que las cookies se limpian
4. Verificar comportamiento en diferentes navegadores