'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, UploadCloud, Receipt, Building2, Calendar, FileText, CheckCircle2, Copy, CheckCheck, Landmark } from 'lucide-react'
import Link from 'next/link'
import { submitPagoAction } from './actions'
import { compressImage } from '@/utils/imageCompression'

interface Props {
    cuentasCondominio: any[]
}

export default function NuevoPagoClient({ cuentasCondominio }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [serverError, setServerError] = useState('')

    // Archivo y ref
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Estado para copiar
    const [copiedField, setCopiedField] = useState('')

    // Tasa Dolar (Asincrona)
    const [tasaBcv, setTasaBcv] = useState<number | null>(null)

    useEffect(() => {
        fetch('https://ve.dolarapi.com/v1/dolares/oficial')
            .then(r => r.json())
            .then(data => setTasaBcv(data.promedio))
            .catch(e => console.error(e))
    }, [])

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text)
        setCopiedField(field)
        setTimeout(() => setCopiedField(''), 2000)
    }

    // Estado del formulario
    const [formData, setFormData] = useState({
        montoBs: '',
        referencia: '',
        fecha: new Date().toISOString().split('T')[0]
    })

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (file.size > 5 * 1024 * 1024) {
                setServerError('La imagen no debe pesar más de 5MB.')
                return
            }
            setSelectedFile(file)
            setServerError('')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setServerError('')

        if (!selectedFile) {
            setServerError('Es obligatorio subir la imagen del comprobante.')
            return
        }

        setIsSubmitting(true)
        setServerError('')

        try {
            let fileToUpload: Blob | File = selectedFile;

            // Optimización: Comprimir si es imagen (no comprimir PDFs)
            if (selectedFile.type.startsWith('image/')) {
                try {
                    const compressed = await compressImage(selectedFile, 1200, 0.7);
                    fileToUpload = compressed;
                } catch (compressErr) {
                    console.error("Error comprimiendo imagen:", compressErr);
                    // Si falla la compresión, seguimos con el original como fallback
                }
            }

            const formDataPayload = new FormData()
            formDataPayload.append('montoBs', formData.montoBs)
            formDataPayload.append('referencia', formData.referencia)
            formDataPayload.append('fecha', formData.fecha)
            formDataPayload.append('capture', fileToUpload, selectedFile.name)

            const response = await submitPagoAction(formDataPayload)

            if (response?.success) {
                setSuccess(true)
            } else {
                setServerError(response?.error || 'Error desconocido.')
            }

        } catch (err: any) {
            setServerError('Error al enviar el formulario al servidor.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-5">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">¡Pago Reportado!</h1>
                <p className="text-slate-500 text-center mb-8 max-w-sm">
                    Tu comprobante ha sido enviado a la administración para su revisión. Te notificaremos cuando el saldo sea aprobado.
                </p>
                <Link href="/dashboard/propietario/pagos" className="bg-[#1e3a8a] text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-900 transition-colors">
                    Volver a Mis Pagos
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-12">

            {/* Header */}
            <header className="px-5 py-4 flex items-center bg-white border-b border-slate-200 sticky top-0 z-40">
                <Link href="/dashboard/propietario/pagos" className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors mr-3">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-lg font-bold text-slate-900 leading-tight">Reportar Pago</h1>
                    <p className="text-xs text-slate-500">Completa el registro de tu pago</p>
                </div>
            </header>

            {/* Formulario */}
            <form className="px-5 pt-6 space-y-6 max-w-md mx-auto" onSubmit={handleSubmit}>

                {serverError && (
                    <div className="bg-red-50 text-red-600 text-sm font-medium p-3 rounded-xl border border-red-200">
                        ⚠️ {serverError}
                    </div>
                )}

                {/* Banner de Tasa BCV Oficial */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">Tasa BCV del Día</p>
                        <p className="text-[10px] text-blue-600 mt-0.5">Automática - DolarAPI</p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                        {tasaBcv ? (
                            <p className="text-xl font-black text-[#1e3a8a] tracking-tight">Bs. {tasaBcv.toFixed(2)}</p>
                        ) : (
                            <span className="text-xs uppercase font-bold text-blue-300 animate-pulse">Consultando...</span>
                        )}
                    </div>
                </div>

                {/* Datos Bancarios Configurados */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4" /> Cuentas Autorizadas
                    </h3>

                    {cuentasCondominio?.length === 0 ? (
                        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg font-medium border border-amber-100">
                            El administrador no ha configurado bancos todavía. Contáctalo.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {cuentasCondominio.map((c, i) => (
                                <div key={i} className={`p-3 rounded-xl border ${i === 0 ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Landmark className={`w-4 h-4 ${i === 0 ? 'text-emerald-600' : 'text-slate-400'}`} />
                                        <span className={`text-xs font-bold tracking-widest uppercase ${i === 0 ? 'text-emerald-800' : 'text-slate-600'}`}>
                                            {c.banco}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-100 cursor-pointer hover:bg-slate-50" onClick={() => handleCopy(c.numero, c.numero)}>
                                            <span className="text-[11px] font-medium text-slate-500">N°/Tlf:</span>
                                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                                {c.numero} {copiedField === c.numero ? <CheckCheck className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-300" />}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-100 cursor-pointer hover:bg-slate-50" onClick={() => handleCopy(c.titular, c.titular)}>
                                            <span className="text-[11px] font-medium text-slate-500">Titular/Doc:</span>
                                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                                {c.titular} {copiedField === c.titular ? <CheckCheck className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-300" />}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Inputs del formulario */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">

                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Monto Transferido (Bs)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Bs.</span>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={formData.montoBs}
                                onChange={(e) => setFormData({ ...formData, montoBs: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="0.00"
                            />
                        </div>
                        {formData.montoBs && tasaBcv && (
                            <p className="text-[10px] text-emerald-600 font-bold mt-1.5 text-right">≈ ${(Number(formData.montoBs) / tasaBcv).toFixed(2)} USD reportados</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">N° de Referencia</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Receipt className="w-5 h-5" /></span>
                            <input
                                type="text"
                                maxLength={8}
                                required
                                value={formData.referencia}
                                onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="Últimos 6 u 8 dígitos"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Fecha del Pago</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Calendar className="w-5 h-5" /></span>
                            <input
                                type="date"
                                required
                                max={new Date().toISOString().split('T')[0]}
                                value={formData.fecha}
                                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                </div>

                {/* Subida de Archivo (Capture) */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Comprobante (Capture)</label>

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed ${selectedFile ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50'} rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer group`}
                    >
                        {selectedFile ? (
                            <>
                                <div className="w-12 h-12 bg-blue-100 text-[#1e3a8a] rounded-full flex items-center justify-center mb-3 shadow-inner">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <p className="font-bold text-slate-900 text-sm mb-1 line-clamp-1 break-all px-2">{selectedFile.name}</p>
                                <p className="text-[10px] text-[#1e3a8a] font-bold uppercase tracking-widest mt-2 bg-white px-3 py-1 rounded-full border border-blue-200 shadow-sm">Cambiar Comprobante</p>
                            </>
                        ) : (
                            <>
                                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                                    <UploadCloud className="w-6 h-6" />
                                </div>
                                <p className="font-bold text-slate-900 text-sm mb-1">Sube tu comprobante</p>
                                <p className="text-xs text-slate-500 px-4">Toca aquí para seleccionar una imagen (JPG, PNG) o PDF.</p>
                            </>
                        )}

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/jpeg,image/png,application/pdf"
                        />
                    </div>
                </div>

                {/* Botón para Enviar */}
                <div className="pt-2 pb-6">
                    <button
                        type="submit"
                        disabled={isSubmitting || !selectedFile}
                        className={`w-full flex items-center justify-center py-4 rounded-xl font-bold text-white transition-all shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-200 ${isSubmitting || !selectedFile ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-[#1e3a8a] text-white hover:bg-blue-900 active:scale-95 hover:shadow-xl'
                            }`}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Analizando Comprobante...
                            </span>
                        ) : 'Enviar Comprobante al Condominio'}
                    </button>
                </div>

            </form>
        </div>
    )
}
