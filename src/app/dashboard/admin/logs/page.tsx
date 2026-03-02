import { createClient } from '@/utils/supabase/server'
import { getAdminProfile } from '@/utils/supabase/admin-helper'
import { History, Info, User } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function AdminLogsPage() {
    const { user, profile: adminPerfil } = await getAdminProfile()
    const supabase = await createClient()

    if (!user || !adminPerfil) {
        return <div className="p-5 text-red-500">Error: No autorizado.</div>
    }

    // 1. Obtener Historial (Pagos Verificados/Rechazados por ahora)
    const { data: pagos } = await supabase
        .from('pagos_reportados')
        .select(`
            id,
            monto_bs,
            monto_equivalente_usd,
            estado,
            referencia,
            updated_at,
            perfil:perfil_id (
                nombres, 
                apellidos,
                inmuebles (identificador)
            )
        `)
        .eq('condominio_id', adminPerfil.condominio_id)
        .in('estado', ['verificado', 'rechazado'])
        .order('updated_at', { ascending: false })
        .limit(100)

    // 2. Obtener Bitácora (filtrado vinculando el perfil con el condominio)
    const { data: logsData, error } = await supabase
        .from('logs_sistema')
        .select('*, perfiles!inner(nombres, apellidos, condominio_id)')
        .eq('perfiles.condominio_id', adminPerfil.condominio_id)
        .order('created_at', { ascending: false })
        .limit(100)

    // Mapear pagos al formato de bitácora
    const pagosMapped = (pagos || []).map(pago => {
        const esVerificado = pago.estado === 'verificado'
        const perfilObj: any = Array.isArray(pago.perfil) ? pago.perfil[0] : pago.perfil
        const inmueblesArr = perfilObj?.inmuebles || []
        const inmuebleMuestra = Array.isArray(inmueblesArr) && inmueblesArr.length > 0
            ? inmueblesArr[0].identificador
            : 'No vinculado'

        return {
            id: pago.id,
            evento: esVerificado ? 'Pago Verificado' : 'Pago Anulado',
            detalles: `Cobro reportado procesado por ${pago.monto_bs} Bs. (Ref: ${pago.referencia || 'N/A'}) - Inmueble: ${inmuebleMuestra}.`,
            created_at: pago.updated_at,
            perfil: perfilObj
        }
    })

    const sistemLogsMapped = (logsData || []).map(log => ({
        id: log.id,
        evento: log.evento,
        detalles: typeof log.detalles === 'string' ? log.detalles : JSON.stringify(log.detalles),
        created_at: log.created_at,
        perfil: log.perfiles
    }))

    // Combinar y ordenar ambos historiales por fecha descendente
    const logs = [...pagosMapped, ...sistemLogsMapped].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return (
        <div className="p-6 md:p-10 space-y-8 pb-24 md:pb-10">
            <header>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-[#1e3a8a]/10 text-[#1e3a8a] rounded-xl flex items-center justify-center">
                        <History className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase italic">Historial de Sistema</h1>
                </div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] pl-1">
                    Auditoría de movimientos y ediciones del condominio
                </p>
            </header>

            <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Evento</th>
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalles</th>
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Usuario</th>
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs && logs.length > 0 ? (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-5 align-top">
                                            <div className="flex items-start gap-3 mt-1">
                                                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${log.evento.includes('Elimin') || log.evento.includes('Error') ? 'bg-red-500' :
                                                    log.evento.includes('Pag') ? 'bg-emerald-500' : 'bg-blue-500'
                                                    }`} />
                                                <span className="font-bold text-slate-700 text-sm">{log.evento}</span>
                                            </div>
                                        </td>
                                        <td className="p-5 align-top">
                                            <p className="text-slate-500 text-xs leading-relaxed max-w-sm lg:max-w-md">
                                                {typeof log.detalles === 'string' ? log.detalles : JSON.stringify(log.detalles)}
                                            </p>
                                        </td>
                                        <td className="p-5 text-center align-top">
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full">
                                                <User className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                                                    {log.perfil ? `${log.perfil.nombres} ${log.perfil.apellidos}` : 'Sistema / Admin'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-right align-top">
                                            <div className="flex flex-col items-end">
                                                <span className="text-slate-700 font-bold text-xs">
                                                    {format(new Date(log.created_at), "dd 'de' MMMM", { locale: es })}
                                                </span>
                                                <span className="text-slate-400 text-[10px] font-black uppercase tracking-tighter mt-0.5">
                                                    {format(new Date(log.created_at), "HH:mm 'hrs'")}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-20 text-center">
                                        <div className="flex flex-col items-center text-slate-400">
                                            <Info className="w-12 h-12 mb-4 opacity-20" />
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">No hay movimientos recientes</p>
                                            <p className="text-xs text-slate-400 font-medium mt-1 max-w-xs mx-auto">
                                                Las acciones de los propietarios y administradores aparecerán en esta bitácora.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <History className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-red-800 font-bold text-sm leading-tight">Error de consulta</p>
                        <p className="text-red-600/80 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                            {error.message}
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
