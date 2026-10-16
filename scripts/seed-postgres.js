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

function fechaHoy(offsetHoras = 0) {
  const d = new Date();
  d.setHours(d.getHours() - offsetHoras);
  return d;
}
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

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
      nombre: "Te Reparo Centro",
      direccion: "Calle Reina #123, Habana Vieja",
      telefono: "+53 7 866 1234",
      encargado: "Carlos Mendoza",
      activo: true,
      rfc: "TRC-850101-ABC",
      razonSocial: "Te Reparo Centro S.A.",
      ciudad: "Habana",
      codigoPostal: "10300",
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
      nombre: "Te Reparo Norte",
      direccion: "Calle Aguilera #456, Santiago",
      telefono: "+53 22 648 5678",
      encargado: "María Fernández",
      activo: true,
      rfc: "TRS-850202-DEF",
      razonSocial: "Te Reparo Norte S.A.",
      ciudad: "Santiago de Cuba",
      codigoPostal: "90100",
      limiteDescuento: 10,
      horarioApertura: "08:00",
      horarioCierre: "17:00",
      metodosPago: "Efectivo,Tarjeta,Transferencia",
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
      email: "superadmin@tereparo.com",
      password: "admin123",
      nombre: "Super Administrador",
      rol: "SUPER_ADMIN",
      telefono: "+53 7 555 0001",
      tallerIds: ["taller-1", "taller-2"],
    },
    {
      id: "u-admin-1",
      email: "admin.centro@tereparo.com",
      password: "admin123",
      nombre: "Carlos Mendoza",
      rol: "ADMIN",
      telefono: "+53 7 555 0002",
      tallerIds: ["taller-1"],
    },
    {
      id: "u-admin-2",
      email: "admin.norte@tereparo.com",
      password: "admin123",
      nombre: "María Fernández",
      rol: "ADMIN",
      telefono: "+53 22 555 0003",
      tallerIds: ["taller-2"],
    },
    {
      id: "u-vend-1",
      email: "vendedor@tereparo.com",
      password: "vendedor123",
      nombre: "Laura Sánchez",
      rol: "VENDEDOR",
      telefono: "+53 7 555 0004",
      tallerIds: ["taller-1"],
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
  // 3. CLIENTES
  // ============================================================
  console.log("[seed] Upserting clientes...");
  const clientes = [
    {
      id: "cliente-general",
      nombre: "Cliente General",
      telefono: "",
      email: "",
      tipo: "PERSONA_NATURAL",
      esClienteGeneral: true,
      createdAt: new Date(),
    },
    {
      id: "cli-1",
      nombre: "Juan Pérez García",
      telefono: "+53 5 111 2222",
      email: "juan.perez@gmail.com",
      tipo: "PERSONA_NATURAL",
      esClienteGeneral: false,
      createdAt: fechaHoy(30 * 24),
    },
    {
      id: "cli-2",
      nombre: "Ana Martínez López",
      telefono: "+53 5 333 4444",
      email: "ana.martinez@outlook.com",
      tipo: "PERSONA_NATURAL",
      esClienteGeneral: false,
      createdAt: fechaHoy(20 * 24),
    },
    {
      id: "cli-3",
      nombre: "Distribuidora Tecnológica S.A.",
      telefono: "+53 7 555 6666",
      email: "compras@distribuidoratec.cu",
      tipo: "EMPRESA",
      rfc: "DTI950101AAA",
      direccion: "Av. Reforma 100, Habana",
      esClienteGeneral: false,
      createdAt: fechaHoy(60 * 24),
    },
    {
      id: "cli-4",
      nombre: "Roberto Hernández",
      telefono: "+53 5 777 8888",
      tipo: "PERSONA_NATURAL",
      esClienteGeneral: false,
      createdAt: fechaHoy(10 * 24),
    },
  ];
  for (const c of clientes) {
    await prisma.cliente.upsert({ where: { id: c.id }, update: {}, create: c });
  }
  console.log("  + 5 clientes");

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
  ];
  for (const o of operarios) {
    await prisma.operario.upsert({
      where: { id: o.id },
      update: {},
      create: o,
    });
  }
  console.log("  + 4 operarios");

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
  // 6. PRODUCTOS
  // ============================================================
  console.log("[seed] Upserting productos...");
  const productos = [
    {
      id: "prod-1",
      sku: "TEL-IP13-128",
      codigoBarras: "7501234560011",
      nombre: "iPhone 13 128GB",
      descripcion: "Apple iPhone 13 128GB Negro",
      precioCosto: 14000,
      precioVenta: 17999,
      stock: 8,
      stockMinimo: 3,
      garantiaDias: 30,
      categoriaId: "cat-p-1",
      tallerId: "taller-1",
      activo: true,
      operatorCommissionType: "PERCENTAGE",
      operatorCommissionValue: 1.5,
      tags: JSON.stringify(["Apple", "iPhone", "Teléfono"]),
    },
    {
      id: "prod-2",
      sku: "TEL-SAM-A54",
      codigoBarras: "7501234560028",
      nombre: "Samsung Galaxy A54",
      descripcion: "Samsung Galaxy A54 5G 128GB",
      precioCosto: 6500,
      precioVenta: 8999,
      stock: 12,
      stockMinimo: 4,
      garantiaDias: 30,
      categoriaId: "cat-p-1",
      tallerId: "taller-1",
      activo: true,
      operatorCommissionType: "PERCENTAGE",
      operatorCommissionValue: 2,
      tags: JSON.stringify(["Samsung", "Galaxy", "Teléfono"]),
    },
    {
      id: "prod-3",
      sku: "ACC-FUND-IP13",
      codigoBarras: "7501234560035",
      nombre: "Funda iPhone 13",
      descripcion: "Funda silicona iPhone 13",
      precioCosto: 80,
      precioVenta: 249,
      stock: 45,
      stockMinimo: 10,
      garantiaDias: 0,
      categoriaId: "cat-p-2",
      tallerId: "taller-1",
      activo: true,
      operatorCommissionType: "FIXED",
      operatorCommissionValue: 15,
      tags: JSON.stringify(["Apple", "iPhone", "Accesorio", "Funda"]),
    },
    {
      id: "prod-4",
      sku: "ACC-VID-TMPL",
      codigoBarras: "7501234560042",
      nombre: "Vidrio Templado Universal",
      descripcion: "Protector de pantalla",
      precioCosto: 25,
      precioVenta: 99,
      stock: 80,
      stockMinimo: 20,
      garantiaDias: 0,
      categoriaId: "cat-p-2",
      tallerId: "taller-1",
      activo: true,
      operatorCommissionType: "FIXED",
      operatorCommissionValue: 10,
      tags: JSON.stringify(["Accesorio", "Vidrio"]),
    },
    {
      id: "prod-5",
      sku: "CARG-USB-C-20W",
      codigoBarras: "7501234560059",
      nombre: "Cargador USB-C 20W",
      descripcion: "Cargador rápido USB-C 20W",
      precioCosto: 120,
      precioVenta: 349,
      stock: 25,
      stockMinimo: 8,
      garantiaDias: 30,
      categoriaId: "cat-p-3",
      tallerId: "taller-1",
      activo: true,
      operatorCommissionType: "FIXED",
      operatorCommissionValue: 20,
      tags: JSON.stringify(["Accesorio", "Cargador", "USB-C"]),
    },
    {
      id: "prod-6",
      sku: "ACC-AUD-BT",
      codigoBarras: "7501234560066",
      nombre: "Audífonos Bluetooth",
      descripcion: "Audífonos inalámbricos",
      precioCosto: 280,
      precioVenta: 599,
      stock: 2,
      stockMinimo: 5,
      garantiaDias: 30,
      categoriaId: "cat-p-2",
      tallerId: "taller-1",
      activo: true,
      operatorCommissionType: null,
      operatorCommissionValue: null,
      tags: JSON.stringify(["Accesorio", "Audífonos"]),
    },
  ];
  for (const p of productos) {
    await prisma.producto.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    });
  }
  console.log("  + 6 productos");

  // ============================================================
  // 7. PIEZAS
  // ============================================================
  console.log("[seed] Upserting piezas...");
  const piezas = [
    {
      id: "pz-1",
      sku: "PNT-IP13-OLED",
      codigoBarras: "7509876540011",
      nombre: "Pantalla OLED iPhone 13",
      descripcion: "Pantalla OLED original",
      costoUnitario: 3500,
      precioVenta: 4500,
      stock: 5,
      stockMinimo: 2,
      garantiaFabricaDias: 90,
      categoriaId: "cat-r-1",
      tallerId: "taller-1",
      activo: true,
      operatorPaymentType: "FIXED",
      operatorPaymentValue: 500,
      tags: JSON.stringify(["Apple", "iPhone", "Pantalla"]),
    },
    {
      id: "pz-2",
      sku: "PNT-SAM-A54",
      codigoBarras: "7509876540028",
      nombre: "Pantalla Samsung A54",
      descripcion: "Pantalla LCD Samsung A54",
      costoUnitario: 1200,
      precioVenta: 1800,
      stock: 3,
      stockMinimo: 2,
      garantiaFabricaDias: 90,
      categoriaId: "cat-r-1",
      tallerId: "taller-1",
      activo: true,
      operatorPaymentType: "FIXED",
      operatorPaymentValue: 200,
      tags: JSON.stringify(["Samsung", "Galaxy", "Pantalla"]),
    },
    {
      id: "pz-3",
      sku: "BAT-IP13",
      codigoBarras: "7509876540035",
      nombre: "Batería iPhone 13",
      descripcion: "Batería original 3240mAh",
      costoUnitario: 450,
      precioVenta: 800,
      stock: 8,
      stockMinimo: 3,
      garantiaFabricaDias: 60,
      categoriaId: "cat-r-2",
      tallerId: "taller-1",
      activo: true,
      operatorPaymentType: "PERCENTAGE",
      operatorPaymentValue: 15,
      tags: JSON.stringify(["Apple", "iPhone", "Batería"]),
    },
    {
      id: "pz-4",
      sku: "PRT-IP13-CG",
      codigoBarras: "7509876540042",
      nombre: "Puerto de Carga iPhone 13",
      descripcion: "Flex puerto de carga",
      costoUnitario: 320,
      precioVenta: 600,
      stock: 1,
      stockMinimo: 3,
      garantiaFabricaDias: 30,
      categoriaId: "cat-r-3",
      tallerId: "taller-1",
      activo: true,
      operatorPaymentType: "FIXED",
      operatorPaymentValue: 100,
      tags: JSON.stringify(["Apple", "iPhone", "Puerto"]),
    },
    {
      id: "pz-5",
      sku: "BAT-SAM-A54",
      codigoBarras: "7509876540059",
      nombre: "Batería Samsung A54",
      descripcion: "Batería 5000mAh",
      costoUnitario: 380,
      precioVenta: 700,
      stock: 0,
      stockMinimo: 2,
      garantiaFabricaDias: 60,
      categoriaId: "cat-r-2",
      tallerId: "taller-1",
      activo: true,
      operatorPaymentType: "PERCENTAGE",
      operatorPaymentValue: 15,
      tags: JSON.stringify(["Samsung", "Galaxy", "Batería"]),
    },
  ];
  for (const p of piezas) {
    await prisma.pieza.upsert({ where: { id: p.id }, update: {}, create: p });
  }
  console.log("  + 5 piezas");

  // ============================================================
  // 8. VENTAS + VENTA ITEMS
  // ============================================================
  console.log("[seed] Upserting ventas...");
  const ventas = [
    {
      id: "ven-1",
      folio: "V-001A2B",
      tallerId: "taller-1",
      clienteId: "cli-1",
      vendedorId: "u-vend-1",
      operarioId: null,
      subtotal: 18248,
      total: 18248,
      metodoPago: "Tarjeta",
      estado: "COMPLETADA",
      createdAt: fechaHoy(2),
      items: [
        {
          id: "vi-1",
          productoId: "prod-1",
          cantidad: 1,
          precioUnitario: 17999,
          subtotal: 17999,
        },
        {
          id: "vi-2",
          productoId: "prod-3",
          cantidad: 1,
          precioUnitario: 249,
          subtotal: 249,
        },
      ],
    },
    {
      id: "ven-2",
      folio: "V-002B3C",
      tallerId: "taller-1",
      clienteId: "cliente-general",
      vendedorId: "u-vend-1",
      operarioId: null,
      subtotal: 698,
      total: 698,
      metodoPago: "Efectivo",
      estado: "COMPLETADA",
      createdAt: fechaHoy(4),
      items: [
        {
          id: "vi-3",
          productoId: "prod-5",
          cantidad: 2,
          precioUnitario: 349,
          subtotal: 698,
        },
      ],
    },
    {
      id: "ven-3",
      folio: "V-003C4D",
      tallerId: "taller-1",
      clienteId: "cli-2",
      vendedorId: "u-vend-1",
      operarioId: null,
      subtotal: 9098,
      total: 9098,
      metodoPago: "Transferencia",
      estado: "COMPLETADA",
      createdAt: fechaHoy(6),
      items: [
        {
          id: "vi-4",
          productoId: "prod-2",
          cantidad: 1,
          precioUnitario: 8999,
          subtotal: 8999,
        },
        {
          id: "vi-5",
          productoId: "prod-4",
          cantidad: 1,
          precioUnitario: 99,
          subtotal: 99,
        },
      ],
    },
  ];
  for (const v of ventas) {
    const { items, ...ventaData } = v;
    await prisma.venta.upsert({
      where: { id: v.id },
      update: {},
      create: { ...ventaData, items: { create: items } },
    });
  }
  console.log("  + 3 ventas (con sus items)");

  // ============================================================
  // 9. MOVIMIENTOS
  // ============================================================
  console.log("[seed] Upserting movimientos...");
  const movimientos = [
    {
      id: "mov-1",
      tallerId: "taller-1",
      tipo: "INGRESO",
      concepto: "Venta V-001A2B",
      monto: 18248,
      categoria: "Venta de productos",
      usuarioId: "u-vend-1",
      ventaId: "ven-1",
      fecha: fechaHoy(2),
    },
    {
      id: "mov-2",
      tallerId: "taller-1",
      tipo: "INGRESO",
      concepto: "Venta V-002B3C",
      monto: 698,
      categoria: "Venta de productos",
      usuarioId: "u-vend-1",
      ventaId: "ven-2",
      fecha: fechaHoy(4),
    },
    {
      id: "mov-3",
      tallerId: "taller-1",
      tipo: "INGRESO",
      concepto: "Venta V-003C4D",
      monto: 9098,
      categoria: "Venta de productos",
      usuarioId: "u-vend-1",
      ventaId: "ven-3",
      fecha: fechaHoy(6),
    },
    {
      id: "mov-4",
      tallerId: "taller-1",
      tipo: "GASTO",
      concepto: "Renta del local",
      monto: 8000,
      categoria: "Renta",
      usuarioId: "u-admin-1",
      fecha: fechaHoy(8),
    },
    {
      id: "mov-5",
      tallerId: "taller-1",
      tipo: "GASTO",
      concepto: "Papelería",
      monto: 350,
      categoria: "Papelería",
      usuarioId: "u-admin-1",
      fecha: fechaHoy(3),
    },
    {
      id: "mov-6",
      tallerId: "taller-1",
      tipo: "COMPRA",
      concepto: "Compra de inventario C-001",
      monto: 5000,
      categoria: "Inventario",
      usuarioId: "u-admin-1",
      fecha: fechaHoy(24),
    },
  ];
  for (const m of movimientos) {
    await prisma.movimiento.upsert({
      where: { id: m.id },
      update: {},
      create: m,
    });
  }
  console.log("  + 6 movimientos");

  // ============================================================
  // 10. PEDIDOS INTERNOS
  // ============================================================
  console.log("[seed] Upserting pedidos...");
  const pedidos = [
    {
      id: "ped-1",
      folio: "P-001",
      tallerId: "taller-1",
      solicitanteId: "u-vend-1",
      descripcion: "5x Pantalla Samsung A54 (urgente, sin stock)",
      cantidad: 5,
      urgencia: "ALTA",
      estado: "PENDIENTE",
      createdAt: fechaHoy(2),
    },
    {
      id: "ped-2",
      folio: "P-002",
      tallerId: "taller-1",
      solicitanteId: "u-vend-1",
      descripcion: "Licencias Windows 11 Pro x10",
      cantidad: 10,
      urgencia: "MEDIA",
      estado: "PENDIENTE",
      createdAt: fechaHoy(1),
    },
  ];
  for (const p of pedidos) {
    await prisma.pedidoInterno.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    });
  }
  console.log("  + 2 pedidos");

  // ============================================================
  // 11. GARANTÍAS
  // ============================================================
  console.log("[seed] Upserting garantías...");
  const garantias = [
    {
      id: "gar-1",
      folio: "G-001P1",
      tallerId: "taller-1",
      clienteId: "cli-2",
      ventaId: null,
      servicioId: null,
      tipo: "SERVICIO",
      fechaInicio: fechaHoy(1),
      duracionDias: 90,
      fechaVencimiento: addDays(fechaHoy(1), 90),
      descripcionCobertura:
        "Garantía por servicio. Cubre reaparición del problema dentro del período.",
      estado: "ACTIVA",
      emitidaPorId: "u-vend-1",
      createdAt: fechaHoy(1),
    },
    {
      id: "gar-2",
      folio: "G-002P2",
      tallerId: "taller-1",
      clienteId: "cli-1",
      ventaId: "ven-1",
      servicioId: null,
      tipo: "PRODUCTO",
      fechaInicio: fechaHoy(2),
      duracionDias: 30,
      fechaVencimiento: addDays(fechaHoy(2), 30),
      descripcionCobertura: "Garantía de producto por defectos de fabricación.",
      estado: "ACTIVA",
      emitidaPorId: "u-vend-1",
      createdAt: fechaHoy(2),
    },
  ];
  for (const g of garantias) {
    await prisma.garantia.upsert({
      where: { id: g.id },
      update: {},
      create: g,
    });
  }
  console.log("  + 2 garantías");

  // ============================================================
  // 12. COMMISSION ENTRIES + OPERATOR PAYMENT
  // ============================================================
  console.log("[seed] Upserting comisiones y pagos...");
  await prisma.operatorPayment.upsert({
    where: { id: "op-pay-1" },
    update: {},
    create: {
      id: "op-pay-1",
      folio: "OP-001",
      operarioId: "op-2",
      tallerId: "taller-1",
      amount: 40,
      date: fechaHoy(4),
      paidAt: fechaHoy(3),
      paidById: "u-admin-1",
      status: "PAID",
      notas: "Pago diario — venta en mostrador",
    },
  });
  const comisiones = [
    {
      id: "ce-1",
      operarioId: "op-2",
      tallerId: "taller-1",
      ventaId: "ven-1",
      ventaItemProductoId: "prod-1",
      amount: 269.99,
      type: "SALE",
      description: "Comisión 1.5% — iPhone 13 128GB (V-001A2B)",
      estado: "ACTIVE",
      operatorPaymentId: null,
      createdAt: fechaHoy(2),
    },
    {
      id: "ce-2",
      operarioId: "op-2",
      tallerId: "taller-1",
      ventaId: "ven-1",
      ventaItemProductoId: "prod-3",
      amount: 15,
      type: "SALE",
      description: "Comisión fija — Funda iPhone 13 (V-001A2B)",
      estado: "ACTIVE",
      operatorPaymentId: null,
      createdAt: fechaHoy(2),
    },
    {
      id: "ce-3",
      operarioId: "op-2",
      tallerId: "taller-1",
      ventaId: "ven-2",
      ventaItemProductoId: "prod-5",
      amount: 40,
      type: "SALE",
      description: "Comisión fija x2 — Cargador USB-C 20W (V-002B3C)",
      estado: "ACTIVE",
      operatorPaymentId: "op-pay-1",
      createdAt: fechaHoy(4),
    },
    {
      id: "ce-4",
      operarioId: "op-2",
      tallerId: "taller-1",
      ventaId: "ven-3",
      ventaItemProductoId: "prod-2",
      amount: 169.85,
      type: "SALE",
      description: "Comisión 2% (proporcional) — Samsung Galaxy A54 (V-003C4D)",
      estado: "ACTIVE",
      operatorPaymentId: null,
      createdAt: fechaHoy(6),
    },
    {
      id: "ce-5",
      operarioId: "op-2",
      tallerId: "taller-1",
      ventaId: "ven-3",
      ventaItemProductoId: "prod-4",
      amount: 9.45,
      type: "SALE",
      description: "Comisión fija (proporcional) — Vidrio Templado (V-003C4D)",
      estado: "ACTIVE",
      operatorPaymentId: null,
      createdAt: fechaHoy(6),
    },
    {
      id: "ce-6",
      operarioId: "op-1",
      tallerId: "taller-1",
      ventaId: null,
      servicioId: null,
      amount: 100,
      type: "SERVICE",
      description: "Comisión fija — Desbloqueo FRP (servicio demo)",
      estado: "ACTIVE",
      operatorPaymentId: null,
      createdAt: fechaHoy(1),
    },
  ];
  for (const c of comisiones) {
    await prisma.commissionEntry.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
  }
  console.log("  + 1 pago, 6 comisiones");

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
      tipoCambio: 650,
    },
  });
  console.log("  + configuración (1 USD = 650 CUP)");

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
  console.log("  superadmin@tereparo.com / admin123  (SUPER_ADMIN)");
  console.log("  admin.centro@tereparo.com / admin123  (ADMIN, taller-1)");
  console.log("  admin.norte@tereparo.com  / admin123  (ADMIN, taller-2)");
  console.log("  vendedor@tereparo.com    / vendedor123 (VENDEDOR, taller-1)");
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
