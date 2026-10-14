# 🔧 Te Reparo Manager

Sistema integral de gestión para talleres de reparación en Cuba.
**Stack**: Next.js 16 + React 19 + TypeScript + Prisma + SQLite + Tailwind CSS 4 + shadcn/ui.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-blue.svg)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características principales](#-características-principales)
- [Stack tecnológico](#-stack-tecnológico)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Instalación y puesta en marcha](#-instalación-y-puesta-en-marcha)
- [Usuarios demo](#-usuarios-demo)
- [Comandos disponibles](#-comandos-disponibles)
- [Módulos de la aplicación](#-módulos-de-la-aplicación)
- [Soporte para lector de código de barras](#-soporte-para-lector-de-código-de-barras)
- [Distribución portable](#-distribución-portable)
- [Sincronización con Cloud API](#-sincronización-con-cloud-api-opcional)
- [Testing](#-testing)
- [Licencia](#-licencia)

---

## 📖 Descripción

**Te Reparo Manager** es un sistema de punto de venta y gestión diseñado específicamente para talleres de reparación de telefonía y electrónica en Cuba. Permite gestionar múltiples sucursales, inventarios duales (productos y piezas), ventas (POS), órdenes de servicio con garantía, comisiones a operarios, movimientos de caja y reportes consolidados.

El sistema está pensado para funcionar en modo **local (offline-first)** con SQLite, y opcionalmente sincronizar con un **Cloud API** (NestJS + PostgreSQL) para gestión multi-taller remota.

---

## ✨ Características principales

### 🏢 Gestión multi-taller
- Soporte para múltiples sucursales con datos aislados.
- Usuarios con asignación a uno o varios talleres.
- Roles y permisos: SUPER_ADMIN, ADMIN, VENDEDOR.
- Selector de taller activo en la barra superior.

### 📦 Inventario dual
- **Productos** (para venta directa al cliente).
- **Piezas** (para uso interno en reparaciones).
- Stock mínimo con alertas visuales en el sidebar.
- SKU y código de barras únicos por producto/pieza.
- Categorías por taller (PRODUCTO/PIEZA).
- Etiquetas (tags) para filtrado avanzado.

### 🛒 Punto de Venta (POS)
- Carrito con cliente general o registrado.
- Edición de precio unitario en el carrito (descuentos manuales).
- Conversión automática USD ↔ CUP con tipo de cambio configurable.
- Garantía automática por venta (configurable por producto).
- Múltiples métodos de pago (Efectivo, Tarjeta, Transferencia).
- Generación de ticket/factura imprimible.

### 🔧 Órdenes de Servicio
- Tracking de reparaciones (PENDIENTE → COMPLETADO → ENTREGADO).
- Marcas, modelos, IMEI opcional.
- Diagnóstico y descripción del servicio realizado.
- Piezas utilizadas con costo + precio de venta.
- Garantía configurable por servicio.
- Reasignación de garantías entre clientes.

### 🛡️ Garantías
- Emisión automática para ventas y servicios.
- Tipos: PRODUCTO o SERVICIO.
- Estados: ACTIVA, VENCIDA, INVALIDADA.
- Reclamaciones con resoluciones (Reparación sin costo, Reemplazo, Rechazo).
- Certificado imprimible.

### 💰 Finanzas
- **Movimientos de caja**: ingresos, gastos y compras.
- **Comisiones a operarios**: por venta (PERCENTAGE o FIXED) y por servicio.
- **Pagos a operarios**: agrupación de comisiones pendientes en un solo pago.
- **Dashboard**: KPIs consolidados por taller (ventas, servicios, stock bajo, pedidos pendientes).
- **Multi-moneda**: precios en USD con conversión automática a CUP.

### 📋 Pedidos Internos
- Solicitudes de productos/piezas entre equipos.
- Estados: PENDIENTE → APROBADO/RECHAZADO → CONVERTIDO.
- Niveles de urgencia: BAJA, MEDIA, ALTA.
- Aprobación por ADMIN o SUPER_ADMIN.

### 🔄 Devoluciones
- Devoluciones de productos o piezas.
- Flujo de revisión: PENDIENTE_REVISION → APROBADA/RECHAZADA.
- Vinculación con venta o servicio original.

### 👥 Gestión de Clientes
- Clientes persona natural y empresa.
- RFC para facturación.
- Cliente general por defecto (ventas rápidas).
- Historial completo: compras, servicios, garantías.
- Migración de garantías entre clientes.

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | Next.js 16 (App Router) + React 19 + TypeScript 5 |
| **Estilos** | Tailwind CSS 4 + shadcn/ui + Radix UI primitives |
| **Estado** | Zustand (con persistencia en localStorage) |
| **Formularios** | React Hook Form + Zod |
| **Tablas** | @tanstack/react-table |
| **Charts** | Recharts |
| **Backend** | Next.js Route Handlers (API REST) |
| **ORM** | Prisma 6 |
| **DB local** | SQLite (better-sqlite3) |
| **Cloud DB** | PostgreSQL (vía NestJS API en Railway) |
| **Auth** | Cookie HMAC firmada (sin JWT externo) |
| **Testing** | Vitest + Testing Library + Playwright |
| **Build** | Next.js standalone + Docker (opcional) |
| **Deploy** | Railway, Vercel, o distribución portable (.zip) |

---

## 📁 Estructura del proyecto

```
te-reparo-manager/
├── prisma/
│   └── schema.prisma              # Esquema SQLite (20+ modelos)
├── scripts/
│   ├── seed-sqlite.js             # Seed idempotente (upserts)
│   ├── build-portable.js         # Empaquetado portable (.zip)
│   ├── create-official-db.js     # Crear DB oficial
│   └── generate-informe-pdf.py   # Generador de informe PDF
├── src/
│   ├── app/
│   │   ├── api/                  # Next.js Route Handlers (REST API)
│   │   │   ├── auth/             # login, logout, me
│   │   │   ├── talleres/
│   │   │   ├── usuarios/
│   │   │   ├── clientes/
│   │   │   ├── categorias/
│   │   │   ├── productos/
│   │   │   ├── piezas/
│   │   │   ├── ventas/           # + anular
│   │   │   ├── servicios/        # + entregar
│   │   │   ├── garantias/        # + reclamacion, reasignar
│   │   │   ├── devoluciones/     # + revisar
│   │   │   ├── movimientos/      # + gasto, compra, resumen-dia
│   │   │   ├── pedidos/          # + aprobar, convertir
│   │   │   ├── comisiones/       # + pagos, mis-comisiones, mis-pagos
│   │   │   ├── operarios/
│   │   │   ├── configuracion/
│   │   │   ├── dashboard/
│   │   │   ├── validar/          # codigo-barras
│   │   │   └── sync/             # sincronización con cloud (opcional)
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Punto de entrada (Login o AppShell)
│   │   └── globals.css
│   ├── components/
│   │   ├── modules/              # 15 módulos de negocio
│   │   ├── shared/                # Componentes compartidos (selectores, dialogs)
│   │   └── ui/                   # Primitivas shadcn/ui (40+ componentes)
│   └── lib/
│       ├── prisma.ts             # Singleton de Prisma client + extensión sync
│       ├── store.ts              # Estado Zustand (cliente)
│       ├── session.ts            # Autenticación cookie HMAC
│       ├── electron-adapter.ts   # Servicio de datos (fetch a API routes)
│       ├── sync-service.ts       # Puente SQLite ↔ Cloud API
│       ├── sync-worker.ts        # Background worker (push/pull automático)
│       ├── cloud-data-service.ts # Cliente HTTP para super-admin multi-taller
│       ├── types.ts              # Tipos TypeScript del dominio
│       ├── api-helpers.ts        # Helpers para Route Handlers
│       ├── folio.ts              # Generador de folios únicos
│       ├── format.ts             # Formateadores (USD, CUP, fechas)
│       └── utils.ts              # Utilidades varias (cn, etc.)
├── cloud-api/                    # NestJS Cloud API (opcional, multi-taller)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/             # JWT admin + workshop
│   │   │   ├── workshops/
│   │   │   ├── sync/             # push/pull/bootstrap
│   │   │   ├── realtime/         # WebSocket gateway
│   │   │   ├── audit/
│   │   │   └── prisma/
│   │   └── main.ts
│   └── prisma/
│       └── schema.prisma         # Esquema PostgreSQL del cloud
├── e2e/                          # Tests E2E con Playwright
├── public/
│   ├── logo.svg
│   ├── robots.txt
│   └── INFORME_TECNICO_COMPLETO.md
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
└── README.md                     # Este archivo
```

---

## 🚀 Instalación y puesta en marcha

### Requisitos previos

- **Node.js 20+** (recomendado 20 LTS o 22)
- **npm 10+** o **bun 1.1+**
- Sistema operativo: Windows, macOS, o Linux

### Setup en modo desarrollo

```bash
# 1. Clonar el repositorio
git clone https://github.com/USUARIO/te-reparo-manager.git
cd te-reparo-manager

# 2. Instalar dependencias
npm install
# o: bun install

# 3. Crear la base de datos SQLite local con datos semilla
npm run db:reseed
# Esto ejecuta: prisma db push --force-reset + node scripts/seed-sqlite.js

# 4. Iniciar el servidor de desarrollo
npm run dev
# La app se abre en http://localhost:3000
```

### Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con:

```env
# Base de datos local SQLite (ruta absoluta o relativa)
DATABASE_URL=file:./prisma/dev.db

# Secreto para firmar cookies de sesión (cámbialo en producción)
SESSION_SECRET=tereparo-dev-secret-change-me

# Entorno
NODE_ENV=development
```

---

## 🔐 Usuarios demo

El seed inserta 4 usuarios listos para usar:

| Rol | Email | Password | Talleres asignados |
|---|---|---|---|
| SUPER_ADMIN | `superadmin@tereparo.mx` | `admin123` | Todos |
| ADMIN | `admin.centro@tereparo.mx` | `admin123` | taller-1 (Centro Habana) |
| ADMIN | `admin.norte@tereparo.mx` | `admin123` | taller-2 (Santiago) |
| VENDEDOR | `vendedor@tereparo.mx` | `vendedor123` | taller-1 |

### Niveles de acceso

- **SUPER_ADMIN**: control total, visualiza y gestiona todos los talleres + modo admin multi-taller cloud.
- **ADMIN**: administra su(s) taller(es) asignado(s). No ve otros talleres.
- **VENDEDOR**: punto de venta, inventario, consultas. No puede gestionar usuarios ni configuración global.

---

## 📜 Comandos disponibles

### Desarrollo

```bash
npm run dev              # Servidor de desarrollo en http://localhost:3000
npm run lint             # ESLint
npm run test             # Tests unitarios (Vitest)
npm run test:watch       # Tests en modo watch
npm run test:coverage    # Coverage report
npm run test:component   # Solo tests de componentes
npm run test:e2e         # Tests E2E con Playwright
npm run test:e2e:ui      # Tests E2E con UI interactiva
```

### Build

```bash
npm run build            # Build Next.js standalone (a .next/standalone/)
npm run start            # Arranca el server de producción (puerto 3000)
npm run start:next       # Arranca usando next start (sin standalone)
```

### Base de datos

```bash
npm run db:push          # Sincroniza schema con DB (sin perder datos)
npm run db:generate      # Regenera el cliente Prisma
npm run db:migrate       # Crea migration SQL (desarrollo)
npm run db:reset         # Borra todo y recrea el schema (CUIDADO)
npm run db:reseed        # Reset + seed en un comando
npm run db:seed          # Solo seed (sin borrar)
npm run db:studio        # Abre Prisma Studio en localhost:5555
```

### Distribución portable (cualquier SO)

```bash
npm run dist:portable            # ZIP sin Node.js bundled (~30 MB)
npm run dist:portable:win        # ZIP con Node.js portable para Windows (~80 MB)
npm run dist:portable:mac        # ZIP con Node.js portable para macOS
npm run dist:portable:linux      # ZIP con Node.js portable para Linux
```

---

## 🧩 Módulos de la aplicación

La aplicación se organiza en 15 módulos accesibles desde el sidebar:

| Módulo | Descripción | Roles |
|---|---|---|
| **Dashboard** | KPIs consolidados del taller activo | Todos |
| **Talleres** | Gestión de sucursales (CRUD) | SUPER_ADMIN, ADMIN |
| **Usuarios** | Gestión de usuarios y asignación a talleres | SUPER_ADMIN, ADMIN |
| **Operarios** | Registro de técnicos (sin acceso al sistema) | SUPER_ADMIN, ADMIN, VENDEDOR |
| **Productos (Venta)** | Inventario de productos para venta | Todos |
| **Piezas (Reparación)** | Inventario de piezas para reparaciones | Todos |
| **Punto de Venta** | POS con carrito, cliente, garantía automática | Todos |
| **Servicios** | Órdenes de servicio/reparación | Todos |
| **Movimientos / Caja** | Ingresos, gastos, compras | Todos |
| **Pedidos Internos** | Solicitudes entre equipos con aprobación | Todos |
| **Garantías** | Emisión, reclamaciones, reasignación | Todos |
| **Devoluciones** | Devoluciones con revisión | SUPER_ADMIN, ADMIN |
| **Clientes** | Clientes persona natural / empresa | Todos |
| **Comisiones y Pagos** | Comisiones por venta/servicio + pagos a operarios | Todos |
| **Configuración** | Tipo de cambio, datos fiscales, garantías por defecto, sync cloud | SUPER_ADMIN, ADMIN |

---

## 📷 Soporte para lector de código de barras

La aplicación es **100% compatible con cualquier lector USB HID** (los que se comportan como teclado). No requiere código especial: el escáner "escribe" los dígitos del código + Enter, y la app lo procesa como entrada de teclado.

### Escáner probado y verificado ✅

- **Marca**: SKY TICKET
- **Modelo**: BESC5 (SKU: STBESC5-FWH)
- **Tecnología**: CCD 1D
- **Códigos soportados**: EAN-13, UPC-A, Code 39, Code 128, ITF, Codabar, EAN-8
- **Conexión**: USB (1.5 m de cable)
- **Modo**: USB HID Keyboard (default de fábrica)
- **Sufijo**: Enter (default de fábrica)

### Otros escáneres compatibles (cualquiera de estos funciona)

- **TaoTronics TT-BS012** (~$20 USD)
- **NADAMOO Wireless** (~$30 USD)
- **Honeywell Voyager 1450g** (~$80 USD, robusto)
- **Sunlux SR-580** (~$15 USD)
- Cualquier escáner que diga **"USB HID Keyboard"** o **"Sin driver"** en la descripción

### Cómo se usa en la app

1. Conecta el escáner a cualquier puerto USB de la PC.
2. Windows/macOS/Linux lo detecta automáticamente (no instala drivers).
3. Abre la app en el navegador y ve al módulo POS.
4. Coloca el foco en el campo de búsqueda de productos.
5. Escanea el código de barras del producto.
6. El escáner "escribe" los dígitos + Enter en ~30ms.
7. La app busca el producto por `codigoBarras` y lo agrega al carrito.
8. Repite con más productos.

### Verificación del escáner

Para verificar que el escáner funciona correctamente antes de usarlo en la app:

1. Conéctalo por USB.
2. Abre el Bloc de Notas (Windows) o TextEdit (macOS).
3. Escanea el código de barras de cualquier producto.
4. Deben aparecer los dígitos del código seguidos de un salto de línea.
5. Si lo hace, el escáner está listo para usarse con la app.

---

## 📦 Distribución portable

Este proyecto puede empaquetarse en un **ZIP portable** que cualquier usuario puede ejecutar haciendo doble clic — **sin instalar Node.js, sin instalar nada**. La app se abre en el navegador por defecto del sistema.

### Generar el portable (en tu PC de desarrollo)

```bash
# Sin Node.js bundled (ZIP ~30 MB, requiere Node.js instalado en destino)
npm run dist:portable

# Con Node.js bundled (ZIP ~80 MB, cero dependencias en destino)
npm run dist:portable:win     # para Windows
npm run dist:portable:mac     # para macOS
npm run dist:portable:linux   # para Linux
```

Los artefactos se generan en `dist/`:
- `dist/portable/` — la carpeta descomprimida lista para doble-clic.
- `dist/te-reparo-portable[-<os>].zip` — el ZIP para distribuir.

### Cómo lo usa el usuario final

1. Recibe el ZIP por correo, USB, Drive, etc.
2. Lo descomprime en cualquier carpeta (ej: Escritorio).
3. Hace **doble clic** en el launcher correspondiente:
   - **Windows**: `start.bat`
   - **macOS**: `start.command` (la primera vez: click derecho → Abrir, para autorizar)
   - **Linux**: `start.sh` (doble clic en gestor de archivos o `./start.sh` en terminal)
4. **Se abre el navegador** por defecto en `http://localhost:3000` con la app.
5. Login inicial: `superadmin@tereparo.mx` / `admin123`.
6. Cierra la terminal/consola para detener el servidor cuando termines.

### Dónde se guardan los datos del usuario final

La base de datos SQLite se guarda en `data/te-reparo.db` **dentro de la misma carpeta descomprimida**. Esto significa:
- Persiste entre reinicios.
- Si el usuario copia la carpeta a otra PC, se lleva los datos.
- Para resetear a estado de fábrica: borrar `data/te-reparo.db`.

---

## ☁️ Sincronización con Cloud API (opcional)

El proyecto incluye un **Cloud API** en `cloud-api/` construido con NestJS + PostgreSQL que permite:

- **Sincronización automática** push/pull entre la base SQLite local y el cloud.
- **Gestión multi-taller remota** desde una interfaz de super-admin web.
- **Notificaciones en tiempo real** vía WebSocket (cuando el super-admin hace un cambio, los talleres lo ven al instante).
- **Auditoría** de cambios (audit log).

### Arquitectura

```
┌───────────────────────────┐         ┌───────────────────────────┐
│   Taller (local SQLite)  │  push/  │   Cloud API (NestJS)      │
│   - SyncWorker polling   │ ──────▶ │   - PostgreSQL            │
│   - WebSocket client     │ ◀────── │   - WebSocket gateway     │
│   - UI badge "Sincronizado" │ pull │   - Audit log             │
└───────────────────────────┘         └───────────────────────────┘
                                                │
                                                ▼
                                    ┌───────────────────────────┐
                                    │  Super-Admin Web UI       │
                                    │  (modulo admin-shell)    │
                                    │  - Dashboard multi-taller │
                                    │  - CRUD por taller        │
                                    └───────────────────────────┘
```

### Configuración del sync

1. Desplegar el Cloud API en Railway (ver `cloud-api/README.md`).
2. En la app local, ir a **Configuración → Sincronización con Cloud**.
3. Ingresar la URL del Cloud API (ej: `https://te-reparo-cloud-api.up.railway.app`).
4. (Opcional) Registrar el taller en el cloud para obtener el API Token.
5. Activar el switch "Sync automática".
6. Verificar con el botón **Ping**.

El estado de sincronización se muestra en el badge de la barra superior:
- 🟢 **Sincronizado** — cola vacía, última sync OK.
- 🟡 **N pendientes** — hay registros en cola para subir.
- 🔴 **Sin conexión** — no hay internet o el cloud no responde.
- 🔴 **N errores** — hay entradas fallidas (reintentos agotados).

---

## 🧪 Testing

### Tests unitarios (Vitest)

```bash
npm run test             # Corre todos los tests
npm run test:watch      # Modo watch
npm run test:coverage   # Con coverage report
```

Los tests están en `src/lib/__tests__/` y `src/components/__tests__/`:
- `format.test.ts` — formateadores de moneda y fecha
- `cobertura-extra.test.ts` — lógica de cobertura de garantía
- `comisiones.test.ts` — cálculo de comisiones
- `garantias.test.ts` — emisión y reclamaciones
- `inventario.test.ts` — stock mínimo, ajustes
- `pagos-operador.test.ts` — pagos a operarios
- `permisos-rol.test.ts` — niveles de acceso
- `reglas-negocio.test.ts` — reglas de negocio
- `sesion.test.ts` — autenticación

### Tests E2E (Playwright)

```bash
npm run test:e2e        # Headless
npm run test:e2e:ui     # Con UI interactiva
```

Los tests E2E están en `e2e/`:
- `login.spec.ts` — flujo de autenticación
- `pos-inventario.spec.ts` — POS + inventario
- `flujos-crear.spec.ts` — crear venta, servicio, garantía
- `flujos-ordenes-pedidos.spec.ts` — órdenes y pedidos
- `ordenes-garantias.spec.ts` — órdenes con garantía
- `comisiones.spec.ts` — comisiones y pagos
- `permisos-rol.spec.ts` — permisos por rol
- `accesibilidad.spec.ts` — a11y con axe-core
- `visual-regression.spec.ts` — regresión visual

---

## 🤝 Contribuir

1. Fork el repositorio.
2. Crear una rama: `git checkout -b feature/nueva-funcionalidad`.
3. Hacer los cambios y commitear: `git commit -m 'feat: agrega X'`.
4. Push a la rama: `git push origin feature/nueva-funcionalidad`.
5. Abrir un Pull Request.

### Convención de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` nueva funcionalidad
- `fix:` corrección de bug
- `docs:` cambios en documentación
- `style:` formato, no afecta código
- `refactor:` refactor sin cambio de comportamiento
- `test:` agrega o corrige tests
- `chore:` tareas de mantenimiento

---

## 📝 Licencia

**MIT** — Hecho en Cuba 🇨🇺

```
MIT License

Copyright (c) 2025 Te Reparo Manager

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 Soporte

- **Documentación técnica completa**: [`public/INFORME_TECNICO_COMPLETO.md`](public/INFORME_TECNICO_COMPLETO.md)
- **Issues**: reportar bugs o solicitar features vía GitHub Issues.
- **Email**: info@tereparo.cu

---

## 🙏 Agradecimientos

- A la comunidad de talleres de reparación de Cuba por inspirar este proyecto.
- A los maintainers de Next.js, Prisma, shadcn/ui, y Tailwind CSS por sus excelentes herramientas.
- A todos los contribuidores que dedican su tiempo a mejorar este software.

---

<p align="center">
  Hecho con ❤️ en Cuba 🇨🇺
</p>
