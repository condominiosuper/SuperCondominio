import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Wallet, TrendingUp, HandCoins, ArrowRight, Receipt, FileText, TrendingDown, ClipboardList } from 'lucide-react'
import ParametrosFinancierosCard from './ParametrosFinancierosCard'
import { getReporteConsolidadosAction } from './actions'
import ReporteCuentasPorCobrar from '@/components/ReporteCuentasPorCobrar'
import ExcelActions from '@/components/ExcelActions'

export default async function AdminFinanzasPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return (
            <div className="p-5 text-center text-slate-500">
                Sesión no iniciada. <Link href="/login" className="text-blue-600 underline">Ir al Login</Link>
            </div>
        )
    }

    // Obtener condominio del Admin con los atributos financieros base
    const { data: adminPerfil } = await supabase
        .from('perfiles')
        .select(`
            condominio_id,
            condominios ( monto_mensual_usd, dia_cobro )
        `)
        .eq('auth_user_id', user.id)
        .eq('rol', 'admin')
        .single()

    if (!adminPerfil) {
        return <div className="p-5 text-red-500">Error: Perfil Admin no encontrado.</div>
    }

    // Obtener Tasa BCV Oficial
    let tasaBcv = 36.50;
    try {
        const resBcv = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', { next: { revalidate: 3600 } })
        if (resBcv.ok) {
            const dataBcv = await resBcv.json()
            tasaBcv = dataBcv.promedio
        }
    } catch (e) { }

    // Obtener Data para el Reporte Consolidado
    const { data: reporteData } = await getReporteConsolidadosAction()

    // Calcular montos desde la tabla recibos_cobro (INGRESOS)
    const { data: recibos } = await supabase
        .from('recibos_cobro')
        .select('monto_usd, monto_pagado_usd, estado')
        .eq('condominio_id', adminPerfil.condominio_id)

    let totalEmitido = 0;
    let totalRecaudado = 0;
    let totalCuentasPorCobrar = 0;

    if (recibos) {
        recibos.forEach(r => {
            totalEmitido += Number(r.monto_usd);
            totalRecaudado += Number(r.monto_pagado_usd);
            if (r.estado !== 'pagado') {
                totalCuentasPorCobrar += (Number(r.monto_usd) - Number(r.monto_pagado_usd));
            }
        });
    }

    // Calcular montos de egresos (GASTOS)
    const { data: egresos } = await supabase
        .from('egresos')
        .select('monto_usd')
        .eq('condominio_id', adminPerfil.condominio_id)

    const totalEgresos = egresos?.reduce((acc, curr) => acc + Number(curr.monto_usd), 0) || 0;
    const balanceNeto = totalRecaudado - totalEgresos;

    return (
        <div className="min-h-screen bg-slate-50 pb-20 overflow-x-hidden">
            {/* Header Rediseñado - Sticky a nivel de mobile */}
            <div className="bg-[#1e3a8a] text-white px-6 pt-12 pb-6 rounded-b-3xl shadow-lg sticky top-0 z-50">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Centro Financiero</h1>
                        <p className="text-blue-100/80 text-sm mt-1">Estado contable del Condominio</p>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-gradient-to-br from-white/10 to-transparent p-5 rounded-2xl border border-white/20 backdrop-blur-sm">
                    <p className="text-blue-200 text-xs font-bold tracking-widest mb-1">BALANCE NETO (CAJA)</p>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-white/60 text-sm mb-1">Caja Disponible</p>
                            <h2 className="text-3xl font-bold tracking-tight">${balanceNeto.toFixed(2)}</h2>
                        </div>
                        <div className="bg-white/20 p-3 rounded-xl">
                            <Wallet className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-5 mt-6 space-y-4">

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                        <TrendingUp className="w-5 h-5 text-emerald-600 mb-2" />
                        <p className="text-[10px] font-bold text-emerald-600 tracking-widest uppercase mb-1">INGRESOS</p>
                        <p className="text-lg font-bold text-emerald-700">${totalRecaudado.toFixed(2)}</p>
                    </div>

                    <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                        <TrendingDown className="w-5 h-5 text-red-600 mb-2" />
                        <p className="text-[10px] font-bold text-red-600 tracking-widest uppercase mb-1">EGRESOS</p>
                        <p className="text-lg font-bold text-red-700">${totalEgresos.toFixed(2)}</p>
                    </div>
                </div>

                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-bold text-orange-600 tracking-widest uppercase">CUENTAS POR COBRAR</p>
                        <p className="text-xl font-bold text-orange-700">${totalCuentasPorCobrar.toFixed(2)}</p>
                    </div>
                    <div className="bg-white/50 p-2 rounded-lg text-orange-600 text-xs font-bold">
                        {(totalCuentasPorCobrar * tasaBcv).toLocaleString('es-VE')} Bs.
                    </div>
                </div>

                {/* === REPORTE CONSOLIDADO (NUEVO) === */}
                <div className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 px-1">
                        <div className="flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-slate-800" />
                            <h3 className="text-slate-800 font-bold">Reporte Consolidado de Deudas</h3>
                        </div>
                        <ExcelActions />
                    </div>
                    {reporteData ? (
                        <ReporteCuentasPorCobrar data={reporteData} tasaBcv={tasaBcv} />
                    ) : (
                        <div className="p-10 text-center bg-white rounded-3xl border border-slate-100 text-slate-400 text-sm">
                            Cargando reporte...
                        </div>
                    )}
                </div>
                {/* =================================== */}

                {/* === INYECCIÓN DE LA CARTA DE PARAMETROS (FASE 16) === */}
                <div className="pt-6">
                    <ParametrosFinancierosCard
                        // @ts-ignore
                        montoMensualInicial={adminPerfil.condominios?.monto_mensual_usd || 0}
                        // @ts-ignore
                        diaCobroInicial={adminPerfil.condominios?.dia_cobro || 1}
                    />
                </div>
                {/* ======================================================= */}


                <h3 className="text-slate-800 font-bold mt-8 mb-2 px-1">Acciones Rápidas</h3>

                <Link href="/dashboard/admin/emitir-cobro" className="flex items-center justify-between bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                            <Receipt className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-lg">Cuota Especial Dinámica</p>
                            <p className="text-sm text-slate-500">Generar cobro para todos</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 w-10 h-10 rounded-full flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                        <ArrowRight className="w-5 h-5" />
                    </div>
                </Link>

                <Link href="/dashboard/admin/finanzas/egresos" className="flex items-center justify-between bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-center gap-4">
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl">
                            <TrendingDown className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-lg">Control de Egresos</p>
                            <p className="text-sm text-slate-500">Registro de facturas y gastos</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 w-10 h-10 rounded-full flex items-center justify-center text-slate-400 group-hover:text-red-600 group-hover:bg-red-50 transition-colors">
                        <ArrowRight className="w-5 h-5" />
                    </div>
                </Link>

                <div className="flex items-center justify-between bg-white border border-slate-200 p-5 rounded-2xl shadow-sm opacity-60">
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-100 text-slate-400 p-3 rounded-xl">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-lg">Reporte Mensual (PDF)</p>
                            <p className="text-sm text-slate-500">Próximamente...</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
