'use client'

import { useState } from 'react'
import { responderTicketAction } from './actions'
import { Send, CheckCircle, MessageSquare, Clock, User } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface TicketCardProps {
    ticket: any;
}

export default function AdminTicketCard({ ticket }: TicketCardProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [resuelto, setResuelto] = useState(ticket.estado === 'resuelto')

    const nombrePropietario = `${ticket.perfiles?.nombres || ''} ${ticket.perfiles?.apellidos || ''}`.trim() || 'Residente'

    let inms = 'Sin Inmueble';
    if (ticket.perfiles?.inmuebles && Array.isArray(ticket.perfiles.inmuebles) && ticket.perfiles.inmuebles.length > 0) {
        inms = ticket.perfiles.inmuebles.map((i: any) => i.identificador).join(', ');
    }

    async function handleResponder(formData: FormData) {
        setLoading(true)
        setError(null)
        formData.append('ticket_id', ticket.id)

        const res = await responderTicketAction(formData)
        if (res?.error) {
            setError(res.error)
            setLoading(false)
        } else {
            setResuelto(true)
            setLoading(false)
        }
    }

    if (resuelto) {
        return (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5 shadow-sm opacity-60">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-emerald-900 line-clamp-1 flex-1 pr-4">{ticket.asunto}</h3>
                    <span className="text-[10px] font-bold px-2 py-1 rounded border flex items-center gap-1 shrink-0 bg-emerald-100 text-emerald-700 border-emerald-200">
                        <CheckCircle className="w-4 h-4" /> RESUELTO
                    </span>
                </div>
                <p className="text-sm text-emerald-700 font-medium line-clamp-1 mb-2">De: {nombrePropietario} ({inms})</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-slate-800 line-clamp-1 flex-1 pr-4">{ticket.asunto}</h3>
                <span className="text-[10px] font-bold px-2 py-1 rounded border flex items-center gap-1 shrink-0 bg-orange-100 text-orange-600 border-orange-200">
                    <Clock className="w-4 h-4" /> PENDIENTE
                </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 bg-slate-50 p-2 rounded-lg">
                <User className="w-3 h-3" />
                <span className="font-semibold">{nombrePropietario}</span>
                <span className="text-slate-300">•</span>
                <span>{inms}</span>
                <span className="text-slate-300">•</span>
                <span>{format(new Date(ticket.created_at), "d MMM", { locale: es })}</span>
            </div>

            <p className="text-sm text-slate-600 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                {ticket.descripcion}
            </p>

            <form action={handleResponder} className="space-y-3">
                <textarea
                    name="respuesta"
                    required
                    minLength={5}
                    rows={2}
                    placeholder="Escribe la respuesta al residente aquí..."
                    className="w-full text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl p-3 outline-none resize-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] transition-all"
                />

                {error && <p className="text-xs text-red-500 font-medium px-1">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-[#1e3a8a] border border-[#1e3a8a] text-white hover:bg-blue-900 rounded-xl py-2.5 font-semibold text-sm transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50"
                >
                    <Send className="w-4 h-4" />
                    {loading ? 'Enviando...' : 'Responder y Marcar Resuleto'}
                </button>
            </form>
        </div>
    )
}
