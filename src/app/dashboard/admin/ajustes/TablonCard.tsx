'use client'

import { useState } from 'react'
import { guardarAnuncioAction } from './actions'
import { Megaphone, Send, Trash2 } from 'lucide-react'

export default function TablonCard({ anuncioActual }: { anuncioActual: string | null }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)
        setSuccess(false)

        const res = await guardarAnuncioAction(formData)

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
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                    <Megaphone className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-lg">Tablón de Anuncios</h3>
                    <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Visible para todos los vecinos</p>
                </div>
            </div>

            <form action={handleSubmit} className="space-y-3">
                <textarea
                    name="anuncio"
                    defaultValue={anuncioActual || ''}
                    rows={3}
                    placeholder="Escribe un aviso importante aquí. Ej: 'Corte de agua programado para mañana a las 2PM'."
                    className="w-full text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none resize-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all focus:bg-white"
                />

                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                        {success && <p className="text-xs text-emerald-600 font-medium">¡Anuncio Publicado!</p>}
                        {!error && !success && <p className="text-xs text-slate-400">Deja en blanco para borrar el anuncio actual.</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Guardando...' : 'Publicar'}
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    )
}
