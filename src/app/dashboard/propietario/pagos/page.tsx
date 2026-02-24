import { ArrowLeft, Filter, CheckCircle2, Clock, XCircle, ChevronRight, ReceiptIcon } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function PagosPropietarioPage() {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const perfilId = cookieStore.get('propietario_token')?.value

    if (!perfilId) {
        redirect('/dashboard/propietario/validar')
    }

    // 1. Obtener inmuebles del propietario para calcular deuda pendiente
    const { data: inmuebles } = await supabase
        .from('inmuebles')
        .select('id')
        .eq('propietario_id', perfilId)

    const inmueblesIds = inmuebles?.map(i => i.id) || []
    let saldoPendienteUsd = 0

    if (inmueblesIds.length > 0) {
        const { data: recibos } = await supabase
            .from('recibos_cobro')
            .select('monto_usd, monto_pagado_usd')
            .in('inmueble_id', inmueblesIds)
            .neq('estado', 'pagado')

        saldoPendienteUsd = recibos?.reduce((acc, r) => acc + (Number(r.monto_usd) - Number(r.monto_pagado_usd)), 0) || 0
    }

    // 2. Obtener historial de pagos reportados
    const { data: pagos } = await supabase
        .from('pagos_reportados')
        .select('*, recibos_cobro(mes)')
        .eq('perfil_id', perfilId)
        .order('created_at', { ascending: false })

    // Calcular total aprobado
    const totalAprobadoUsd = pagos
        ?.filter(p => p.estado === 'aprobado')
        .reduce((acc, curr) => acc + Number(curr.monto_equivalente_usd), 0) || 0

    return (
        <div className="relative pb-24 bg-slate-50 min-h-screen">

            {/* Header Mis Pagos */}
            <header className="px-5 py-4 flex items-center justify-between border-b border-slate-200 bg-white sticky top-0 z-40">
                <Link href="/dashboard/propietario" className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-lg font-bold text-slate-900">Mis Pagos</h1>
                <button className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                    <Filter className="w-5 h-5" />
                </button>
            </header>

            <div className="px-5 pt-6 space-y-6">

                {/* Tarjetas de Resumen */}
                <div className="flex gap-4">
                    <div className="flex-1 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                        <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">SALDO PENDIENTE</p>
                        <p className="text-xl font-bold text-slate-900">${saldoPendienteUsd.toFixed(2)}</p>
                    </div>

                    <div className="flex-1 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                        <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">TOTAL APROBADO</p>
                        <p className="text-xl font-bold text-emerald-600">${totalAprobadoUsd.toFixed(2)}</p>
                    </div>
                </div>

                {/* Historial de Pagos */}
                <div>
                    <h2 className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-4">HISTORIAL DE PAGOS</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                        {pagos && pagos.length > 0 ? (
                            pagos.map((pago) => {
                                const mesRecibo = (pago.recibos_cobro as any)?.mes || 'Abono General'
                                const formatFecha = new Date(pago.fecha_pago).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })

                                return (
                                    <div key={pago.id} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col shadow-sm cursor-pointer hover:border-slate-300 transition-colors">
                                        <div className="flex items-center gap-4">

                                            {/* Icono según estado */}
                                            {pago.estado === 'aprobado' && (
                                                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                                    <CheckCircle2 className="w-6 h-6" />
                                                </div>
                                            )}
                                            {(pago.estado === 'en_revision' || pago.estado === 'pendiente') && (
                                                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                                    <Clock className="w-6 h-6" />
                                                </div>
                                            )}
                                            {pago.estado === 'rechazado' && (
                                                <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                                                    <XCircle className="w-6 h-6" />
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="font-bold text-slate-900 truncate capitalize">{mesRecibo}</h3>
                                                    <span className="font-bold text-slate-900 ml-2">${Number(pago.monto_equivalente_usd).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <p className="text-xs text-slate-500 truncate">Ref: #{pago.referencia} • {formatFecha}</p>
                                                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                                                </div>
                                                <div className="mt-2 inline-flex">
                                                    {pago.estado === 'aprobado' && (
                                                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase">Aprobado</span>
                                                    )}
                                                    {(pago.estado === 'en_revision' || pago.estado === 'pendiente') && (
                                                        <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase">Pendiente</span>
                                                    )}
                                                    {pago.estado === 'rechazado' && (
                                                        <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase">Rechazado</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Motivo de Rechazo (Opcional, solo si aplica) */}
                                        {pago.estado === 'rechazado' && pago.nota_admin && (
                                            <div className="mt-4 bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-100">
                                                <span className="font-bold">Motivo: </span> {pago.nota_admin}
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        ) : (
                            <div className="text-center py-10 opacity-70">
                                <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ReceiptIcon className="w-8 h-8 text-slate-400" />
                                </div>
                                <p className="text-slate-500 font-medium pb-1">No hay pagos reportados</p>
                                <p className="text-slate-400 text-sm">Los comprobantes que envíes aparecerán aquí.</p>
                            </div>
                        )}

                    </div>
                </div>

            </div>

            {/* Botón Flotante Inferior (Reportar Nuevo) */}
            <div className="fixed bottom-[85px] md:static md:mt-8 left-0 right-0 max-w-md md:max-w-none mx-auto px-5 md:px-0 z-40 flex md:justify-end">
                <Link href="/dashboard/propietario/pagos/nuevo" className="w-full md:w-auto md:px-12 bg-[#1e3a8a] text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-900 transition-colors active:scale-95 flex items-center justify-center cursor-pointer">
                    Reportar Nuevo Pago
                </Link>
            </div>

        </div>
    )
}
