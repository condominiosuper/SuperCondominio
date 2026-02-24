'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, RefreshCw, AlertCircle } from 'lucide-react'

interface BcvData {
    moneda: string;
    nombre: string;
    promedio: number;
    fechaActualizacion: string;
}

export default function TasaBcvWidget() {
    const [data, setData] = useState<BcvData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    async function fetchTasa() {
        setLoading(true)
        setError(false)
        try {
            const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
                next: { revalidate: 3600 } // Cachear por 1 hora en Next.js
            })
            if (!res.ok) throw new Error('Error en API')

            const json = await res.json()
            setData(json)
        } catch (err) {
            console.error('Error al obtener BCV:', err)
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTasa()
    }, [])

    return (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp className="w-24 h-24" />
            </div>

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-[#1e3a8a] rounded-full flex items-center justify-center shadow-inner">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Tasa Oficial (BCV)</h3>
                        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-1">
                            Fuente: DolarAPI <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1"></span>
                        </p>
                    </div>
                </div>

                <button
                    onClick={fetchTasa}
                    disabled={loading}
                    className="p-2 bg-slate-50 text-slate-400 hover:text-[#1e3a8a] hover:bg-blue-50 rounded-full transition-all disabled:animate-spin"
                    title="Actualizar Tasa"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            <div className="relative z-10 mt-6 flex items-end gap-3">
                {loading && !data ? (
                    <div className="h-10 bg-slate-100 rounded animate-pulse w-32" />
                ) : error ? (
                    <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl text-sm font-bold w-full border border-red-100">
                        <AlertCircle className="w-4 h-4" />
                        Error de conexión con el BCV
                    </div>
                ) : (
                    <>
                        <span className="text-4xl font-black text-[#1e3a8a] tracking-tighter">
                            Bs. {data?.promedio.toFixed(2)}
                        </span>
                        <div className="pb-1 text-slate-500 text-xs font-medium">
                            / 1 USD
                            <p className="text-[10px] truncate max-w-[150px]">
                                Act: {data ? new Date(data.fechaActualizacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                            </p>
                        </div>
                    </>
                )}
            </div>

            <p className="text-xs text-slate-400 mt-4 leading-relaxed relative z-10">
                Esta es la tasa de referencia utilizada en Venezuela. Te servirá de guía al momento de conciliar pagos electrónicos.
            </p>
        </div>
    )
}
