'use client'

import React, { useState, useMemo } from 'react'
import { Search, Download, User, Building, Clock, ChevronRight, FileText, TrendingUp, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ReporteItem {
    id: string
    identificador: string
    propietario: string
    saldoAnteriorUSD: number
    cargoMesActualUSD: number
    cargoMesNombre: string
    saldoTotalUSD: number
    ultimoPago?: {
        monto_bs: number
        fecha_pago: string
    } | null
}

interface ReporteProps {
    data: ReporteItem[]
    tasaBcv: number
}

export default function ReporteCuentasPorCobrar({ data, tasaBcv }: ReporteProps) {
    const [searchTerm, setSearchTerm] = useState('')

    const filteredData = useMemo(() => {
        return data.filter(item =>
            item.identificador.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.propietario.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [data, searchTerm])

    const formatBS = (amountUSD: number) => {
        return (amountUSD * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Bs.'
    }

    const formatUSD = (amountUSD: number) => {
        return '$' + amountUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            {/* Toolbar */}
            <div className="p-4 lg:p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full max-w-md">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por inmueble o propietario..."
                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="flex items-center gap-2 bg-[#1e3a8a] text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-900 transition-all w-full sm:w-auto justify-center">
                    <Download className="w-4 h-4" /> Exportar PDF
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inmueble / Propietario</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo Anterior</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-blue-600">Cargo Mes</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ult. Pago</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Saldo Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredData.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-blue-50 text-[#1e3a8a] rounded-lg flex items-center justify-center font-bold text-sm">
                                            {item.identificador}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 line-clamp-1">{item.propietario}</p>
                                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">VECINO DE LA TORRE</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm font-medium text-slate-600">{formatBS(item.saldoAnteriorUSD)}</p>
                                    <p className="text-[10px] text-slate-400">{formatUSD(item.saldoAnteriorUSD)}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="bg-blue-50/50 border border-blue-100 p-2 rounded-lg inline-block">
                                        <p className="text-sm font-bold text-[#1e3a8a]">{formatBS(item.cargoMesActualUSD)}</p>
                                        <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">{item.cargoMesNombre}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {item.ultimoPago ? (
                                        <div>
                                            <p className="text-sm font-bold text-emerald-600">{item.ultimoPago.monto_bs.toLocaleString('es-VE')} Bs.</p>
                                            <p className="text-[10px] text-slate-400">{format(new Date(item.ultimoPago.fecha_pago), "d MMM yyyy", { locale: es })}</p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-slate-400 italic">
                                            <Clock className="w-3 h-3" />
                                            <span className="text-[11px] font-medium">Sin pagos</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <p className={`text-lg font-black ${item.saldoTotalUSD > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {formatBS(item.saldoTotalUSD)}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-bold font-mono">{formatUSD(item.saldoTotalUSD)}</p>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredData.length === 0 && (
                    <div className="py-20 text-center">
                        <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">No se encontraron resultados</h3>
                        <p className="text-sm text-slate-500">Prueba con otro término de búsqueda.</p>
                    </div>
                )}
            </div>

            {/* Pagination / Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500 font-medium">
                    Mostrando <span className="font-bold text-slate-800">{filteredData.length}</span> de {data.length} inmuebles
                </p>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-400 cursor-not-allowed">Anterior</button>
                    <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50">Siguiente</button>
                </div>
            </div>
        </div>
    )
}
