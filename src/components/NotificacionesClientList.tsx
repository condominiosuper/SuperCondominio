'use client'

import { useState } from 'react'
import { Check, Trash2, ExternalLink, BellDot } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { marcarNotificacionLeidaAction, eliminarNotificacionAction, marcarTodasLeidasAction } from '@/app/dashboard/notificaciones/actions'
import Link from 'next/link'

export default function NotificacionesClientList({
    initialNotificaciones,
    condominioId,
    perfilId = null
}: {
    initialNotificaciones: any[],
    condominioId: string,
    perfilId?: string | null
}) {
    const [notificaciones, setNotificaciones] = useState(initialNotificaciones)
    const [isLoading, setIsLoading] = useState(false)

    // Handlers
    const handleMarcarLeida = async (id: string) => {
        setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
        await marcarNotificacionLeidaAction(id)
    }

    const handleEliminar = async (id: string) => {
        setNotificaciones(prev => prev.filter(n => n.id !== id))
        await eliminarNotificacionAction(id)
    }

    const handleMarcarTodas = async () => {
        setIsLoading(true)
        setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
        await marcarTodasLeidasAction(condominioId, perfilId)
        setIsLoading(false)
    }

    const unreadCount = notificaciones.filter(n => !n.leida).length

    if (notificaciones.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                    <BellDot className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-700">No hay notificaciones</h3>
                <p className="text-slate-500 mt-2 text-sm max-w-sm">Estás al día. Aquí aparecerán mensajes sobre tus recibos, pagos aprobados y noticias vecinales.</p>
            </div>
        )
    }

    return (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-slate-900">Bandeja de Entrada</h2>
                    {unreadCount > 0 && (
                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full border border-red-200">
                            {unreadCount} nuevas
                        </span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarcarTodas}
                        disabled={isLoading}
                        className="text-xs font-bold text-[#1e3a8a] bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                        Marcar todas leídas
                    </button>
                )}
            </div>

            <div className="divide-y divide-slate-100">
                {notificaciones.map((notif: any) => (
                    <div key={notif.id} className={`p-4 md:p-6 transition-colors flex flex-col md:flex-row gap-4 justify-between items-start ${!notif.leida ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                {!notif.leida && <span className="w-2 h-2 rounded-full bg-[#1e3a8a] flex-shrink-0 animate-pulse"></span>}
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    {notif.tipo.replace('_', ' ')}
                                </span>
                                <span className="text-slate-300 text-xs">•</span>
                                <span className="text-xs text-slate-500 font-medium">
                                    {format(new Date(notif.created_at), "d 'de' MMMM, h:mm a", { locale: es })}
                                </span>
                            </div>
                            <h3 className={`text-base font-bold mb-1 ${!notif.leida ? 'text-slate-900' : 'text-slate-700'}`}>
                                {notif.titulo}
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                                {notif.mensaje}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 md:mt-0 mt-3 self-end md:self-auto w-full md:w-auto justify-end">
                            {notif.enlace && (
                                <Link href={notif.enlace} className="p-2 text-slate-400 hover:text-[#1e3a8a] bg-white border border-slate-200 rounded-lg hover:border-blue-200 transition-colors shadow-sm" title="Ir al origen">
                                    <ExternalLink className="w-4 h-4" />
                                </Link>
                            )}
                            {!notif.leida && (
                                <button onClick={() => handleMarcarLeida(notif.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 bg-white border border-slate-200 rounded-lg hover:border-emerald-200 transition-colors shadow-sm" title="Marcar leída">
                                    <Check className="w-4 h-4" />
                                </button>
                            )}
                            <button onClick={() => handleEliminar(notif.id)} className="p-2 text-red-500 hover:bg-red-50 bg-white border border-slate-200 rounded-lg hover:border-red-200 transition-colors shadow-sm" title="Eliminar alerta">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
