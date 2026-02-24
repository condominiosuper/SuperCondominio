'use client'

import { useState } from 'react'
import { FileText, Upload, CheckCircle2, Loader2, Link as LinkIcon } from 'lucide-react'
import { subirCartaResidenciaAction } from './actions'

interface Props {
    urlActual: string | null;
}

export default function CartaResidenciaCard({ urlActual }: Props) {
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [msg, setMsg] = useState('')
    const [fileName, setFileName] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFileName(e.target.files[0].name)
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setStatus('idle')

        const formData = new FormData(e.currentTarget)
        const result = await subirCartaResidenciaAction(formData)

        if (result.success) {
            setStatus('success')
            setMsg('Carta de residencia actualizada exitosamente.')
            setFileName(null)
            const form = e.target as HTMLFormElement;
            form.reset();
        } else {
            setStatus('error')
            setMsg(result.error || 'Error desconocido.')
        }
        setIsLoading(false)
    }

    return (
        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:border-slate-300">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
                    <FileText className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900">Carta de Residencia</h3>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Formato descargable para vecinos</p>
                </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                    <div>
                        <p className="text-sm font-bold text-slate-800">Estado Actual</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {urlActual ? 'Documento disponible para los residentes.' : 'No se ha cargado ningún documento.'}
                        </p>
                    </div>
                    {urlActual && (
                        <a href={urlActual} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold text-[#1e3a8a] rounded-lg hover:bg-slate-50 transition-colors shrink-0">
                            <LinkIcon className="w-3.5 h-3.5" /> Ver PDF
                        </a>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="mt-4 border-t border-slate-200 pt-4">
                    <p className="text-xs font-bold text-slate-700 mb-2">Subir / Reemplazar PDF</p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <label className="flex-1 relative cursor-pointer group">
                            <input
                                type="file"
                                name="documento"
                                accept="application/pdf"
                                required
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className={`w-full h-full border-2 border-dashed rounded-xl px-4 py-2.5 flex items-center gap-2 transition-colors ${fileName ? 'border-indigo-300 bg-indigo-50/50 text-indigo-700' : 'border-slate-300 bg-white text-slate-500 group-hover:border-[#1e3a8a] group-hover:bg-slate-50'}`}>
                                <Upload className="w-4 h-4 shrink-0" />
                                <span className="text-sm font-medium truncate">
                                    {fileName ? fileName : 'Seleccionar archivo PDF...'}
                                </span>
                            </div>
                        </label>

                        <button
                            type="submit"
                            disabled={isLoading || !fileName}
                            className="bg-[#1e3a8a] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-900 focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                            {isLoading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo</>
                            ) : (
                                'Guardar'
                            )}
                        </button>
                    </div>

                    {status === 'success' && (
                        <div className="mt-3 flex items-center gap-2 text-emerald-600 text-xs font-medium bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                            <CheckCircle2 className="w-4 h-4" /> {msg}
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="mt-3 p-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-medium">
                            {msg}
                        </div>
                    )}
                </form>
            </div>
        </div>
    )
}
