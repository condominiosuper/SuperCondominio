import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Ticket, Plus, MessageSquare, Clock, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function TicketsPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const perfilId = cookieStore.get('propietario_token')?.value

    if (!perfilId) {
        return (
            <div className="p-5 text-center text-slate-500">
                Sesión no válida o expirada. <Link href="/login" className="text-blue-600 underline">Ir al Login</Link>
            </div>
        )
    }

    // Obtener mis tickets
    const { data: tickets, error } = await supabase
        .from('tickets_soporte')
        .select('*')
        .eq('autor_id', perfilId)
        .order('created_at', { ascending: false })

    const resolvedParams = await searchParams
    const successMsg = resolvedParams?.success === 'ticket_creado'

    return (
        <div className="bg-slate-50 min-h-screen pb-32">
            {/* Header Rediseñado */}
            <div className="bg-[#1e3a8a] text-white px-6 pt-12 pb-6 rounded-b-3xl shadow-md sticky top-0 z-40">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Mis Tickets</h1>
                        <p className="text-blue-100/80 text-sm mt-1">Soporte y atención vecinal</p>
                    </div>
                </div>
            </div>

            <div className="px-5 mt-6 space-y-4">
                {successMsg && (
                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 text-sm font-medium flex items-center justify-between mb-4 animate-in fade-in slide-in-from-top-2">
                        <span>✅ Tu ticket ha sido enviado. Te notificaremos cuando el administrador responda.</span>
                    </div>
                )}

                {(!tickets || tickets.length === 0) ? (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                            <Ticket className="w-8 h-8" />
                        </div>
                        <h3 className="text-slate-800 font-bold mb-2">Sin tickets abiertos</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Aquí aparecerán los reclamos o solicitudes que envíes a la administración.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {tickets.map((ticket) => {
                            let icon = <Clock className="w-4 h-4" />;
                            let colorClass = "bg-orange-100 text-orange-600 border-orange-200";
                            let label = "ABIERTO";

                            if (ticket.estado === 'resuelto') {
                                icon = <CheckCircle className="w-4 h-4" />;
                                colorClass = "bg-emerald-100 text-emerald-700 border-emerald-200";
                                label = "RESUELTO";
                            } else if (ticket.estado === 'en_proceso') {
                                icon = <MessageSquare className="w-4 h-4" />;
                                colorClass = "bg-blue-100 text-blue-700 border-blue-200";
                                label = "EN PROCESO";
                            }

                            return (
                                <div key={ticket.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-slate-800 line-clamp-1 flex-1 pr-4">{ticket.asunto}</h3>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded border flex items-center gap-1 shrink-0 ${colorClass}`}>
                                            {icon} {label}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                                        {ticket.descripcion}
                                    </p>

                                    {ticket.respuesta_admin && (
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 text-sm text-slate-600">
                                            <div className="font-semibold text-slate-800 text-xs mb-1 flex items-center gap-1">
                                                <MessageSquare className="w-3 h-3 text-[#1e3a8a]" /> Respuesta de Admin:
                                            </div>
                                            {ticket.respuesta_admin}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center text-xs text-slate-400">
                                        <span>{format(new Date(ticket.created_at), "d MMM yyyy, h:mm a", { locale: es })}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Nuevo Ticket FAB */}
            <Link
                href="/dashboard/propietario/tickets/nuevo"
                className="fixed bottom-[85px] md:bottom-10 right-5 md:right-10 p-4 bg-[#1e3a8a] text-white rounded-full shadow-lg z-50 flex items-center gap-2 hover:bg-blue-900 transition-all hover:scale-105"
            >
                <Plus className="w-6 h-6" />
                <span className="font-bold pr-2 hidden md:block">Nuevo Ticket</span>
            </Link>
        </div>
    )
}
