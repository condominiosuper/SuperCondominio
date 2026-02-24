'use client'

import { useState } from 'react'
import { Save, CalendarDays, DollarSign, Settings2, HelpCircle } from 'lucide-react'
import { guardarParametrosFinancierosAction } from './actions'

interface Props {
    montoMensualInicial: number
    diaCobroInicial: number
}

export default function ParametrosFinancierosCard({ montoMensualInicial, diaCobroInicial }: Props) {
    const [monto, setMonto] = useState<number>(montoMensualInicial || 0)
    const [dia, setDia] = useState<number>(diaCobroInicial || 1)

    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSave() {
        if (monto < 0 || dia < 1 || dia > 31) {
            setError('Verifica los valores ingresados. (Monto > 0, Día del 1 al 31)')
            return
        }

        setLoading(true)
        setError(null)
        setSuccess(false)

        const res = await guardarParametrosFinancierosAction(monto, dia)
        if (res?.error) {
            setError(res.error)
        } else {
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        }
        setLoading(false)
    }

    return (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
            {/* Cabecera */}
            <div className="flex justify-between items-start mb-5 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <Settings2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 tracking-tight">Reglas de Cobranza</h3>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Parámetros Globales</p>
                    </div>
                </div>
            </div>

            {/* Formulario */}
            <div className="space-y-4 relative z-10">
                {/* Monto Mensual Base */}
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                            Cuota Fija Mensual (USD)
                        </label>
                        <div className="group relative cursor-help">
                            <HelpCircle className="w-4 h-4 text-slate-300 hover:text-[#1e3a8a] transition-colors" />
                            <div className="absolute opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all bottom-full right-0 mb-2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded-lg shadow-xl text-center z-20">
                                Es la cuota común estandarizada en Dólares. Se multiplicará por la alícuota de cada vecino.
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={monto}
                            onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
                            className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-4 py-2.5 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            placeholder="Ej: 50.00"
                        />
                    </div>
                </div>

                {/* Día de Corte */}
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1">
                            <CalendarDays className="w-4 h-4 text-slate-400" />
                            Día del Mes para Cobro
                        </label>
                        <div className="group relative cursor-help">
                            <HelpCircle className="w-4 h-4 text-slate-300 hover:text-[#1e3a8a] transition-colors" />
                            <div className="absolute opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all bottom-full right-0 mb-2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded-lg shadow-xl text-center z-20">
                                Día estándar sugerido para pagar la mensualidad. Debe ser un número del 1 al 31.
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 selection-dia">
                        <div className="relative w-full">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-slate-400 text-sm">Día</span>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                value={dia}
                                onChange={(e) => setDia(parseInt(e.target.value) || 1)}
                                className="w-full bg-white border border-slate-200 rounded-lg pl-12 pr-4 py-2.5 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                placeholder="Ej: 5"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer de Acciones */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex-1">
                    {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
                    {success && <p className="text-xs text-emerald-600 font-bold border border-emerald-200 bg-emerald-50 px-2 py-1 inline-block rounded-md">¡Parámetros Guardados!</p>}
                </div>

                <button
                    onClick={handleSave}
                    disabled={loading || (monto === montoMensualInicial && dia === diaCobroInicial)}
                    className="flex items-center gap-2 bg-[#1e3a8a] border border-[#1e3a8a] hover:bg-blue-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Aplicando...' : 'Aplicar Cambios'}
                    <Save className="w-4 h-4" />
                </button>
            </div>

            <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                <Settings2 className="w-32 h-32" />
            </div>
        </div>
    )
}
