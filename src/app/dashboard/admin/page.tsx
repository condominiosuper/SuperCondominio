import { Search, MessageSquare, Clock, ChevronDown, CheckCircle2, ChevronRight, Receipt, FileText, Megaphone, Bell, TrendingUp, Building, Calendar, Check, X, Eye, Plus, AlertCircle, Ticket, Wallet, Download } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import CaptureViewer from './CaptureViewer'
import NotificacionesWidget from '@/components/NotificacionesWidget'

export default async function AdminDashboardPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return (
            <div className="p-5 text-center text-slate-500">
                Sesión no iniciada. <Link href="/login" className="text-blue-600 underline">Ir al Login</Link>
            </div>
        )
    }

    const resolvedParams = await searchParams
    const successMsg = resolvedParams?.success === 'cobros_emitidos'
    const verPagoId = resolvedParams?.ver_pago;

    // Obtener condominio del Admin
    const { data: adminPerfil } = await supabase
        .from('perfiles')
        .select(`
            nombres, apellidos, condominio_id,
            condominios ( nombre, anuncio_tablon )
        `)
        .eq('auth_user_id', user.id)
        .eq('rol', 'admin')
        .single()

    if (!adminPerfil) {
        return <div className="p-5 text-red-500">Error: Perfil Admin no encontrado.</div>
    }

    const condominioData = adminPerfil?.condominios as any;
    const anuncioTablon = condominioData?.anuncio_tablon;

    // Contar notificaciones no leídas para Admin
    const { count: unreadAdminCount } = await supabase
        .from('notificaciones')
        .select('*', { count: 'exact', head: true })
        .eq('condominio_id', adminPerfil.condominio_id)
        .is('perfil_id', null)
        .eq('leida', false)

    // Cargar Pagos Pendientes (en_revision)
    const { data: pagosPendientes, error: errorPagos } = await supabase
        .from('pagos_reportados')
        .select(`
            *,
            perfiles:perfil_id (
                nombres,
                apellidos,
                inmuebles ( identificador )
            )
        `)
        .eq('condominio_id', adminPerfil.condominio_id)
        .eq('estado', 'en_revision')
        .order('created_at', { ascending: false })

    const totalPendientes = pagosPendientes?.length || 0;
    const montoTotalBs = pagosPendientes?.reduce((acc, pago) => acc + Number(pago.monto_bs), 0) || 0;
    const pagoSeleccionado = pagosPendientes?.find(p => p.id === verPagoId);

    // Calcular montos desde la tabla recibos_cobro para las estadísticas Desktop
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

    // Obtener Tasa BCV Oficial para el Layout
    let tasaBcv = 36.50;
    try {
        const resBcv = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', { next: { revalidate: 3600 } })
        if (resBcv.ok) {
            const dataBcv = await resBcv.json()
            tasaBcv = dataBcv.promedio
        }
    } catch (e) { }

    return (
        <>
            {/* ========================================================= */}
            {/* MODAL GLOBAL PARA DETALLES DEL PAGO (Desktop y Mobile)    */}
            {/* ========================================================= */}
            {pagoSeleccionado && (
                <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 text-lg">Revisar Pago <span className="text-[#1e3a8a]">#{pagoSeleccionado.referencia}</span></h3>
                            <Link href="/dashboard/admin" scroll={false} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </Link>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-inner">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">CANTIDAD REPORTADA</p>
                                    <p className="text-2xl font-black text-[#1e3a8a]">{Number(pagoSeleccionado.monto_bs).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">EQUIVALENTE</p>
                                    <p className="text-xl font-bold text-emerald-600">${(Number(pagoSeleccionado.monto_bs) / pagoSeleccionado.tasa_aplicada).toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Comprobante */}
                            <div className="flex justify-center my-6">
                                <CaptureViewer url={pagoSeleccionado.capture_url} referencia={pagoSeleccionado.referencia} />
                            </div>

                            <p className="text-xs text-center font-medium text-slate-500 pb-2">Verifique minuciosamente la referencia en el banco.</p>

                            {/* Acciones */}
                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                                <form action={async () => {
                                    "use server"
                                    const { rechazarPagoAction } = await import('./actions')
                                    await rechazarPagoAction(pagoSeleccionado.id)
                                }}>
                                    <button type="submit" className="w-full flex items-center justify-center gap-2 bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl py-3.5 font-bold transition-all">
                                        <X className="w-5 h-5" /> Rechazar
                                    </button>
                                </form>

                                <form action={async () => {
                                    "use server"
                                    const { aprobarPagoAction } = await import('./actions')
                                    await aprobarPagoAction(pagoSeleccionado.id)
                                }}>
                                    <button type="submit" className="w-full flex items-center justify-center gap-2 bg-[#1e3a8a] text-white hover:bg-blue-900 hover:shadow-lg rounded-xl py-3.5 border-2 border-[#1e3a8a] hover:border-blue-900 font-bold transition-all">
                                        <Check className="w-5 h-5" /> Aprobar
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* ========================================================= */}
            {/* VISTA DESKTOP (Basada en nuevo Mockup L-Shape)          */}
            {/* ========================================================= */}
            <div className="hidden md:block min-h-screen bg-slate-50 p-6 xl:p-8 pb-24">
                {/* Header Superior Global */}
                <header className="flex items-center justify-between mb-8 bg-white p-4 lg:p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-full max-w-md hidden lg:block">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Buscar residente o inmueble..." className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none transition-all font-medium text-slate-700" />
                        </div>
                        <div className="bg-blue-50 text-[#1e3a8a] px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-xs font-bold border border-blue-100 flex items-center gap-2">
                            <span className="text-blue-400 uppercase tracking-widest text-[9px] lg:text-[10px]">TASA BCV OFICIAL</span>
                            <span className="text-sm">{tasaBcv.toFixed(2)} Bs/USD</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 min-w-fit">
                        <NotificacionesWidget count={unreadAdminCount || 0} href="/dashboard/admin/notificaciones" theme="light" />
                        <button className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 p-2 rounded-full border border-slate-100 hover:border-slate-200">
                            <MessageSquare className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3 border-l border-slate-200 pl-5 ml-2 cursor-pointer group">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-800 leading-tight group-hover:text-[#1e3a8a] transition-colors">{adminPerfil?.nombres} {adminPerfil?.apellidos}</p>
                                <p className="text-[10px] text-slate-500 font-medium">Súper Administrador</p>
                            </div>
                            <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden border-2 border-slate-100 shadow-sm group-hover:border-[#1e3a8a]/30 transition-all flex items-center justify-center font-bold text-[#1e3a8a]">
                                {/* Initial Avatar */}
                                {adminPerfil?.nombres?.charAt(0)}{adminPerfil?.apellidos?.charAt(0)}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="space-y-6 max-w-7xl mx-auto">

                    {successMsg && (
                        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 text-sm font-medium flex items-center justify-between">
                            <span>✅ Recibos generados y emitidos exitosamente a todos los condóminos de la torre.</span>
                        </div>
                    )}

                    {/* Título y Acciones Macro */}
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Visión General</h1>
                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">Estado en tiempo real de la gestión administrativa para <span className="italic font-bold text-slate-700">"{condominioData?.nombre}"</span></p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 hover:shadow-md flex items-center gap-2 transition-all">
                                <Download className="w-4 h-4" /> Exportar Datos
                            </button>
                            <Link href="/dashboard/admin/emitir-cobro" className="bg-[#1e3a8a] text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-900 hover:shadow-md flex items-center gap-2 transition-all">
                                <Plus className="w-4 h-4" /> Cuota Especial
                            </Link>
                        </div>
                    </div>

                    {/* Fila Métrica Principal (3 Tarjetas) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-red-200 transition-all cursor-default">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500 border border-red-100">
                                    <Wallet className="w-6 h-6" />
                                </div>
                                <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1.5 rounded-md border border-red-100">+12% vs mes pasado</span>
                            </div>
                            <p className="text-xs text-slate-500 font-bold tracking-wide mb-1 uppercase">Deuda Total Pendiente</p>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">${totalCuentasPorCobrar.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
                            <p className="text-sm text-slate-400 font-medium mt-1">{(totalCuentasPorCobrar * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all cursor-default">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-100">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1.5 rounded-md border border-emerald-100">Meta: 85%</span>
                            </div>
                            <p className="text-xs text-slate-500 font-bold tracking-wide mb-1 uppercase">Recaudado (Mes Actual)</p>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">${totalRecaudado.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
                            <p className="text-sm text-slate-400 font-medium mt-1">{(totalRecaudado * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-orange-200 transition-all cursor-default">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 border border-orange-100">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-1.5 rounded-md border border-orange-100">Acción Urgente</span>
                            </div>
                            <p className="text-xs text-slate-500 font-bold tracking-wide mb-1 uppercase">Conciliación Bancaria Pendiente</p>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{totalPendientes} Pagos</h2>
                            <p className="text-sm text-slate-400 font-medium mt-1 truncate">Esperando su pronta revisión administrativa</p>
                        </div>
                    </div>

                    {/* Grilla Bi-Columna Compleja */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* COLUMNA IZQUIERDA (Gráfico y Actividad) */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Tendencia Mensual */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">
                                <div className="flex flex-wrap items-center justify-between mb-10 gap-4">
                                    <h3 className="text-lg lg:text-xl font-bold text-slate-900 tracking-tight">Tendencia de Recaudación Mensual</h3>
                                    <div className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-50 flex items-center gap-2 shadow-sm">
                                        Últimos 6 Meses <ChevronDown className="w-4 h-4" />
                                    </div>
                                </div>
                                {/* CSS Bar Chart Responsivo */}
                                <div className="h-56 lg:h-64 flex items-end justify-between gap-3 lg:gap-6 relative border-b border-slate-100 pb-2 px-1">
                                    <div className="absolute w-full h-full flex flex-col justify-between pointer-events-none opacity-25">
                                        <div className="border-t border-slate-400 border-dashed w-full h-[1px]"></div>
                                        <div className="border-t border-slate-400 border-dashed w-full h-[1px]"></div>
                                        <div className="border-t border-slate-400 border-dashed w-full h-[1px]"></div>
                                        <div className="border-t border-slate-400 border-dashed w-full h-[1px]"></div>
                                    </div>
                                    {['Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((month, i) => {
                                        const heights = ['35%', '42%', '30%', '55%', '48%', '85%'];
                                        const isLast = i === 5;
                                        return (
                                            <div key={month} className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer z-10 hover:-translate-y-2 transition-transform duration-300">
                                                {isLast && (
                                                    <div className="absolute -top-10 bg-slate-800 text-white text-xs lg:text-sm font-bold px-3 py-1.5 rounded-lg shadow-md animate-bounce">
                                                        ${totalRecaudado ? (totalRecaudado / 1000).toFixed(1) : '8.2'}k
                                                    </div>
                                                )}
                                                <div className={`w-full max-w-[4rem] rounded-t-sm transition-all duration-500 shadow-inner ${isLast ? 'bg-[#1e3a8a] group-hover:bg-blue-900 border-t-2 border-blue-400' : 'bg-slate-300 group-hover:bg-slate-400'}`} style={{ height: heights[i] }}></div>
                                                <span className={`text-xs mt-3 font-bold ${isLast ? 'text-[#1e3a8a]' : 'text-slate-400'}`}>{month.toUpperCase()}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Última Actividad Social */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <h3 className="text-lg font-bold text-slate-900">Bitácora Vecinal Reciente</h3>
                                    <span className="text-xs font-bold text-[#1e3a8a] cursor-pointer hover:underline uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100">Ir al Foro</span>
                                </div>
                                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                                    {anuncioTablon && (
                                        <div className="p-5 flex gap-4 hover:bg-slate-50 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0 border border-amber-100">
                                                <Megaphone className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-800 leading-tight">
                                                    <span className="font-bold text-slate-900 block mb-1">Aviso Actual Publicado:</span>
                                                    "{anuncioTablon.substring(0, 100)}{anuncioTablon.length > 100 ? '...' : ''}"
                                                </p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2 bg-slate-100 px-2 py-0.5 rounded-md inline-block">Anclado por la Administración</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="p-5 flex gap-4 hover:bg-slate-50 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-800"><span className="font-bold text-slate-900">Validación de Fondos:</span> Cobro a Inmueble 102 - $85.00</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2 bg-slate-100 px-2 py-0.5 rounded-md inline-block">Hace unas horas • Automático</p>
                                        </div>
                                    </div>
                                    <div className="p-5 flex gap-4 hover:bg-slate-50 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0 border border-orange-100">
                                            <Ticket className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-800"><span className="font-bold text-slate-900">Solicitud de Soporte:</span> Bombillo quemado pasillo norte.</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2 bg-slate-100 px-2 py-0.5 rounded-md inline-block">Ayer • Reporte de Vecino</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COLUMNA DERECHA (Acciones Rápidas y Tabla de Pendientes) */}
                        <div className="space-y-6">

                            {/* Acciones Rápidas */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">
                                <h3 className="text-lg font-bold text-slate-900 mb-5">Atajos Admninistrativos</h3>
                                <div className="space-y-3">
                                    <Link href="/dashboard/admin/emitir-cobro" className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-[#1e3a8a]/40 hover:bg-[#1e3a8a]/5 hover:shadow-sm transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-slate-100 text-slate-500 p-2.5 rounded-lg group-hover:bg-white group-hover:text-[#1e3a8a] group-hover:shadow-sm transition-all border border-transparent group-hover:border-blue-100">
                                                <Receipt className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 group-hover:text-[#1e3a8a]">Cuota Especial</p>
                                                <p className="text-[10px] text-slate-500">Aplicar cobro igualitario</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#1e3a8a] transform group-hover:translate-x-1 transition-all" />
                                    </Link>

                                    <Link href="/dashboard/admin/anuncios" className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-[#1e3a8a]/40 hover:bg-[#1e3a8a]/5 hover:shadow-sm transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-slate-100 text-slate-500 p-2.5 rounded-lg group-hover:bg-white group-hover:text-[#1e3a8a] group-hover:shadow-sm transition-all border border-transparent group-hover:border-blue-100">
                                                <Megaphone className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 group-hover:text-[#1e3a8a]">Postear Anuncio</p>
                                                <p className="text-[10px] text-slate-500">Difundir al tablón público</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#1e3a8a] transform group-hover:translate-x-1 transition-all" />
                                    </Link>

                                    <Link href="/dashboard/admin/finanzas" className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-[#1e3a8a]/40 hover:bg-[#1e3a8a]/5 hover:shadow-sm transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-slate-100 text-slate-500 p-2.5 rounded-lg group-hover:bg-white group-hover:text-[#1e3a8a] group-hover:shadow-sm transition-all border border-transparent group-hover:border-blue-100">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 group-hover:text-[#1e3a8a]">Informes Financieros</p>
                                                <p className="text-[10px] text-slate-500">Libro contable y ajustes de cajas</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#1e3a8a] transform group-hover:translate-x-1 transition-all" />
                                    </Link>
                                </div>
                            </div>

                            {/* Tabla en Cascada de Conciliación Pendiente */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full lg:max-h-[480px]">
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        Fila de Conciliación
                                    </h3>
                                    {totalPendientes > 0 && <span className="bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm animate-pulse">{totalPendientes} Urgentes</span>}
                                </div>

                                <div className="overflow-y-auto flex-1 p-2 custom-scrollbar relative">
                                    {totalPendientes === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                                            <span className="bg-emerald-50 text-emerald-500 p-4 rounded-full mb-3 shadow-inner">
                                                <CheckCircle2 className="w-8 h-8" />
                                            </span>
                                            <p className="text-sm font-bold text-slate-700">¡Bandeja Limpia!</p>
                                            <p className="text-[10px] text-slate-400 mt-1">No hay transferencias pendientes.</p>
                                        </div>
                                    ) : (
                                        <div className="w-full">
                                            <div className="grid grid-cols-4 gap-2 px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-10 w-full mb-1">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Inmueble</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest col-span-2 leading-none">Monto Reportado</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right leading-none">Inspección</span>
                                            </div>
                                            {pagosPendientes?.slice(0, 6).map(pago => {
                                                const inms = (pago.perfiles?.inmuebles || []).map((i: any) => i.identificador).join(', ') || 'N/A';
                                                const montoUsd = (Number(pago.monto_bs) / pago.tasa_aplicada).toFixed(2);

                                                return (
                                                    <div key={pago.id} className="grid grid-cols-4 gap-2 px-4 py-3 lg:py-4 border-b border-slate-50 items-center hover:bg-slate-50 transition-colors group">
                                                        <span className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-[#1e3a8a]">{inms}</span>
                                                        <div className="col-span-2 flex flex-col justify-center">
                                                            <span className="text-sm font-black text-slate-900">${montoUsd}</span>
                                                            <span className="text-[9px] font-medium text-slate-400">REF: {pago.referencia}</span>
                                                        </div>
                                                        <div className="text-right flex justify-end">
                                                            <Link scroll={false} href={`/dashboard/admin?ver_pago=${pago.id}`} className="inline-flex p-2 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-[#1e3a8a] group-hover:text-white transition-colors shadow-sm border border-slate-200 group-hover:border-[#1e3a8a]">
                                                                <Eye className="w-4 h-4" />
                                                            </Link>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                            {totalPendientes > 6 && (
                                                <div className="p-4 bg-slate-50/50 mt-1 rounded-b-xl flex justify-center">
                                                    <a href="#" className="bg-white border text-center w-full border-slate-200 text-xs font-bold text-[#1e3a8a] rounded-lg py-2 hover:bg-slate-50 transition-colors shadow-sm">
                                                        Cargar Restantes ({totalPendientes - 6})
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>



            {/* ========================================================= */}
            {/* VISTA MOBILE (Mantenida como Fallback Responsive)           */}
            {/* ========================================================= */}
            <div className="md:hidden relative pb-24 min-h-screen bg-slate-50">
                <header className="px-5 py-4 flex items-center justify-between border-b border-slate-200 bg-white sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-bold text-[#1e3a8a]">Recepción de Pagos</h1>
                    </div>
                    <NotificacionesWidget count={unreadAdminCount || 0} href="/dashboard/admin/notificaciones" theme="light" />
                </header>

                <div className="px-5 space-y-4 pt-4">
                    {successMsg && (
                        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 text-sm font-medium flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                            <span>✅ Recibos generados y asignados exitosamente de acuerdo a las alícuotas.</span>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <div className="flex-1 bg-white shadow-sm border border-slate-200 p-4 rounded-xl">
                            <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">TOTAL BS. POR CONCILIAR</p>
                            <p className="text-xl font-bold text-[#1e3a8a] mb-2">{montoTotalBs.toLocaleString('es-VE')} Bs</p>
                        </div>
                        <div className="flex-1 bg-blue-50 border border-blue-100 p-4 rounded-xl">
                            <p className="text-[10px] font-bold text-blue-600 tracking-widest uppercase mb-1">COMPROBANTES</p>
                            <div className="flex items-center gap-2 mb-2">
                                <p className="text-3xl font-bold text-[#1e3a8a]">{totalPendientes}</p>
                                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">EN ESPERA</span>
                            </div>
                        </div>
                    </div>

                    <Link href="/dashboard/admin/tickets" className="flex items-center justify-between bg-orange-50 border border-orange-200 p-4 rounded-xl mt-4 hover:bg-orange-100 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="bg-orange-500 text-white p-2.5 rounded-xl shadow-sm">
                                <Ticket className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 tracking-tight">Centro de Soporte</p>
                                <p className="text-xs text-slate-500">Gestiona los reclamos de los residentes</p>
                            </div>
                        </div>
                    </Link>

                    <Link href="/dashboard/admin/anuncios" className="flex items-center justify-between bg-amber-50 border border-amber-200 p-4 rounded-xl mt-4 hover:bg-amber-100 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="bg-amber-500 text-white p-2.5 rounded-xl shadow-sm">
                                <Megaphone className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 tracking-tight">Cartelera de Anuncios</p>
                                <p className="text-xs text-slate-500">Publica noticias en el muro vecinal</p>
                            </div>
                        </div>
                    </Link>

                    <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm cursor-pointer">
                        <div className="flex items-center gap-3">
                            <Building className="w-5 h-5 text-slate-400" />
                            <span className="text-sm font-medium text-slate-800">Todas las Unidades Habitacionales</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-6 mb-2">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        <h3 className="text-xs font-bold text-slate-500 tracking-widest uppercase">RECIBOS RECIENTES</h3>
                    </div>
                    <h3 className="text-slate-800 font-bold mb-2 pt-2 px-1">Recibos Recientes</h3>

                    <div className="grid grid-cols-1 gap-4">
                        {(!pagosPendientes || pagosPendientes.length === 0) ? (
                            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                    <Check className="w-8 h-8" />
                                </div>
                                <h3 className="text-slate-800 font-bold mb-1">¡Todo al día!</h3>
                                <p className="text-slate-500 text-sm max-w-[200px]">No hay reportes de pago pendientes por conciliar.</p>
                            </div>
                        ) : (
                            pagosPendientes?.map((pago) => {
                                const nombrePropietario = `${pago.perfiles?.nombres || ''} ${pago.perfiles?.apellidos || ''}`.trim() || 'Residente Desconocido';
                                let inms = 'Sin Inmueble';
                                if (pago.perfiles?.inmuebles && Array.isArray(pago.perfiles.inmuebles) && pago.perfiles.inmuebles.length > 0) {
                                    inms = pago.perfiles.inmuebles.map((i: any) => i.identificador).join(', ');
                                }

                                return (
                                    <div key={pago.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-bold text-slate-900">{nombrePropietario}</h4>
                                                <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
                                                    <Building className="w-3 h-3" />
                                                    <span className="line-clamp-1 break-all">{inms}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded text-[10px] tracking-wider block mb-1">
                                                    REF: #{pago.referencia}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    {format(new Date(pago.fecha_pago), "d MMM yyyy", { locale: es })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end mb-4 border-t border-slate-50 pt-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-1">MONTO REPORTADO</p>
                                                <p className="text-xl font-bold text-[#1e3a8a]">{Number(pago.monto_bs).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</p>
                                                <p className="text-xs text-slate-400 mt-1">Tasa: {pago.tasa_aplicada} Bs/$</p>
                                            </div>
                                            <CaptureViewer url={pago.capture_url} referencia={pago.referencia} />
                                        </div>

                                        <div className="flex gap-3">
                                            <form className="flex-1" action={async () => {
                                                "use server"
                                                const { rechazarPagoAction } = await import('./actions')
                                                await rechazarPagoAction(pago.id)
                                            }}>
                                                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-500 rounded-xl py-2.5 font-semibold text-sm transition-all focus:outline-none focus:ring-4 focus:ring-red-100">
                                                    <X className="w-4 h-4" /> Rechazar
                                                </button>
                                            </form>
                                            <form className="flex-1" action={async () => {
                                                "use server"
                                                const { aprobarPagoAction } = await import('./actions')
                                                await aprobarPagoAction(pago.id)
                                            }}>
                                                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-[#1e3a8a] border border-[#1e3a8a] text-white hover:bg-blue-900 rounded-xl py-2.5 font-semibold text-sm transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-200">
                                                    <Check className="w-4 h-4" /> Aprobar
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Floating Action Button (Mobile Only) */}
                <Link
                    href="/dashboard/admin/emitir-cobro"
                    className="fixed bottom-24 right-5 bg-[#1e3a8a] text-white p-4 rounded-full shadow-lg z-50 flex items-center gap-2 hover:bg-blue-900 transition-all hover:scale-105"
                >
                    <Plus className="w-6 h-6" />
                </Link>
            </div>
        </>
    )
}
