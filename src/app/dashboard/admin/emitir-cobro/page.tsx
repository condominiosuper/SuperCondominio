'use client'

import { useState } from 'react'
import { ArrowLeft, Send, CalendarDays, DollarSign, Calendar, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { emitirCobroMasivoAction } from './actions'
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
            {pending ? 'Procesando Cuotas Especiales...' : 'Emitir Cuota Especial Masiva'}
        </button>
    )
}

export default function EmitirCobroPage() {
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setError(null)
        // Client side validation
        const emision = new Date(formData.get('fecha_emision') as string)
        const vencimiento = new Date(formData.get('fecha_vencimiento') as string)
        if (vencimiento < emision) {
            setError('La fecha de vencimiento no puede ser anterior a la de emisión.')
            return
        }

        const res = await emitirCobroMasivoAction(formData)
        if (res?.error) {
            setError(res.error)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="px-5 py-4 flex items-center justify-between border-b border-slate-200 bg-white sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/admin" className="p-2 border border-slate-200 rounded-full text-slate-500 hover:bg-slate-50 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-lg font-bold text-[#1e3a8a]">Generar Cuota Especial</h1>
                </div>
            </header>

            <div className="px-5 pt-6 max-w-lg mx-auto">
                <div className="bg-white border text-center border-slate-200 p-6 rounded-2xl shadow-sm mb-6">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Emisión de Cuota Especial</h2>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                        Ingresa el monto exacto que se le cobrará a cada uno de los residentes. El sistema generará una deuda por esta misma cantidad a todos los inmuebles de la torre de manera equitativa, sin tomar en cuenta su porcentaje de alícuota.
                    </p>
                </div>

                <form action={handleSubmit} className="space-y-4">
                    {/* Mes de Cobro */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative focus-within:ring-2 focus-within:ring-[#1e3a8a]/20 focus-within:border-[#1e3a8a] transition-all">
                        <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-1">TÍTULO DE LA CUOTA</label>
                        <div className="flex items-center gap-3">
                            <CalendarDays className="w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                name="mes"
                                required
                                className="w-full text-lg font-semibold text-slate-800 bg-transparent outline-none placeholder:font-normal placeholder:text-slate-300"
                                placeholder="Ej: Marzo 2026"
                            />
                        </div>
                    </div>

                    {/* Monto Total */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative focus-within:ring-2 focus-within:ring-[#1e3a8a]/20 focus-within:border-[#1e3a8a] transition-all">
                        <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-1">CUOTA A COBRAR POR INMUEBLE (USD)</label>
                        <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-slate-300">$</span>
                            <input
                                type="number"
                                name="monto_total_usd"
                                step="0.01"
                                min="1"
                                required
                                className="w-full text-2xl font-bold text-[#1e3a8a] bg-transparent outline-none placeholder:text-slate-200"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Fechas Flex */}
                    <div className="flex gap-4">
                        <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-[#1e3a8a]/20 focus-within:border-[#1e3a8a] transition-all">
                            <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-1">FECHA EMISIÓN</label>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <input
                                    type="date"
                                    name="fecha_emision"
                                    required
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                    className="w-full text-sm font-medium text-slate-700 bg-transparent outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-[#1e3a8a]/20 focus-within:border-[#1e3a8a] transition-all">
                            <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-1">VENCIMIENTO</label>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <input
                                    type="date"
                                    name="fecha_vencimiento"
                                    required
                                    className="w-full text-sm font-medium text-slate-700 bg-transparent outline-none"
                                />
                            </div>
                        </div>
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
