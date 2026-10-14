'use client'

import { useMemo } from 'react'
import { useStore } from '@/lib/store'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DataTable, type Column } from '@/components/shared/data-table'
import { TruncatedText } from '@/components/shared/truncated-text'
import {
  DollarSign, Clock, CheckCircle2, Wallet, TrendingUp, ShoppingCart, Wrench,
} from 'lucide-react'
import { formatMXN, formatDate } from '@/lib/format'
import { type CommissionEntry, type OperatorPayment } from '@/lib/types'

export function MisComisionesModule() {
  const usuarioActual = useStore((s) => s.usuarioActual)
  const commissionEntries = useStore((s) => s.commissionEntries)
  const operatorPayments = useStore((s) => s.operatorPayments)
  const usuarios = useStore((s) => s.usuarios)

  const operarioId = usuarioActual?.id || ''

  const misComisiones = useMemo(
    () => commissionEntries.filter((ce) => ce.operarioId === operarioId),
    [commissionEntries, operarioId]
  )

  const misPagos = useMemo(
    () => operatorPayments.filter((op) => op.operarioId === operarioId),
    [operatorPayments, operarioId]
  )

  if (!usuarioActual) return null

  const pendientes = misComisiones.filter((ce) => ce.estado === 'ACTIVE' && !ce.operatorPaymentId)
  const pagadas = misComisiones.filter((ce) => ce.estado === 'ACTIVE' && !!ce.operatorPaymentId)
  const canceladas = misComisiones.filter((ce) => ce.estado === 'CANCELLED')

  const totalPendiente = pendientes.reduce((s, ce) => s + ce.amount, 0)
  const totalPagado = pagadas.reduce((s, ce) => s + ce.amount, 0)
  const totalHistorico = misComisiones.filter((ce) => ce.estado === 'ACTIVE').reduce((s, ce) => s + ce.amount, 0)

  const ventasCount = misComisiones.filter((ce) => ce.type === 'SALE' && ce.estado === 'ACTIVE').length
  const serviciosCount = misComisiones.filter((ce) => ce.type === 'SERVICE' && ce.estado === 'ACTIVE').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis Comisiones"
        description={`Historial de comisiones y pagos recibidos — ${usuarioActual.nombre}`}
        icon={<DollarSign className="h-5 w-5" />}
      />

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pendiente de Pago"
          value={formatMXN(totalPendiente)}
          subtitle={`${pendientes.length} comisiones`}
          icon={Clock}
          variant="accent"
        />
        <StatCard
          title="Total Pagado"
          value={formatMXN(totalPagado)}
          subtitle={`${misPagos.filter((p) => p.status === 'PAID').length} pagos`}
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="Histórico Total"
          value={formatMXN(totalHistorico)}
          subtitle={`${ventasCount + serviciosCount} comisiones generadas`}
          icon={TrendingUp}
        />
        <StatCard
          title="Pagos Recibidos"
          value={misPagos.filter((p) => p.status === 'PAID').length}
          subtitle={`${misPagos.filter((p) => p.status === 'PENDING').length} pendientes de confirmar`}
          icon={Wallet}
        />
      </div>

      {/* Desglose por tipo */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Comisiones por Ventas</p>
              <p className="text-lg font-bold">{ventasCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Comisiones por Servicios</p>
              <p className="text-lg font-bold">{serviciosCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalle de comisiones */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Detalle de Comisiones Generadas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable<CommissionEntry>
            data={misComisiones}
            pageSize={25}
            searchPlaceholder="Buscar por descripción, tipo, estado..."
            searchFn={(ce, q) =>
              ce.description.toLowerCase().includes(q) ||
              ce.type.toLowerCase().includes(q) ||
              ce.estado.toLowerCase().includes(q)
            }
            loadingOverlay
            emptyMessage="No tienes comisiones registradas aún. Las comisiones se generan automáticamente al realizar ventas o completar servicios."
            rowKey={(ce) => ce.id}
            columns={[
              { key: 'fecha', header: 'Fecha', render: (ce) => <span className="text-xs">{formatDate(ce.createdAt, true)}</span> },
              { key: 'descripcion', header: 'Descripción', render: (ce) => <TruncatedText text={ce.description} className="text-sm" maxWidth="max-w-[260px]" /> },
              {
                key: 'tipo',
                header: 'Tipo',
                render: (ce) => (
                  <Badge variant={ce.type === 'SALE' ? 'default' : 'outline'}>
                    {ce.type === 'SALE' ? 'Venta' : 'Servicio'}
                  </Badge>
                ),
              },
              {
                key: 'estado',
                header: 'Estado',
                render: (ce) =>
                  ce.estado === 'CANCELLED' ? (
                    <Badge variant="destructive">Cancelada</Badge>
                  ) : ce.operatorPaymentId ? (
                    <Badge variant="default" className="bg-green-600">Pagada</Badge>
                  ) : (
                    <Badge variant="secondary">Pendiente</Badge>
                  ),
              },
              {
                key: 'monto',
                header: <div className="text-right">Monto</div>,
                className: 'text-right font-bold',
                render: (ce) => (
                  <span className={ce.estado === 'CANCELLED' ? 'text-muted-foreground line-through' : 'text-accent'}>
                    {formatMXN(ce.amount)}
                  </span>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* Historial de pagos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Historial de Pagos Recibidos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable<OperatorPayment>
            data={misPagos}
            pageSize={25}
            searchPlaceholder="Buscar por folio, estado..."
            searchFn={(op, q) =>
              op.folio.toLowerCase().includes(q) ||
              op.status.toLowerCase().includes(q) ||
              (() => {
                const u = usuarios.find((x) => x.id === op.paidById)
                return u ? u.nombre.toLowerCase().includes(q) : false
              })()
            }
            loadingOverlay
            emptyMessage="No has recibido pagos todavía."
            rowKey={(op) => op.id}
            columns={[
              { key: 'folio', header: 'Folio', render: (op) => <span className="font-mono text-xs font-bold">{op.folio}</span> },
              { key: 'generado', header: 'Generado', render: (op) => <span className="text-xs">{formatDate(op.date, true)}</span> },
              { key: 'comisiones', header: <div className="text-center">Comisiones</div>, className: 'text-center', render: (op) => op.commissionEntryIds.length },
              {
                key: 'monto',
                header: <div className="text-right">Monto</div>,
                className: 'text-right font-bold text-accent',
                render: (op) => formatMXN(op.amount),
              },
              {
                key: 'estado',
                header: 'Estado',
                render: (op) => (
                  <Badge variant={op.status === 'PAID' ? 'default' : 'secondary'} className={op.status === 'PAID' ? 'bg-green-600' : ''}>
                    {op.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                  </Badge>
                ),
              },
              { key: 'fechaPago', header: 'Fecha Pago', render: (op) => <span className="text-xs">{op.paidAt ? formatDate(op.paidAt, true) : '—'}</span> },
              {
                key: 'confirmadoPor',
                header: 'Confirmado Por',
                render: (op) => {
                  const pagadoPor = usuarios.find((u) => u.id === op.paidById)
                  return <span className="text-sm">{pagadoPor?.nombre || '—'}</span>
                },
              },
            ]}
          />
        </CardContent>
      </Card>

      {canceladas.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-muted-foreground">Comisiones Canceladas ({canceladas.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable<CommissionEntry>
              data={canceladas}
              pageSize={25}
              searchPlaceholder="Buscar por descripción..."
              searchFn={(ce, q) => ce.description.toLowerCase().includes(q)}
              loadingOverlay
              emptyMessage="No hay comisiones canceladas."
              rowKey={(ce) => ce.id}
              rowClassName={() => 'opacity-60'}
              columns={[
                { key: 'fecha', header: 'Fecha', render: (ce) => <span className="text-xs">{formatDate(ce.createdAt, true)}</span> },
                { key: 'descripcion', header: 'Descripción', render: (ce) => <TruncatedText text={ce.description} className="text-sm" maxWidth="max-w-[260px]" /> },
                {
                  key: 'monto',
                  header: <div className="text-right">Monto</div>,
                  className: 'text-right text-muted-foreground line-through',
                  render: (ce) => formatMXN(ce.amount),
                },
              ]}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
