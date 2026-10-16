# Te Reparo Manager

Sistema integral de gestión para talleres de reparación en Cuba.
**Stack**: Next.js 16 + Prisma + PostgreSQL (aplicación web 100% online).

> La app en una aplicación web 100% online con PostgreSQL. Pensada para
> desplegar en Railway, Supabase, Neon o cualquier PaaS con Postgres.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-blue.svg)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)

## 🚀 Modo desarrollo

### Requisitos

- Node.js 20+
- Una instancia de PostgreSQL local o en la nube

### Setup

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar .env.example a .env y editar la URL de PostgreSQL
cp .env.example .env
# Edita .env: DATABASE_URL=postgresql://user:pass@localhost:5432/tereparo?schema=public

# 3. Crear el esquema de la base de datos
npm run db:push

# 4. Sembrar con datos de demostración
npm run db:seed

# 5. Iniciar el servidor en http://localhost:3000
npm run dev
```

Login: `superadmin@tereparo.mx` / `admin123`

## ☁️ Despliegue en Railway

La app está preparada para desplegar en Railway con Dockerfile + PostgreSQL.

**Pasos resumidos** (guía completa en [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)):

1. Sube el repo a GitHub.
2. Crea un proyecto en [railway.app](https://railway.app) con **PostgreSQL plugin**.
3. Conecta el repo como **Web Service** (detecta el Dockerfile automáticamente).
4. Configura variables: `DATABASE_URL` (referencia a Postgres), `SESSION_SECRET`, `NODE_ENV=production`.
5. Genera el dominio público.
6. Aplica `npx prisma db push` y `node scripts/seed-postgres.js` (una vez).
7. ¡Listo! Tu app queda online en `https://tu-proyecto.up.railway.app`.

## 🔧 Comandos disponibles

### Desarrollo

```bash
npm run dev              # Servidor de desarrollo en :3000
npm run lint             # ESLint
npm run test             # Tests unitarios (vitest)
npm run test:e2e         # Tests E2E (playwright)
```

### Build

```bash
npm run build            # Build Next.js standalone
npm run start            # Arranca Next.js en producción
```

### Base de datos

```bash
npm run db:push          # Sincroniza schema con DB (sin perder datos)
npm run db:migrate       # Crea migration SQL (desarrollo)
npm run db:migrate:deploy # Aplica migrations en producción
npm run db:reset         # Borra todo y recrea el schema (CUIDADO)
npm run db:seed          # Inserta datos semilla
npm run db:reseed        # Reset + seed en un comando
npm run db:studio        # Abre Prisma Studio en localhost:5555
npm run db:generate      # Regenera el cliente Prisma
```

## 🔐 Usuarios demo (seed)

| Rol         | Email                    | Password    | Talleres asignados       |
| ----------- | ------------------------ | ----------- | ------------------------ |
| SUPER_ADMIN | superadmin@tereparo.mx   | admin123    | Todos                    |
| ADMIN       | admin.centro@tereparo.mx | admin123    | taller-1 (Centro Habana) |
| ADMIN       | admin.norte@tereparo.mx  | admin123    | taller-2 (Santiago)      |
| VENDEDOR    | vendedor@tereparo.mx     | vendedor123 | taller-1                 |

## 📂 Estructura del proyecto

```
te-reparo-manager/
├── prisma/
│   └── schema.prisma          # Esquema PostgreSQL (20+ modelos)
├── scripts/
│   └── seed-postgres.js       # Seed idempotente (upserts)
├── src/
│   ├── app/
│   │   ├── api/               # Next.js Route Handlers (REST API)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/             # Componentes React + shadcn/ui
│   │   ├── modules/            # 15 módulos de negocio (POS, inventario, etc.)
│   │   ├── shared/             # Componentes compartidos (selectores, dialogs)
│   │   └── ui/                 # Primitivas shadcn/ui
│   └── lib/
│       ├── prisma.ts           # Singleton de Prisma client
│       ├── store.ts            # Estado Zustand (cliente)
│       ├── session.ts          # Autenticación cookie HMAC
│       ├── electron-adapter.ts # Servicio de datos (fetch a API routes)
│       └── types.ts            # Tipos TypeScript del dominio
├── Dockerfile                  # Imagen para Railway
├── railway.json                # Configuración de despliegue
├── RAILWAY_DEPLOY.md            # Guía paso a paso de despliegue
├── package.json
└── .env.example
```

## 🎯 Funcionalidades principales

### Gestión operativa

- **Multi-taller**: soporta múltiples sucursales con datos aislados.
- **Inventario dual**: productos (venta) y piezas (reparación) con stock mínimo.
- **POS integrado**: punto de venta con carrito, métodos de pago y folio único.
- **Órdenes de servicio**: tracking de reparaciones (PENDIENTE → COMPLETADO → ENTREGADO).
- **Garantías**: emisión automática para ventas y servicios, con reclamaciones.
- **Devoluciones**: flujo de aprobación/rechazo para productos y piezas.
- **Pedidos internos**: solicitudes entre equipos con aprobación admin.

### Finanzas

- **Movimientos de caja**: ingresos, gastos y compras.
- **Comisiones**: por venta y por servicio, con pagos parciales a operarios.
- **Dashboard**: KPIs consolidados por taller.
- **Multi-moneda**: precios en USD con conversión automática a CUP.

### Usuarios y permisos

- **SUPER_ADMIN**: acceso total, ve todos los talleres.
- **ADMIN**: gestiona su(s) taller(es) asignado(s).
- **VENDEDOR**: solo POS, inventario y consultas.

## 🛠️ Stack técnico

| Capa     | Tecnología                                                      |
| -------- | --------------------------------------------------------------- |
| Frontend | Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui |
| Estado   | Zustand (con persist en localStorage)                           |
| Forms    | React Hook Form + Zod                                           |
| Tablas   | @tanstack/react-table                                           |
| Charts   | Recharts                                                        |
| Backend  | Next.js Route Handlers (API REST)                               |
| ORM      | Prisma 6                                                        |
| DB       | PostgreSQL 14+                                                  |
| Auth     | Cookie HMAC (sin JWT externo)                                   |
| Testing  | Vitest + Testing Library + Playwright                           |
| Deploy   | Docker + Railway                                                |

## 📝 Licencia

<p align="center">
  MIT - Desarrollado por (Wilber Delfín Hernández Peña)[]
</p>
