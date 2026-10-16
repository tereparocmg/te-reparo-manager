# Guía de Despliegue en Railway — Te Reparo Manager

Esta guía describe paso a paso cómo publicar la aplicación **Te Reparo Manager** en Railway como una aplicación web 100% online con base de datos PostgreSQL.

---

## 1. Requisitos previos

- Una cuenta en [Railway.app](https://railway.app) (puedes registrarte con GitHub).
- El código del proyecto en un repositorio de GitHub (recomendado) o disponible localmente.
- Node.js 20+ instalado localmente para pruebas.

---

## 2. Arquitectura del despliegue

```
┌─────────────────────────────────────────────────────────┐
│                    Railway Project                       │
│                                                          │
│  ┌────────────────────┐       ┌────────────────────┐    │
│  │   Web Service      │       │     PostgreSQL     │    │
│  │   (Next.js app)    │ ────▶ │   Plugin (Railway) │    │
│  │   - Dockerfile     │       │                    │    │
│  │   - Next.js stdbg  │       │   DATABASE_URL auto │    │
│  │   - Prisma migrate │       │   - Variable inyectada │
│  └────────────────────┘       └────────────────────┘    │
│           │                                              │
│           ▼                                              │
│  https://te-reparo-manager.up.railway.app               │
└─────────────────────────────────────────────────────────┘
```

**Componentes:**

1. **PostgreSQL Plugin**: base de datos gestionada por Railway.
2. **Web Service**: tu aplicación Next.js empaquetada con el `Dockerfile` incluido en el repo.
3. **Variables de entorno**: `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV`, `PORT`.

---

## 3. Pasos de despliegue

### Paso 1 — Subir el código a GitHub

Si todavía no tienes el código en un repo:

```bash
cd /ruta/al/proyecto
git init
git add .
git commit -m "Convertir a app web 100% online con PostgreSQL"
git branch -M main
git remote add origin https://github.com/USUARIO/te-reparo-manager.git
git push -u origin main
```

> **Importante:** Verifica que `.env` esté en `.gitignore` (ya lo está por defecto). Railway inyectará su propia `DATABASE_URL`.

### Paso 2 — Crear proyecto en Railway

1. Ve a [railway.app](https://railway.app) e inicia sesión.
2. Clic en **New Project** (esquina superior derecha).
3. Selecciona **Provision PostgreSQL**. Railway crea la base de datos y muestra la variable `DATABASE_URL` (privada).

### Paso 3 — Agregar el Web Service

1. En el mismo proyecto, clic en **New → GitHub Repo**.
2. Selecciona el repositorio `te-reparo-manager`.
3. Railway detecta automáticamente el `Dockerfile` y construye la imagen.
4. Espera 2-5 minutos hasta que el build termine.

### Paso 4 — Configurar variables de entorno

Ve a **Settings → Variables** del Web Service y agrega:

| Variable | Valor | Notas |
|---|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Referencia a la BD. Railway la autocompleta. |
| `SESSION_SECRET` | una cadena aleatoria de 64+ caracteres | Ej: `openssl rand -hex 32` |
| `NODE_ENV` | `production` | |
| `PORT` | `3000` | Railway inyecta su propio puerto, pero Next.js lo respeta. |

> **Tip:** Para referenciar `DATABASE_URL` del plugin PostgreSQL, clic en "Add Variable Reference" y selecciona `Postgres.DATABASE_URL`. Railway resuelve la referencia automáticamente.

### Paso 5 — Ajustar el dominio

1. En el Web Service, ve a **Settings → Networking → Generate Domain**.
2. Railway te da una URL tipo `https://te-reparo-manager-production.up.railway.app`.
3. (Opcional) Agrega un dominio propio en **Custom Domain** (requiere plan Pro).

### Paso 6 — Aplicar migraciones y seed

Las migraciones se aplican automáticamente al iniciar el contenedor (gracias a `npx prisma migrate deploy && node server.js` en el `Dockerfile`). Sin embargo, como es la primera vez que se despliega y no hay migrations committeadas todavía, necesitas hacerlo manualmente una vez:

**Opción A — Desde Railway (recomendada):**

1. Ve al Web Service → pestaña **Settings → Deploy → Start Command**.
2. Modifícala temporalmente a: `npx prisma db push --accept-data-loss && node scripts/seed-postgres.js && node server.js`
3. Clic en **Save** y espera al próximo deploy.
4. Una vez aplicado el seed, vuelve a poner el Start Command a: `npx prisma db push && node server.js` (sin seed).

**Opción B — Desde tu PC:**

```bash
# 1. Obtener la URL pública de PostgreSQL (Railway → Connect → PostgreSQL URL)
export DATABASE_URL="postgresql://postgres:PASSWORD@ORIGEN.railway.app:5432/railway"

# 2. Crear las tablas
npx prisma db push

# 3. Sembrar con datos de demostración
node scripts/seed-postgres.js
```

### Paso 7 — Verificar

1. Abre la URL pública del despliegue.
2. Deberías ver la pantalla de login de Te Reparo.
3. Inicia sesión con una de las cuentas demo:
   - `superadmin@tereparo.mx / admin123` (SUPER_ADMIN)
   - `admin.centro@tereparo.mx / admin123` (ADMIN)
   - `vendedor@tereparo.mx / vendedor123` (VENDEDOR)
4. Si todo funciona, deberías ver el dashboard con datos demo.

---

## 4. Configuración de `railway.json`

El repo incluye un archivo `railway.json` con la configuración recomendada:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "npx prisma migrate deploy && node server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3,
    "healthcheckPath": "/api",
    "healthcheckTimeout": 30
  }
}
```

Si necesitas cambiar el comando de arranque (por ejemplo, para ejecutar el seed una vez), puedes sobreescribirlo desde **Settings → Deploy → Start Command** en el panel de Railway.

---

## 5. Dockerfile (incluido en el repo)

El `Dockerfile` es multi-estadio:

1. **deps**: instala dependencias de `package.json`.
2. **builder**: compila Next.js en modo `standalone`.
3. **runner**: imagen final alpine con `prisma`, `next` standalone, y `node_modules`.

El comando de arranque es:

```bash
npx prisma migrate deploy && node server.js
```

Esto asegura que el esquema de la BD esté siempre actualizado al iniciar.

---

## 6. Variables de entorno — referencia completa

| Variable | Obligatoria | Default | Descripción |
|---|---|---|---|
| `DATABASE_URL` | Sí | — | URL de PostgreSQL (la inyecta Railway al agregar el plugin). |
| `SESSION_SECRET` | Sí | `tereparo-dev-secret-change-me` | Secreto HMAC para firmar cookies de sesión. **Cámbialo en producción.** |
| `NODE_ENV` | Recomendada | `development` | `production` en Railway. |
| `PORT` | Opcional | `3000` | Puerto donde escucha Next.js. Railway inyecta su propio PORT; ignora este si procede. |

---

## 7. Operaciones comunes

### 7.1. Ver logs en vivo

- Ve al Web Service → pestaña **Logs**.
- Verás el output de `next build` y luego de `node server.js`.
- Para logs en vivo: `railway logs` (CLI) o panel web.

### 7.2. Resetear la base de datos

```bash
# Con CLI:
railway run npx prisma db push --force-reset --accept-data-loss
railway run node scripts/seed-postgres.js
```

O desde el panel: **PostgreSQL → Data → Reset Database**.

### 7.3. Conectarse a la BD con Prisma Studio

```bash
# Asegúrate de tener DATABASE_URL apuntando a la BD de Railway
npx prisma studio
```

Se abre en `http://localhost:5555` y puedes editar registros directamente.

