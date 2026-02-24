'use client'

import { useState } from 'react'
import { ArrowLeft, Send, MessageSquare, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { crearTicketAction } from './actions'
import { useFormStatus } from 'react-dom'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full mt-6 flex items-center justify-center gap-2 bg-[#1e3a8a] text-white py-4 rounded-xl font-bold shadow-md hover:bg-blue-900 transition-colors disabled:opacity-50"
        >
            <Send className="w-5 h-5" />
            {pending ? 'Enviando Reclamo...' : 'Enviar Ticket a Administración'}
        </button>
    )
}

export default function NuevoTicketPage() {
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setError(null)
        const res = await crearTicketAction(formData)
        if (res?.error) {
            setError(res.error)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="px-5 py-4 flex items-center justify-between border-b border-slate-200 bg-white sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/propietario/tickets" className="p-2 border border-slate-200 rounded-full text-slate-500 hover:bg-slate-50 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-lg font-bold text-[#1e3a8a]">Nuevo Ticket</h1>
                </div>
            </header>

            <div className="px-5 pt-6 max-w-lg mx-auto">
                <div className="bg-white border text-center border-slate-200 p-6 rounded-2xl shadow-sm mb-6">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Soporte y Reclamos</h2>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                        Explica detalladamente la incidencia, duda o solicitud. Tu administrador será notificado y responderá a la brevedad posible.
                    </p>
                </div>

                <form action={handleSubmit} className="space-y-4">
                    {/* Asunto */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative focus-within:ring-2 focus-within:ring-[#1e3a8a]/20 focus-within:border-[#1e3a8a] transition-all">
                        <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-1">ASUNTO DEL TICKET</label>
                        <input
                            type="text"
                            name="asunto"
                            required
                            minLength={5}
                            maxLength={100}
                            className="w-full text-base font-semibold text-slate-800 bg-transparent outline-none placeholder:font-normal placeholder:text-slate-300"
                            placeholder="Ej: Filtración de agua en mi techo"
                        />
                    </div>

                    {/* Descripción */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative focus-within:ring-2 focus-within:ring-[#1e3a8a]/20 focus-within:border-[#1e3a8a] transition-all">
                        <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-1">DESCRIPCIÓN DETALLADA</label>
                        <textarea
                            name="descripcion"
                            required
                            minLength={10}
                            rows={5}
                            className="w-full text-sm font-medium text-slate-700 bg-transparent outline-none resize-none pt-2"
                            placeholder="Describe con la mayor cantidad de detalles lo que ocurre..."
                        />
                    </div>

                    {/* Error display */}
                    {error && (
                        <div className="flex items-start gap-2 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mt-4 text-sm font-medium animate-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <SubmitButton />
                </form>
            </div>
        </div>
    )
}
