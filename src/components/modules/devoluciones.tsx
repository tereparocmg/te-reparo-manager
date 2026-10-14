'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { useDataService } from '@/lib/electron-adapter'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { DataTable, type Column } from '@/components/shared/data-table'
import { TruncatedText } from '@/components/shared/truncated-text'
import { RotateCcw, Check, X, Eye } from 'lucide-react'
import { formatMXN, formatDate } from '@/lib/format'
import { toast } from 'sonner'
import { type Devolucion, type EstadoDevolucion } from '@/lib/types'

export function DevolucionesModule() {
  const devoluciones = useStore((s) => s.devoluciones)
  const ventas = useStore((s) => s.ventas)
  // Defensive fallback: en la nueva arquitectura el campo `ordenes` fue renombrado
  // a `servicios`. Mantenemos el fallback a `servicios` y `[]` para evitar crashes
  // cuando el módulo se carga en un store que ya no expone `ordenes`.
  const ordenes = useStore((s) => s.ordenes) || useStore((s) => s.servicios) || []
  const productos = useStore((s) => s.productos)
  const piezas = useStore((s) => s.piezas)
  const usuarios = useStore((s) => s.usuarios)

  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [dialogRevisar, setDialogRevisar] = useState<Devolucion | null>(null)
  const [notasRevision, setNotasRevision] = useState('')

  const devolucionesFiltradas = devoluciones.filter(
    (d) => filtroEstado === 'todos' || d.estado === filtroEstado
  )

  const pendientes = devoluciones.filter((d) => d.estado === 'PENDIENTE_REVISION')
  const aprobadas = devoluciones.filter((d) => d.estado === 'APROBADA')
  const rechazadas = devoluciones.filter((d) => d.estado === 'RECHAZADA')

  const getProductoNombre = (d: Devolucion) => {
    if (d.productoId) {
      const p = productos.find((x) => x.id === d.productoId)
      return p?.nombre || 'Producto eliminado'
    }
    if (d.piezaId) {
      const p = piezas.find((x) => x.id === d.piezaId)
      return p?.nombre || 'Pieza eliminada'
    }
    return '—'
  }

  const getOrigen = (d: Devolucion) => {
    if (d.ventaId) {
      const v = ventas.find((x) => x.id === d.ventaId)
      return v ? `Venta ${v.folio}` : 'Venta eliminada'
    }
    if (d.ordenId) {
      const o = ordenes.find((x) => x.id === d.ordenId)
      return o ? `Orden ${o.folio}` : 'Orden eliminada'
    }
    return '—'
  }

  const abrirRevisar = (d: Devolucion) => {
    setDialogRevisar(d)
    setNotasRevision('')
  }

  const handleRevisar = async (estado: EstadoDevolucion) => {
    if (!dialogRevisar) return
    try {
      // useDataService enruta a Electron IPC (-> Prisma -> SQLite) cuando hay
      // electronAPI, y hace fallback a revisarDevolucion de Zustand en modo web
      // puro. El adapter ya sincroniza Zustand desde SQLite tras la mutación.
      await useDataService().revisarDevolucion(dialogRevisar.id, estado, notasRevision)
      toast.success(
        estado === 'APROBADA'
          ? 'Devolución aprobada — stock devuelto al inventario'
          : 'Devolución rechazada'
      )
      setDialogRevisar(null)
      setNotasRevision('')
    } catch (err: any) {
      console.error('[DEVOLUCIONES] Error al revisar:', err)
      toast.error('Error al revisar la devolución', { description: err?.message })
    }
  }

  const getEstadoBadge = (estado: string) => {
    if (estado === 'PENDIENTE_REVISION') return <Badge variant="secondary">Pendiente de Revisión</Badge>
    if (estado === 'APROBADA') return <Badge variant="default" className="bg-green-600">Aprobada</Badge>
    return <Badge variant="destructive">Rechazada</Badge>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Devoluciones"
        description="Las devoluciones deben ser revisadas antes de volver al inventario"
        icon={<RotateCcw className="h-5 w-5" />}
      />

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase">Pendientes de Revisión</p>
            <p className="text-2xl font-bold text-accent">{pendientes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase">Aprobadas</p>
            <p className="text-2xl font-bold text-green-600">{aprobadas.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase">Rechazadas</p>
            <p className="text-2xl font-bold text-red-600">{rechazadas.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {[
          { value: 'todos', label: 'Todas' },
          { value: 'PENDIENTE_REVISION', label: 'Pendientes' },
          { value: 'APROBADA', label: 'Aprobadas' },
          { value: 'RECHAZADA', label: 'Rechazadas' },
        ].map((f) => (
          <Button
            key={f.value}
            variant={filtroEstado === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroEstado(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <DataTable<Devolucion>
            data={devolucionesFiltradas}
            pageSize={25}
            searchPlaceholder="Buscar por folio, motivo, producto..."
            searchFn={(d, q) =>
              d.folio.toLowerCase().includes(q) ||
              d.tipo.toLowerCase().includes(q) ||
              (d.motivo || '').toLowerCase().includes(q) ||
              d.estado.toLowerCase().includes(q) ||
              getProductoNombre(d).toLowerCase().includes(q)
            }
            loadingOverlay
            emptyMessage="No hay devoluciones en este filtro."
            rowKey={(d) => d.id}
            columns={[
              { key: 'folio', header: 'Folio', render: (d) => <span className="font-mono text-xs font-bold">{d.folio}</span> },
              {
                key: 'tipo',
                header: 'Tipo',
                render: (d) => (
                  <Badge variant={d.tipo === 'PRODUCTO' ? 'secondary' : 'outline'}>
                    {d.tipo}
                  </Badge>
                ),
              },
              {
                key: 'producto',
                header: 'Producto/Pieza',
                render: (d) => <TruncatedText text={getProductoNombre(d)} className="text-sm" maxWidth="max-w-[200px]" />,
              },
              { key: 'cantidad', header: <div className="text-center">Cantidad</div>, className: 'text-center', render: (d) => d.cantidad },
              { key: 'motivo', header: 'Motivo', render: (d) => <TruncatedText text={d.motivo} className="text-sm" maxWidth="max-w-[240px]" /> },
              { key: 'estado', header: 'Estado', render: (d) => getEstadoBadge(d.estado) },
              { key: 'fecha', header: 'Fecha', render: (d) => <span className="text-xs text-muted-foreground">{formatDate(d.createdAt)}</span> },
              {
                key: 'acciones',
                header: <div className="text-right">Acciones</div>,
                className: 'text-right',
                render: (d) =>
                  d.estado === 'PENDIENTE_REVISION' ? (
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); abrirRevisar(d) }}>
                      Revisar
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" disabled>
                      Revisada
                    </Button>
                  ),
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* Dialog revisar devolución */}
      <Dialog open={!!dialogRevisar} onOpenChange={(o) => !o && setDialogRevisar(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Revisar Devolución — {dialogRevisar?.folio}</DialogTitle>
          </DialogHeader>
          {dialogRevisar && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm"><strong>Tipo:</strong> {dialogRevisar.tipo}</p>
                <p className="text-sm"><strong>Producto:</strong> {getProductoNombre(dialogRevisar)}</p>
                <p className="text-sm"><strong>Cantidad:</strong> {dialogRevisar.cantidad}</p>
                <p className="text-sm"><strong>Origen:</strong> {getOrigen(dialogRevisar)}</p>
                <p className="text-sm"><strong>Motivo:</strong> {dialogRevisar.motivo}</p>
              </div>
              <div className="space-y-2">
                <Label>Notas de revisión (opcional)</Label>
                <Textarea
                  value={notasRevision}
                  onChange={(e) => setNotasRevision(e.target.value)}
                  rows={3}
                  placeholder="Ej: Producto en buen estado, se devuelve al inventario"
                />
              </div>
              <div className="p-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 text-xs">
                <strong>Importante:</strong> Si apruebas, el stock se devolverá al inventario automáticamente.
                Si rechazas, el stock no se modifica.
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogRevisar(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => handleRevisar('RECHAZADA')}>
              <X className="h-4 w-4 mr-2" /> Rechazar
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleRevisar('APROBADA')}>
              <Check className="h-4 w-4 mr-2" /> Aprobar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
