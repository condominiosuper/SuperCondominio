'use client'

import { useState } from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import { crearAnuncioAction } from './actions'

export default function CrearAnuncioForm() {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 border-dashed rounded-xl p-4 flex items-center justify-center gap-2 font-bold transition-all"
            >
                <Plus className="w-5 h-5" />
                Redactar Nuevo Anuncio
            </button>
        )
    }

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        setError(null)
        const res = await crearAnuncioAction(formData)
        if (res?.error) {
            setError(res.error)
            setIsLoading(false)
        } else {
            setIsOpen(false)
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-white border text-left border-slate-200 rounded-2xl shadow-sm p-5 animate-in slide-in-from-top-4 fade-in">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800">Caballete de Redacción</h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 bg-slate-100 hover:bg-slate-200 rounded-full p-1.5 transition">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <form action={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-1">Título del Anuncio</label>
                    <input
                        required
                        name="titulo"
                        type="text"
                        placeholder="Ej: Mantenimiento de Ascensores Pár impar"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:font-normal placeholder:text-slate-400"
                    />
                </div>

                <div>
                    <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-1">Etiqueta o Categoría</label>
                    <div className="relative">
                        <select
                            name="categoria"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none"
                        >
                            <option value="General">🔵 General</option>
                            <option value="Mantenimiento">🟠 Mantenimiento</option>
                            <option value="Eventos">🟣 Eventos / Social</option>
                            <option value="Normativa">🟡 Seguridad y Normativa</option>
                            <option value="Urgente">🔴 Notificación Urgente</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-1">Cuerpo del Mensaje</label>
                    <textarea
                        required
                        name="contenido"
                        rows={5}
                        placeholder="Detalla aquí a los propietarios lo que necesitan saber..."
                        className="w-full bg-slate-50 border font-medium border-slate-200 rounded-lg px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                    ></textarea>
                </div>

                <div className="flex items-center gap-2 mt-2 bg-amber-50 p-3 rounded-xl border border-amber-100">
                    <input
                        type="checkbox"
                        name="fijado"
                        id="fijado"
                        className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                    />
                    <label htmlFor="fijado" className="text-sm font-bold text-amber-900 cursor-pointer">
                        Fijar este anuncio (Destacado permanente en el Feed)
                    </label>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-100 text-xs font-medium">
                        {error}
                    </div>
                )}

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#1e3a8a] text-white rounded-xl py-3.5 font-bold text-sm hover:bg-blue-900 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publicar Anuncio en el Muro'}
                    </button>
                </div>
            </form>
        </div>
    )
}
