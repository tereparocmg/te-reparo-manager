'use client'

/**
 * Impresión de tickets y etiquetas (.solo-impresion) para papel térmico.
 *
 * Corrige tres problemas del window.print() directo:
 *
 *  1. TAMAÑO DE PÁGINA: el navegador maqueta con el papel preseleccionado en
 *     el diálogo (A4, 80 mm…). Se fuerza con @page una página exactamente del
 *     ancho del ticket (58/80 mm) con margen 0. OJO: «size: 58mm auto» no es
 *     sintaxis válida y el navegador la ignora (vuelve a A4/Letter), por eso
 *     la altura se MIDE del propio ticket y se inyecta como longitud fija.
 *
 *  2. ANCLAJE DEL TICKET: los diálogos se centran con translate(-50%, -50%) y
 *     tienen contenedores con overflow: en la impresión el ticket (position:
 *     fixed) acababa anclado al diálogo — desplazado a la derecha y cortado.
 *     La solución robusta es sacarlo del diálogo: se mueve directamente bajo
 *     <body> mientras dura la impresión y se devuelve a su sitio después
 *     (evento afterprint). Así sus únicos ancestros son body/html y el
 *     position:fixed ancla a la esquina de la página pase lo que pase.
 *
 *  3. TRANSMUTACIÓN DEL BUILD: las reglas se INYECTAN EN RUNTIME (no en
 *     globals.css) porque el minificador reescribe «translate: none» como una
 *     matriz identidad que sigue creando containing-blocks.
 *
 * El ancho a pasar es el configurado en Ajustes del taller (ticketAncho).
 */

interface Prestamo {
  nodo: HTMLElement
  padre: HTMLElement
  siguiente: Node | null
}

let prestamo: Prestamo | null = null

function restaurar() {
  if (!prestamo) return
  try {
    prestamo.padre.insertBefore(prestamo.nodo, prestamo.siguiente)
  } catch {
    // si React ya desmontó el padre, el nodo huérfano se queda fuera de la vista
  }
  prestamo = null
}

const CSS_BASE = `
  *, *::before, *::after {
    translate: none !important;
    rotate: none !important;
    scale: none !important;
    transform: none !important;
    animation: none !important;
    transition: none !important;
  }
  /* El resto de la app (bajo body) desaparece del todo: con visibility:hidden
     seguía ocupando páginas y Chrome repetía el ticket en cada una. Como el
     ticket está prestado directamente bajo <body>, basta ocultar a sus
     hermanos para que el documento sea exactamente una página. */
  body > *:not(.solo-impresion) {
    display: none !important;
  }
  html, body {
    height: 100% !important;
    overflow: hidden !important;
  }
`

function estiloImpresion(): HTMLStyleElement {
  const id = 'estilo-pagina-impresion'
  let estilo = document.getElementById(id) as HTMLStyleElement | null
  if (!estilo) {
    estilo = document.createElement('style')
    estilo.id = id
    document.head.appendChild(estilo)
  }
  return estilo
}

/** Regla @page con la altura medida del ticket (px → mm, con holgura). */
function reglaPagina(anchoMm: string): string {
  let altoMm = 100 // respaldo razonable si no hay ticket en el DOM
  const ticket = document.querySelector('.solo-impresion') as HTMLElement | null
  if (ticket) {
    const altoPx = ticket.getBoundingClientRect().height
    if (altoPx > 0) altoMm = Math.ceil((altoPx * 25.4) / 96) + 2 // +2 mm de holgura
  }
  return `@page { size: ${anchoMm}mm ${altoMm}mm; margin: 0; }`
}

/** Establece el CSS de impresión para un ancho de papel dado (mm). */
function aplicarEstilo(anchoMm: string) {
  estiloImpresion().textContent = `@media print {
  ${reglaPagina(anchoMm)}
${CSS_BASE}
}`
}

/**
 * Imprime el ticket/etiqueta visible forzando el tamaño de página al ancho
 * del papel térmico. Re-ejecutable: el próximo ticket sobrescribe el estilo
 * y un préstamo sin devolver se devuelve antes de prestar de nuevo.
 */
export function imprimirTicket(anchoMm: string = '58') {
  if (typeof document === 'undefined') return
  restaurar() // por si un afterprint anterior no llegó a dispararse

  const ticket = document.querySelector('.solo-impresion') as HTMLElement | null
  if (ticket && ticket.parentElement && ticket.parentElement !== document.body) {
    prestamo = {
      nodo: ticket,
      padre: ticket.parentElement,
      siguiente: ticket.nextSibling,
    }
    // Fuera del diálogo. En pantalla queda fuera de la vista; el CSS de
    // impresión fuerza left:0/top:0 (!important) al imprimir.
    ticket.style.position = 'fixed'
    ticket.style.top = '0'
    ticket.style.left = '-9999px'
    document.body.appendChild(ticket)
  }

  aplicarEstilo(anchoMm)
  window.print()
  window.addEventListener('afterprint', restaurar, { once: true })
}

// Red de seguridad para Ctrl+P (sin pasar por los botones de la app): si el
// usuario imprime directamente el navegador, se aplica al menos el ancho por
// defecto y el des-ancaje de transformaciones — solo cuando hay un ticket.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeprint', () => {
    if (
      !document.getElementById('estilo-pagina-impresion') &&
      document.querySelector('.solo-impresion')
    ) {
      aplicarEstilo('58')
    }
  })
}
