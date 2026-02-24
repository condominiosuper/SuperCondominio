import { CheckCircle2, FileText, Download, Banknote, ChevronRight, Megaphone, Pin } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import NotificacionesWidget from '@/components/NotificacionesWidget'

export default async function PropietarioDashboardPage() {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const perfilId = cookieStore.get('propietario_token')?.value

    if (!perfilId) {
        redirect('/dashboard/propietario/validar')
    }

    // Cargar datos reales básicos del propietario
    const { data: perfil } = await supabase
        .from('perfiles')
        .select('nombres, estado_solvencia, condominio_id, condominios(nombre)')
        .eq('id', perfilId)
        .single()

    if (!perfil) {
        redirect('/dashboard/propietario/validar')
    }

    const condominioInfo = perfil.condominios as any
    const nombreCondominio = condominioInfo?.nombre || 'Mi Condominio'

    // Cargar Feed de Anuncios
    const { data: anuncios } = await supabase
        .from('cartelera_anuncios')
        .select('id, titulo, contenido, categoria, fijado, created_at')
        .eq('condominio_id', perfil.condominio_id)
        .order('fijado', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10) // Mostrar últimos 10

    const categoryColors: Record<string, string> = {
        'Urgente': 'bg-red-100 text-red-700 border-red-200',
        'Mantenimiento': 'bg-orange-100 text-orange-700 border-orange-200',
        'Finanzas': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Normativa': 'bg-blue-100 text-blue-700 border-blue-200',
        'Eventos': 'bg-purple-100 text-purple-700 border-purple-200',
        'General': 'bg-slate-100 text-slate-700 border-slate-200',
    }

    // Contar notificaciones no leídas
    const { count: unreadCount } = await supabase
        .from('notificaciones')
        .select('*', { count: 'exact', head: true })
        .eq('condominio_id', perfil.condominio_id)
        .eq('perfil_id', perfilId)
        .eq('leida', false)

    // Obtener Tasa BCV Oficial para mostrarla en el Dashboard
    let tasaBcv = null;
    try {
        const resBcv = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', { next: { revalidate: 3600 } })
        if (resBcv.ok) {
            const dataBcv = await resBcv.json()
            tasaBcv = dataBcv.promedio
        }
    } catch (e) { console.error("Error obteniendo BCV general") }

    return (
        <div className="relative">
            {/* Bondo Azul Curvo */}
            <div className="bg-[#1e3a8a] text-white pt-10 pb-24 px-6 rounded-b-[40px] relative z-0">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                            <UserIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-blue-100 font-medium">¡Hola, {perfil.nombres}! 👋</p>
                            <h1 className="text-xl font-bold tracking-tight">{nombreCondominio}</h1>
                        </div>
                    </div>
                    <NotificacionesWidget count={unreadCount || 0} href="/dashboard/propietario/notificaciones" theme="dark" />
                </div>

                {perfil.estado_solvencia ? (
                    <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/50 text-emerald-50 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider">
                        <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white" />
                        ESTADO: SOLVENTE
                    </div>
                ) : (
                    <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/50 text-red-50 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        ESTADO: MOROSO
                    </div>
                )}
            </div>

            {/* Contenido Principal Sobrepuesto */}
            <div className="px-5 -mt-16 relative z-10 space-y-4">

                {/* Resumen Financiero Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h2 className="text-xs font-bold text-slate-500 tracking-widest mb-4">RESUMEN FINANCIERO</h2>

                    <div className="flex justify-between items-start mb-6">
                        <div className="flex-1">
                            <p className="text-[10px] text-slate-400 font-medium mb-1">SALDO PENDIENTE (USD)</p>
                            <p className="text-3xl font-bold text-[#1e3a8a]">$0.00</p>
                        </div>
                        <div className="w-px h-12 bg-slate-100 mx-4 self-center"></div>
                        <div className="flex-1">
                            <p className="text-[10px] text-slate-400 font-medium mb-1">SALDO PENDIENTE (BS)</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">Bs. 0,00</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                        {tasaBcv ? (
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                Tasa BCV Hoy: <span className="font-bold text-[#1e3a8a]">Bs. {tasaBcv.toFixed(2)}</span>
                            </p>
                        ) : (
                            <p className="text-xs text-slate-400 font-medium">Tasa BCV no disponible</p>
                        )}
                        <Link href="/dashboard/propietario/pagos/nuevo" className="text-xs font-bold text-[#1e3a8a] flex items-center gap-1 hover:underline">
                            Ver Recibos <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>

                {/* Action Button: Reportar Pago */}
                <button className="w-full bg-[#1e3a8a] hover:bg-blue-900 text-white rounded-xl py-4 px-6 flex items-center justify-center gap-3 font-semibold shadow-sm transition-colors">
                    <Banknote className="w-6 h-6" />
                    Reportar Pago Móvil
                </button>

                {/* Carta de Residencia Card */}
                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-100 p-3 rounded-lg">
                            <FileText className="w-6 h-6 text-[#1e3a8a]" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm">Carta de Residencia</h3>
                            <p className="text-xs text-slate-500">Descargar documento PDF</p>
                        </div>
                    </div>
                    <button className="p-2 text-slate-400 hover:text-[#1e3a8a] transition-colors rounded-full hover:bg-slate-50">
                        <Download className="w-5 h-5" />
                    </button>
                </div>

                {/* Cartelera Virtual (Lista de Anuncios) */}
                <div id="muro-vecinal" className="pt-2 scroll-mt-24">
                    <div className="flex justify-between items-end mb-3 px-1">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Megaphone className="w-5 h-5 text-blue-600" />
                            Muro Vecinal
                        </h3>
                    </div>

                    <div className="space-y-4">
                        {anuncios?.length === 0 ? (
                            <div className="text-center py-8 bg-white rounded-2xl border border-slate-200 border-dashed">
                                <p className="text-slate-500 text-sm font-medium">No hay noticias recientes.</p>
                            </div>
                        ) : (
                            anuncios?.map((anuncio: any) => (
                                <div key={anuncio.id} className={`bg-white rounded-2xl p-6 shadow-sm relative overflow-hidden transition-all ${anuncio.fijado ? 'border-2 border-amber-300 ring-2 ring-amber-50' : 'border border-slate-100'}`}>
                                    {anuncio.fijado && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500"></div>
                                    )}
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex flex-col gap-3 items-start w-full">
                                            <div className="flex items-center gap-2 w-full justify-between">
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold border tracking-wider ${categoryColors[anuncio.categoria] || categoryColors['General']}`}>
                                                    {anuncio.categoria}
                                                </span>
                                                {anuncio.fijado && <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />}
                                            </div>
                                            <h3 className="font-bold text-slate-900 text-lg leading-tight">{anuncio.titulo}</h3>
                                        </div>
                                    </div>

                                    <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap mb-5">
                                        {anuncio.contenido}
                                    </p>

                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest border-t border-slate-100 pt-4">
                                        {format(new Date(anuncio.created_at), "d 'de' MMMM, h:mm a", { locale: es })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}

function UserIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
        </svg>
    )
}