### 7.4. Modificar el esquema

1. Edita `prisma/schema.prisma`.
2. Commit & push a `main`.
3. Railway redeploya; el `startCommand` ejecutará `prisma migrate deploy`.
4. Si rompe por cambios destructivos, en tu local:
   ```bash
   npx prisma migrate dev --name nombre_cambio
   ```
   Esto genera un migration SQL en `prisma/migrations/`. Commitea ese directorio para que `migrate deploy` lo aplique.

### 7.5. Escalar (más instancias)

- Ve a **Settings → Scaling → Multi-Replica**.
- Recomendado solo con plan Pro. Cuidado: las cookies son firmadas con HMAC sin estado, así que múltiples réplicas funcionan correctamente.

---

## 8. Solución de problemas comunes

### 8.1. "Cannot connect to database"

- Verifica que `DATABASE_URL` esté correctamente referenciada (`${{Postgres.DATABASE_URL}}`).
- En PostgreSQL → **Connect**, copia la URL pública y prueba con `psql`:
  ```bash
  psql "postgresql://..."
  ```
- Si la BD está en sleep mode (plan gratuito), despiértala con cualquier query.

### 8.2. Build falla con "Prisma generate failed"

- Verifica que `prisma/schema.prisma` no tenga errores de sintaxis.
- Asegúrate de que `postinstall` en `package.json` ejecute `prisma generate` (ya lo hace).
- A veces la primera build falla; intenta un redeploy.

