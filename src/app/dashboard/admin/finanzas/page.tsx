import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Wallet, TrendingUp, HandCoins, ArrowRight, Receipt, FileText, Settings2 } from 'lucide-react'
import ParametrosFinancierosCard from './ParametrosFinancierosCard'

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

    // Calcular montos desde la tabla recibos_cobro
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

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header Rediseñado */}
            <div className="bg-[#1e3a8a] text-white px-6 pt-12 pb-6 rounded-b-3xl shadow-md sticky top-0 z-40">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Centro Financiero</h1>
                        <p className="text-blue-100/80 text-sm mt-1">Estado contable del Condominio</p>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-gradient-to-br from-white/10 to-transparent p-5 rounded-2xl border border-white/20 backdrop-blur-sm">
                    <p className="text-blue-200 text-xs font-bold tracking-widest mb-1">CFO DASHBOARD</p>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-white/60 text-sm mb-1">Recaudación Total</p>
                            <h2 className="text-3xl font-bold tracking-tight">${totalRecaudado.toFixed(2)}</h2>
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
                        <p className="text-[10px] font-bold text-emerald-600 tracking-widest uppercase mb-1">EMITIDO</p>
                        <p className="text-lg font-bold text-emerald-700">${totalEmitido.toFixed(2)}</p>
                    </div>

                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl">
                        <HandCoins className="w-5 h-5 text-orange-600 mb-2" />
                        <p className="text-[10px] font-bold text-orange-600 tracking-widest uppercase mb-1">POR COBRAR</p>
                        <p className="text-lg font-bold text-orange-700">${totalCuentasPorCobrar.toFixed(2)}</p>
                    </div>
                </div>

                {/* === INYECCIÓN DE LA CARTA DE PARAMETROS (FASE 16) === */}
                <div className="pt-2">
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
