'use client'

import React, { useState, useMemo } from 'react'
import { Search, Download, Clock, MessageCircle, Eye, CreditCard, FileText, TrendingUp, AlertCircle, Phone } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { toast } from 'sonner'
import ModalRegistroPagoManual from './ModalRegistroPagoManual'

interface ReporteItem {
    id: string
    identificador: string
    propietario: string
    saldoAnteriorUSD: number
    cargoMesActualUSD: number
    cargoMesNombre: string
    saldoTotalUSD: number
    mesesMora: number
    ultimoPago?: {
        monto_bs: number
        fecha_pago: string
    } | null
}

interface ReporteProps {
    data: ReporteItem[]
    dataAnual?: any[]
    tasaBcv: number
}

export default function ReporteCuentasPorCobrar({ data, dataAnual = [], tasaBcv }: ReporteProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState<'Todos' | 'Solvente' | 'Moroso' | 'Gracia'>('Todos')
    const [activeTab, setActiveTab] = useState<'resumen' | 'matriz'>('resumen')
    const [downloadingTemplate, setDownloadingTemplate] = useState(false)
    const [selectedItem, setSelectedItem] = useState<ReporteItem | null>(null)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [selectedInmuebleForPayment, setSelectedInmuebleForPayment] = useState<any>(null)

    // ... (Mantengo handleDownloadTemplate y filtrado tal cual)
    const handleDownloadTemplate = async () => {
        setDownloadingTemplate(true);
        try {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Plantilla Importación');

            const headers = ['Identificador', 'Propietario', 'Cedula', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            const headerRow = sheet.getRow(1);
            headerRow.values = headers;
            headerRow.height = 25;

            for (let c = 1; c <= 15; c++) {
                const cell = headerRow.getCell(c);
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
            }

            sheet.addRow(['A-11', 'Juan Pérez', 'V-12345678', 50.00, 50.00, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
            sheet.addRow(['B-22', 'María Gómez', 'V-87654321', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

            for (let r = 2; r <= 3; r++) {
                const row = sheet.getRow(r);
                for (let c = 4; c <= 15; c++) {
                    row.getCell(c).alignment = { horizontal: 'right' };
                    row.getCell(c).numFmt = '#,##0.00" $"';
                }
                row.getCell(1).alignment = { horizontal: 'center' };
                row.getCell(3).alignment = { horizontal: 'center' };
            }

            sheet.getColumn(1).width = 15;
            sheet.getColumn(2).width = 35;
            sheet.getColumn(3).width = 15;
            for (let i = 4; i <= 15; i++) { sheet.getColumn(i).width = 12; }

            sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `Plantilla_Cuentas_SuperCondominio.xlsx`);
        } catch (error) {
            console.error("Error generating Excel template:", error);
            alert("Error al generar la plantilla Excel.");
        } finally {
            setDownloadingTemplate(false);
        }
    }

    const filteredData = useMemo(() => {
        return data.filter(item => {
            const matchesSearch = item.identificador.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.propietario.toLowerCase().includes(searchTerm.toLowerCase());

            let matchesStatus = true;
            if (filterStatus !== 'Todos') {
                const isSolvente = item.saldoTotalUSD <= 0;
                const isGracia = item.mesesMora === 1 && item.saldoTotalUSD > 0;
                const isMoroso = item.mesesMora > 1;

                if (filterStatus === 'Solvente' && !isSolvente) matchesStatus = false;
                if (filterStatus === 'Gracia' && !isGracia) matchesStatus = false;
                if (filterStatus === 'Moroso' && !isMoroso) matchesStatus = false;
            }

            return matchesSearch && matchesStatus;
        })
    }, [data, searchTerm, filterStatus])

    const filteredAnualData = useMemo(() => {
        if (!dataAnual || dataAnual.length === 0) return [];
        return dataAnual.filter((item: any) =>
            (item.Identificador || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.Propietario || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [dataAnual, searchTerm])

    const formatBS = (amountUSD: number) => {
        return (amountUSD * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Bs.'
    }

    const formatUSD = (amountUSD: number) => {
        return '$' + amountUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    const handleWhatsApp = (item: ReporteItem) => {
        const text = encodeURIComponent(`Hola ${item.propietario}, te recordamos que el pago de tu condominio (${item.identificador}) presenta un saldo pendiente de ${formatUSD(item.saldoTotalUSD)} equivalente a ${formatBS(item.saldoTotalUSD)}. Por favor, regulariza tu situación a la brevedad posible.`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    }

    return (
        <>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                <div className="p-4 lg:p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
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
                    </div>

                    {/* Tabs switcher */}
                    <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                        <button
                            onClick={() => setActiveTab('resumen')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'resumen' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Vista Resumen
                        </button>
                        <button
                            onClick={() => setActiveTab('matriz')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'matriz' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Matriz Anual (Web)
                        </button>
                    </div>

                    {/* Píldoras de Filtro Rápido (Solo visibles en Resumen) */}
                    {activeTab === 'resumen' && (
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setFilterStatus('Todos')}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filterStatus === 'Todos' ? 'bg-slate-800 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setFilterStatus('Solvente')}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${filterStatus === 'Solvente' ? 'bg-emerald-100 text-emerald-700 shadow-sm ring-1 ring-emerald-200' : 'bg-white border border-emerald-100 text-emerald-600 hover:bg-emerald-50'}`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${filterStatus === 'Solvente' ? 'bg-emerald-500' : 'bg-emerald-400'}`}></div>
                                Solventes
                            </button>
                            <button
                                onClick={() => setFilterStatus('Moroso')}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${filterStatus === 'Moroso' ? 'bg-red-100 text-red-700 shadow-sm ring-1 ring-red-200' : 'bg-white border border-red-100 text-red-600 hover:bg-red-50'}`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${filterStatus === 'Moroso' ? 'bg-red-500' : 'bg-red-400'}`}></div>
                                Morosos
                            </button>
                            <button
                                onClick={() => setFilterStatus('Gracia')}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${filterStatus === 'Gracia' ? 'bg-amber-100 text-amber-700 shadow-sm ring-1 ring-amber-200' : 'bg-white border border-amber-100 text-amber-600 hover:bg-amber-50'}`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${filterStatus === 'Gracia' ? 'bg-amber-500' : 'bg-amber-400'}`}></div>
                                En Gracia
                            </button>
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto flex-1">
                    {activeTab === 'resumen' ? (
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Inmueble / Propietario</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Estatus</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Mora</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-[#1e3a8a] uppercase tracking-widest text-right">Deuda Mensual</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Deuda Total</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredData.map((item) => {
                                    const isSolvente = item.saldoTotalUSD <= 0;
                                    const isGracia = item.mesesMora === 1 && item.saldoTotalUSD > 0;
                                    const isMoroso = item.mesesMora > 1;

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="min-w-[36px] h-9 px-2 bg-blue-50 text-[#1e3a8a] rounded-lg flex items-center justify-center font-bold text-sm whitespace-nowrap">
                                                        {item.identificador}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 line-clamp-1">{item.propietario}</p>
                                                        {item.ultimoPago ? (
                                                            <p className="text-[10px] text-emerald-600 font-medium">Último: {format(new Date(item.ultimoPago.fecha_pago), "d MMM yyyy", { locale: es })}</p>
                                                        ) : (
                                                            <p className="text-[10px] text-slate-400 font-medium">Sin historial de pagos</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {isSolvente && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">SOLVENTE</span>}
                                                {isGracia && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">GRACIA</span>}
                                                {isMoroso && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700">MOROSO</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {item.mesesMora === 0 ? (
                                                    <span className="text-slate-300 text-xl font-black block">-</span>
                                                ) : (
                                                    <div>
                                                        <p className={`text-lg font-black leading-none ${isMoroso ? 'text-red-500' : 'text-slate-600'}`}>{item.mesesMora}</p>
                                                        <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-0.5">Meses</p>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex flex-col items-end">
                                                    <p className="text-sm font-black text-[#1e3a8a]">{formatUSD(item.cargoMesActualUSD)}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-[9px] text-[#1e3a8a]/70 font-bold uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded">{item.cargoMesNombre}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold font-mono">{formatBS(item.cargoMesActualUSD)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex flex-col items-end">
                                                    <p className={`text-lg font-black leading-tight ${item.saldoTotalUSD > 0 ? 'text-slate-800' : 'text-emerald-600'}`}>
                                                        {formatUSD(item.saldoTotalUSD)}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-bold font-mono mt-0.5">{formatBS(item.saldoTotalUSD)}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        title="Registrar Pago"
                                                        onClick={() => {
                                                            setSelectedInmuebleForPayment({
                                                                id: item.id,
                                                                identificador: item.identificador,
                                                                propietario: item.propietario,
                                                                saldoTotalUSD: item.saldoTotalUSD
                                                            });
                                                            setIsPaymentModalOpen(true);
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-[#1e3a8a] hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                    >
                                                        <CreditCard className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        title="Ver Detalle"
                                                        onClick={() => setSelectedItem(item)}
                                                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 shadow-sm hover:shadow"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        title="Recordatorio WhatsApp"
                                                        onClick={() => handleWhatsApp(item)}
                                                        disabled={isSolvente}
                                                        className="p-2 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent disabled:hover:text-emerald-400"
                                                    >
                                                        <MessageCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    ) : (
                        /* TABLA MATRIZ ANUAL */
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest sticky left-0 bg-slate-50 z-10 border-r border-slate-100 shadow-[1px_0_0_0_#f1f5f9]">Inmueble / Propietario</th>
                                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(mes => (
                                        <th key={mes} className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">{mes.substring(0, 3)}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredAnualData.map((item: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-3 sticky left-0 bg-white z-10 border-r border-slate-50 shadow-[1px_0_0_0_#f8fafc]">
                                            <p className="font-bold text-slate-800 text-sm">{item.Identificador}</p>
                                            <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">{item.Propietario}</p>
                                        </td>
                                        {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(mes => {
                                            const val = Number(item[mes]) || 0;
                                            const isEmpty = val === 0;
                                            return (
                                                <td key={mes} className={`px-4 py-3 text-right text-sm font-bold font-mono ${isEmpty ? 'text-slate-300' : 'text-red-600 bg-red-50/50'}`}>
                                                    {isEmpty ? '-' : val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {((activeTab === 'resumen' && filteredData.length === 0) || (activeTab === 'matriz' && filteredAnualData.length === 0)) && (
                        <div className="py-20 text-center">
                            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                {data.length === 0 ? <FileText className="w-8 h-8 text-[#1e3a8a]/60" /> : <AlertCircle className="w-8 h-8" />}
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">
                                {data.length === 0 ? 'Sin Registros en el Sistema' : 'No se encontraron resultados'}
                            </h3>
                            {data.length === 0 ? (
                                <div className="mt-3">
                                    <p className="text-sm text-slate-500 mb-4 px-4">Inicia la gestión financiera de tu condominio hoy mismo.</p>
                                    <button
                                        onClick={handleDownloadTemplate}
                                        disabled={downloadingTemplate}
                                        className="inline-flex items-center justify-center gap-2 bg-[#1e3a8a] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-900 transition-colors shadow-sm disabled:opacity-50"
                                    >
                                        {downloadingTemplate ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Download className="w-4 h-4" />
                                        )}
                                        {downloadingTemplate ? 'Generando Plantilla...' : 'Descargar Plantilla de Ejemplo'}
                                    </button>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 mt-1">Prueba con otro término de búsqueda.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Pagination / Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs text-slate-500 font-medium">
                        Mostrando <span className="font-bold text-slate-800">{activeTab === 'resumen' ? filteredData.length : filteredAnualData.length}</span> de {activeTab === 'resumen' ? data.length : dataAnual.length} inmuebles
                    </p>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-400 cursor-not-allowed">Anterior</button>
                        <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50">Siguiente</button>
                    </div>
                </div>
            </div>

            {/* Slide-over Detail Panel */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-start justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity"
                        onClick={() => setSelectedItem(null)}
                    ></div>

                    {/* Panel */}
                    <div className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 border-l border-slate-200">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 relative z-10">
                            <div>
                                <h3 className="text-xl font-bold text-[#1e3a8a]">Estado de Cuenta</h3>
                                <p className="text-sm text-slate-500 font-medium mt-1">{selectedItem.identificador} • {selectedItem.propietario}</p>
                            </div>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-slate-400 hover:text-slate-700 hover:shadow-md hover:-rotate-90 transition-all border border-slate-200"
                            >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 13L13 1M1 1L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        {/* Body - Scrollable content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
                            {/* Resumen Balance */}
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center shadow-sm">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Saldo Total Pendiente</p>
                                <h2 className={`text-4xl font-black mb-1 ${selectedItem.saldoTotalUSD > 0 ? 'text-slate-800' : 'text-emerald-600'}`}>
                                    {formatUSD(selectedItem.saldoTotalUSD)}
                                </h2>
                                <p className="text-xs font-bold text-slate-400">{formatBS(selectedItem.saldoTotalUSD)}</p>

                                <div className="mt-4 pt-4 border-t border-slate-200/60 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Meses Mora</p>
                                        <p className={`text-lg font-black ${selectedItem.mesesMora > 0 ? 'text-red-500' : 'text-slate-800'}`}>{selectedItem.mesesMora}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Cargo Actual</p>
                                        <p className="text-lg font-black text-[#1e3a8a]">{formatUSD(selectedItem.cargoMesActualUSD)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Ultimo Pago */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 transition-transform group-hover:scale-110"></div>
                                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3 relative z-10">
                                    <Clock className="w-4 h-4 text-emerald-500" /> Registro de Último Pago
                                </h4>
                                {selectedItem.ultimoPago ? (
                                    <div className="relative z-10">
                                        <p className="text-xl font-black text-slate-800 mb-1">{selectedItem.ultimoPago.monto_bs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.</p>
                                        <p className="text-xs font-medium text-slate-500">{format(new Date(selectedItem.ultimoPago.fecha_pago), "d 'de' MMMM, yyyy - hh:mm a", { locale: es })}</p>
                                    </div>
                                ) : (
                                    <div className="py-2 text-center relative z-10">
                                        <p className="text-sm font-medium text-slate-500">No hay pagos registrados para este inmueble.</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-blue-800 mb-1">Nota Administrativa</p>
                                    <p className="text-xs text-blue-700/80 leading-relaxed">
                                        Los montos en dólares americanos son cálculos equivalentes a la tasa BCV del momento de la consulta. Todos los dictámenes de deuda se cobran en Bolívares.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer (Fixed) */}
                        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-6 flex gap-3 z-10">
                            <button
                                onClick={() => handleWhatsApp(selectedItem)}
                                disabled={selectedItem.saldoTotalUSD <= 0}
                                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white px-5 py-3.5 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-sm focus:ring-4 ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed group w-full"
                            >
                                <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedInmuebleForPayment({
                                        id: selectedItem.id,
                                        identificador: selectedItem.identificador,
                                        propietario: selectedItem.propietario,
                                        saldoTotalUSD: selectedItem.saldoTotalUSD
                                    });
                                    setIsPaymentModalOpen(true);
                                }}
                                className="flex-[2] flex items-center justify-center gap-2 bg-[#1e3a8a] text-white px-5 py-3.5 rounded-xl font-bold hover:bg-blue-900 transition-all shadow-sm focus:ring-4 ring-[#1e3a8a]/20 w-full"
                            >
                                <CreditCard className="w-5 h-5" /> Abonar Pago
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ModalRegistroPagoManual
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                inmueble={selectedInmuebleForPayment}
                tasaBcv={tasaBcv}
                onSuccess={() => {
                    setIsPaymentModalOpen(false);
                    // Force a reload using window location to get fresh server data
                    window.location.reload();
                }}
            />
        </>
    )
}
