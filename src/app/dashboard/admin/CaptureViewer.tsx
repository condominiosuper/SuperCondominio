'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, Eye } from 'lucide-react'

interface CaptureViewerProps {
    url: string;
    referencia: string;
}

export default function CaptureViewer({ url, referencia }: CaptureViewerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const isPdf = url.includes('.pdf')

    return (
        <>
            {/* Gatillo miniatura */}
            <div
                className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 cursor-zoom-in hover:opacity-80 transition-opacity flex-shrink-0"
                onClick={() => setIsOpen(true)}
            >
                {isPdf ? (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-400 bg-slate-100 flex-col">
                        PDF
                        <Eye className="w-3 h-3 mt-1" />
                    </div>
                ) : (
                    <Image
                        src={url}
                        alt={`Capture ${referencia}`}
                        fill
                        className="object-cover"
                    />
                )}
            </div>

            {/* Modal de Pantalla Completa */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-2xl h-[85vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-white/10">

                        {/* Header del Visor */}
                        <div className="flex justify-between items-center px-6 py-4 bg-slate-800/80 backdrop-blur-md absolute top-0 left-0 right-0 z-10 w-full">
                            <h3 className="text-white font-bold truncate">Comprobante #{referencia}</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 bg-white/10 hover:bg-red-500/80 text-white rounded-full transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Contenedor del Archivo */}
                        <div className="flex-1 w-full h-full pt-16 relative">
                            {isPdf ? (
                                <iframe
                                    src={`${url}#view=FitH`}
                                    className="w-full h-full border-none bg-white"
                                    title={`PDF Comprobante ${referencia}`}
                                />
                            ) : (
                                <Image
                                    src={url}
                                    alt={`Capture ${referencia}`}
                                    fill
                                    className="object-contain"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
