// ============================================================
// Te Reparo Manager — Seed PostgreSQL
// ============================================================
// Idempotente: usa upserts para que se pueda re-ejecutar sin romper.
// Aplica para PostgreSQL en Railway / Supabase / Neon / etc.
//
// Uso:
//   npm run db:seed
//   o:  node scripts/seed-postgres.js
// ============================================================

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

// Cargar .env manualmente con override=true
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath, override: true });
}

if (!process.env.DATABASE_URL) {
  console.error("[seed] ERROR: DATABASE_URL no está definida.");
  console.error("[seed] Verifica que .env exista en la raíz del proyecto con:");
  console.error(
    "    DATABASE_URL=postgresql://user:pass@host:5432/db?schema=public",
  );
  process.exit(1);
}

console.log("[seed] Usando DATABASE_URL =", process.env.DATABASE_URL);

const prisma = new PrismaClient();

async function main() {
  console.log("[seed] Conectando a PostgreSQL...");
  await prisma.$connect();

  // ============================================================
  // 1. TALLERES
  // ============================================================
  console.log("[seed] Upserting talleres...");
  await prisma.taller.upsert({
    where: { id: "taller-1" },
    update: {},
    create: {
      id: "taller-1",
      nombre: "Te Reparo - República",
      direccion: "República esquina San Martin #403",
      telefono: "+53 7 866 1234",
      encargado: "Raydel",
      activo: true,
      rfc: "TRC-850101-ABC",
      razonSocial: "Te Reparo",
      ciudad: "Camagüey",
      codigoPostal: "70100",
      limiteDescuento: 15,
      horarioApertura: "08:00",
      horarioCierre: "17:00",
      metodosPago: "Efectivo,Tarjeta,Transferencia",
      garantiaProductoDias: 30,
      garantiaServicioDias: 90,
      plantillaGarantia:
        "Esta garantía cubre defectos de fabricación e instalación por el período indicado. No cubre daños por mal uso, caídas, líquidos o modificaciones no autorizadas.",
    },
  });
  await prisma.taller.upsert({
    where: { id: "taller-2" },
    update: {},
    create: {
      id: "taller-2",
      nombre: "Te Reparo - La Caridad",
      direccion: "Avenida de La Libertad #27, La Caridad",
      telefono: "+53 59601502",
      encargado: "Raydel",
      activo: true,
      rfc: "TRS-850202-DEF",
      razonSocial: "Te Reparo",
      ciudad: "Camagüey",
      codigoPostal: "70100",
      limiteDescuento: 10,
      horarioApertura: "08:00",
      horarioCierre: "17:00",
      metodosPago: "Efectivo,Tarjeta",
      garantiaProductoDias: 30,
      garantiaServicioDias: 60,
    },
  });
  console.log("  + taller-1, taller-2");

  // ============================================================
  // 2. USUARIOS — contraseñas hasheadas con bcrypt (10 rounds)
  // ============================================================
  console.log("[seed] Upserting usuarios...");
  const usuarios = [
    {
      id: "u-super",
      email: "superadmin@tereparo.cu",
      password: "SuperAdmin.2026*",
      nombre: "Super Administrador",
      rol: "SUPER_ADMIN",
      telefono: "+53 0 000 0001",
      tallerIds: ["taller-1", "taller-2"],
    },
    {
      id: "u-admin-1",
      email: "admin.republica@tereparo.cu",
      password: "Admin.2026*",
      nombre: "Administrador República",
      rol: "ADMIN",
      telefono: "+53 0 000 0002",
      tallerIds: ["taller-1"],
    },
    {
      id: "u-admin-2",
      email: "admin.caridad@tereparo.cu",
      password: "Admin.2026*",
      nombre: "Administrador La Caridad",
      rol: "ADMIN",
      telefono: "+53 0 000 0003",
      tallerIds: ["taller-2"],
    },
    {
      id: "u-vend-1",
      email: "vendedor.republica@tereparo.cu",
      password: "Vendedor.2026*",
      nombre: "Jonathan",
      rol: "VENDEDOR",
      telefono: "+53 0 000 0004",
      tallerIds: ["taller-1"],
    },
    {
      id: "u-vend-2",
      email: "vendedor.caridad@tereparo.cu",
      password: "Vendedor.2026*",
      nombre: "Iván",
      rol: "VENDEDOR",
      telefono: "+53 0 000 0005",
      tallerIds: ["taller-2"],
    },
  ];
  // Hash sincrónico para evitar condiciones de carrera en el loop
  const SALT_ROUNDS = 10;
  for (const u of usuarios) {
    const { tallerIds, password, ...data } = u;
    // Siempre hasheamos (la contraseña viene en claro del array)
    const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
    await prisma.usuario.upsert({
      where: { id: u.id },
      update: { password: passwordHash },
      create: {
        ...data,
        email: data.email.toLowerCase(),
        password: passwordHash,
        activo: true,
        talleres: { create: tallerIds.map((tallerId) => ({ tallerId })) },
      },
    });
    console.log("  +", data.email, "(" + data.rol + ")");
  }

  // ============================================================
  // 4. OPERARIOS
  // ============================================================
  console.log("[seed] Upserting operarios...");
  const operarios = [
    {
      id: "op-1",
      nombre: "Jonathan",
      telefono: "+53 0 000 0001",
      especialidad: "VENDEDOR",
      activo: true,
      tallerId: "taller-1",
    },
    {
      id: "op-2",
      nombre: "Lili",
      telefono: "+53 0 000 0002",
      especialidad: "VENDEDOR",
      activo: true,
      tallerId: "taller-1",
    },
    {
      id: "op-3",
      nombre: "Juan",
      telefono: "+53 0 000 0003",
      especialidad: "INFORMATICA",
      activo: true,
      tallerId: "taller-1",
    },
    {
      id: "op-4",
      nombre: "Wilber",
      telefono: "+53 0 000 0004",
      especialidad: "INFORMATICA",
      activo: true,
      tallerId: "taller-1",
    },
    {
      id: "op-5",
      nombre: "Michel",
      telefono: "+53 0 000 0005",
      especialidad: "ELECTRONICA",
      activo: true,
      tallerId: "taller-1",
    },
    {
      id: "op-6",
      nombre: "Milton",
      telefono: "+53 0 000 0006",
      especialidad: "ELECTRONICA",
      activo: true,
      tallerId: "taller-1",
    },
    {
      id: "op-7",
      nombre: "Iván",
      telefono: "+53 0 000 0007",
      especialidad: "VENDEDOR",
      activo: true,
      tallerId: "taller-2",
    },
    {
      id: "op-8",
      nombre: "Andrew",
      telefono: "+53 0 000 0008",
      especialidad: "VENDEDOR",
      activo: true,
      tallerId: "taller-2",
    },

    {
      id: "op-9",
      nombre: "Danilo",
      telefono: "+53 0 000 0009",
      especialidad: "INFORMATICA",
      activo: true,
      tallerId: "taller-2",
    },
    {
      id: "op-10",
      nombre: "Raul",
      telefono: "+53 0 000 0010",
      especialidad: "ELECTRONICA",
      activo: true,
      tallerId: "taller-2",
    },
  ];
  for (const o of operarios) {
    await prisma.operario.upsert({
      where: { id: o.id },
      update: {},
      create: o,
    });
  }
  console.log("  + 10 operarios");

  // ============================================================
  // 5. CATEGORÍAS
  // ============================================================
  console.log("[seed] Upserting categorías...");
  const categorias = [
    {
      id: "cat-p-1",
      nombre: "Teléfonos",
      tipo: "PRODUCTO",
      activa: true,
      tallerId: "taller-1",
    },
    {
      id: "cat-p-2",
      nombre: "Accesorios",
      tipo: "PRODUCTO",
      activa: true,
      tallerId: "taller-1",
    },
    {
      id: "cat-p-3",
      nombre: "Cargadores",
      tipo: "PRODUCTO",
      activa: true,
      tallerId: "taller-1",
    },
    {
      id: "cat-r-1",
      nombre: "Pantallas",
      tipo: "PIEZA",
      activa: true,
      tallerId: "taller-1",
    },
    {
      id: "cat-r-2",
      nombre: "Baterías",
      tipo: "PIEZA",
      activa: true,
      tallerId: "taller-1",
    },
    {
      id: "cat-r-3",
      nombre: "Puertos de carga",
      tipo: "PIEZA",
      activa: true,
      tallerId: "taller-1",
    },
    {
      id: "cat-r-4",
      nombre: "Conectores",
      tipo: "PIEZA",
      activa: true,
      tallerId: "taller-1",
    },
    {
      id: "cat2-p-1",
      nombre: "Teléfonos",
      tipo: "PRODUCTO",
      activa: true,
      tallerId: "taller-2",
    },
    {
      id: "cat2-r-1",
      nombre: "Pantallas",
      tipo: "PIEZA",
      activa: true,
      tallerId: "taller-2",
    },
  ];
  for (const c of categorias) {
    await prisma.categoria.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
  }
  console.log("  + 9 categorías");

  // ============================================================
  // 13. CONFIGURACIÓN
  // ============================================================
  console.log("[seed] Upserting configuración global...");
  await prisma.configuracionGlobal.upsert({
    where: { id: "config-global" },
    update: {},
    create: {
      id: "config-global",
      moneda: "USD",
      pais: "Cuba",
      tipoCambio: 795,
    },
  });
  console.log("  + configuración (1 USD = 795 CUP)");

  // ============================================================
  // RESUMEN
  // ============================================================
  console.log("\n[seed] Resumen:");
  for (const m of [
    "taller",
    "usuario",
    "operario",
    "cliente",
    "categoria",
    "producto",
    "pieza",
    "venta",
    "ventaItem",
    "movimiento",
    "pedidoInterno",
    "garantia",
    "commissionEntry",
    "operatorPayment",
  ]) {
    const n = await prisma[m].count();
    console.log("  -", m.padEnd(20), n, "registros");
  }
  console.log(
    "\n[seed] OK — usuarios demo (contraseñas hasheadas con bcrypt, 10 rounds):",
  );
  console.log("  superadmin@tereparo.mx / admin123  (SUPER_ADMIN)");
  console.log("  admin.centro@tereparo.mx / admin123  (ADMIN, taller-1)");
  console.log("  admin.norte@tereparo.mx  / admin123  (ADMIN, taller-2)");
  console.log("  vendedor@tereparo.mx    / vendedor123 (VENDEDOR, taller-1)");
  console.log(
    "\n[seed] Las contraseñas anteriores son las que el usuario debe escribir en el login.",
  );
  console.log("[seed] En la BD se almacena el hash bcrypt, no el plaintext.");
}

main()
  .catch((e) => {
    console.error("[seed] ERROR:", e.message);
    if (e.code === "P2003") {
      console.error(
        "[seed] FK violation en:",
        e.meta?.field_name || "campo desconocido",
      );
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