### 8.3. Login no funciona (401)

- Verifica que `SESSION_SECRET` esté seteada y sea la misma en todos los deploys.
- Borra las cookies del navegador y reintenta.
- Verifica con `curl`:
  ```bash
  curl -i -X POST https://TU_DOMINIO.railway.app/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"superadmin@tereparo.mx","password":"admin123"}'
  ```
  Debes recibir `Set-Cookie: tereparo_session=...` en la respuesta.

### 8.4. El seed no aplicó

- Verifica los logs del Web Service.
- Si el seed falla por FK, suele ser porque las tablas no están creadas todavía. Ejecuta primero `npx prisma db push` manualmente y luego el seed.
- Alternativa: borra todo desde el panel de Railway → PostgreSQL → Reset, y vuelve a hacer el seed.

### 8.5. El deploy es lento (>10 min)

- Activa **Railway Build Cache** (gratis).
- Verifica que `.dockerignore` excluya `node_modules` y `.next` locales (importante!).
- Considera quitar dependencias pesadas si no se usan (ej: `better-sqlite3`, `socket.io-client` — ya eliminadas en este repo).

---

## 9. Costos estimados (Railway)

| Plan | Precio mensual | Recursos | Recomendado para |
|---|---|---|---|
| **Free Trial** | $0 (5 días, $5 de crédito) | 512MB RAM, shared CPU | Probar la app |
| **Hobby** | $5/mes | 8GB RAM, 8 vCPU (compartido), 5GB egress | Producción baja |
| **Pro** | $20/mes | 8GB RAM, 8 vCPU, ejecuciones ilimitadas | Producción media |
| **Enterprise** | Custom | SLA, soporte, private networking | Producción alta |

La base de datos PostgreSQL en plan Hobby ofrece hasta 1GB de almacenamiento — suficiente para miles de ventas y servicios.

---

## 10. Backup y restore

### Backup

```bash
# Desde tu PC, con DATABASE_URL apuntando a Railway:
pg_dump "$DATABASE_URL" > backup_$(date +%F).sql
```

### Restore

```bash
psql "$DATABASE_URL" < backup_2026-10-13.sql
```

> Railway también permite snapshots automáticos en el panel → PostgreSQL → Backups (plan Pro).

---

## 11. Despliegue continuo (CI/CD)

Railway despliega automáticamente en cada push a `main` de tu repo de GitHub. Para evitar deploys en ramas de feature, configura **Settings → Deploy → Watch Paths**:

```
!prisma/**
!src/**
!package.json
!Dockerfile
```

Y en **Environment → Promote**: promueve manualmente de `staging` a `production` cuando un deploy sea estable.

---

## 12. Checklist final

- [ ] Repositorio subido a GitHub.
- [ ] Proyecto creado en Railway con plugin PostgreSQL.
- [ ] Web Service enlazado al repo.
- [ ] Variables `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV`, `PORT` configuradas.
- [ ] Dominio generado (URL pública).
- [ ] Migraciones aplicadas (`npx prisma db push` o `migrate deploy`).
- [ ] Seed ejecutado (`node scripts/seed-postgres.js`).
- [ ] Login funciona y se ve el dashboard con datos demo.
- [ ] Backup inicial descargado.

¡Listo! Tu **Te Reparo Manager** ya está online y accesible desde cualquier dispositivo con navegador.
