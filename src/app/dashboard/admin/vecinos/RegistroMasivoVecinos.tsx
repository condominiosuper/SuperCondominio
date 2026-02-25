'use client'

import React, { useRef, useState } from 'react'
import { FileSpreadsheet, Upload, Download, Loader2, CheckCircle2, AlertCircle, Plus, Building, User, CreditCard, Phone, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { getInmueblesDatosAction, importarInmueblesMasivoAction, crearInmuebleAction, crearVecinoAction } from './actions'

export default function RegistroMasivoVecinos({ inmueblesVacantes }: { inmueblesVacantes: any[] }) {
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
    const [view, setView] = useState<'options' | 'manual' | 'excel'>('options')
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Estado Formulario Manual Combinado
    const [manualLoading, setManualLoading] = useState(false)

    const handleExport = async () => {
        setLoading(true)
        setStatus(null)
        try {
            const result = await getInmueblesDatosAction();
            if (result.error) throw new Error(result.error);

            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Directorio Vecinal');

            // --- DISEÑO ESTÉTICO ---
            sheet.mergeCells('A1', 'E1');
            const titleRow = sheet.getRow(1);
            titleRow.getCell(1).value = `DIRECTORIO VECINAL - ${result.condominioNombre}`;
            titleRow.font = { name: 'Inter', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
            titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
            titleRow.height = 40;
            titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };

            const headers = ['Inmueble', 'Nombre', 'Apellido', 'Cedula', 'Telefono'];
            const headerRow = sheet.getRow(3);
            headerRow.values = headers;
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
            headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
            headerRow.height = 25;

            if (result.inmuebles) {
                result.inmuebles.forEach((item: any, index: number) => {
                    const prop = Array.isArray(item.propietarios) ? item.propietarios[0] : item.propietarios;
                    const rowData = [
                        item.identificador,
                        prop?.nombres || '',
                        prop?.apellidos || '',
                        prop?.cedula || '',
                        prop?.telefono || ''
                    ];
                    const row = sheet.addRow(rowData);
                    if (index % 2 === 0) {
                        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                    }
                });
            }

            sheet.getColumn(1).width = 20; // Inmueble
            sheet.getColumn(2).width = 25; // Nombre
            sheet.getColumn(3).width = 25; // Apellido
            sheet.getColumn(4).width = 18; // Cedula
            sheet.getColumn(5).width = 20; // Telefono

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `Directorio_Vecinos_${new Date().toLocaleDateString()}.xlsx`);

            setStatus({ type: 'success', message: 'Formato de Directorio exportado.' });
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || 'Error al exportar.' });
        } finally {
            setLoading(false)
        }
    }

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true)
        setStatus(null)
        const reader = new FileReader();

        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rawData: any[] = XLSX.utils.sheet_to_json(ws);

                if (rawData.length === 0) throw new Error('El archivo está vacío.');

                // Normalizar keys
                const normalizedData = rawData.map(row => ({
                    inmueble: row.Inmueble || row.inmueble || row.Identificador,
                    nombre: row.Nombre || row.nombre,
                    apellido: row.Apellido || row.apellido,
                    cedula: row.Cedula || row.cedula || row.Cédula,
                    telefono: row.Telefono || row.telefono || row.Teléfono
                }));

                const result = await importarInmueblesMasivoAction(normalizedData);
                if (!result.success) throw new Error(result.error);

                setStatus({ type: 'success', message: `Importación exitosa: ${result.count} registros procesados.` });
                setView('options');
            } catch (err: any) {
                setStatus({ type: 'error', message: err.message || 'Error al importar.' });
            } finally {
                setLoading(false)
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsBinaryString(file);
    }

    const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setManualLoading(true);
        setStatus(null);

        const formData = new FormData(e.currentTarget);
        const identificador = formData.get('identificador') as string;
        const cedula = formData.get('cedula') as string;

        try {
            // 1. Crear Inmueble
            const resInm = await crearInmuebleAction(formData);
            if (!resInm.success) throw new Error(resInm.error);

            // 2. Si hay cédula, crear vecino vinculado
            if (cedula && resInm.id) {
                formData.append('inmueble_id', resInm.id);
                const resVec = await crearVecinoAction(formData);
                if (!resVec.success) throw new Error(resVec.error);
            }

            setStatus({ type: 'success', message: 'Registro individual completado con éxito.' });
            setView('options');
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || 'Error en el registro manual.' });
        } finally {
            setManualLoading(false);
        }
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
            {/* Header del Componente */}
            <div className="bg-slate-50 border-b border-slate-100 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <User className="w-6 h-6 text-[#1e3a8a]" /> Registro de Vecinos
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">Gestiona tu comunidad de forma individual o masiva</p>
                </div>

                {view !== 'options' && (
                    <button
                        onClick={() => setView('options')}
                        className="text-slate-400 hover:text-slate-600 p-2 hover:bg-white rounded-full transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="p-6">
                {view === 'options' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Opción Manual */}
                        <button
                            onClick={() => setView('manual')}
                            className="flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#1e3a8a] hover:bg-blue-50/50 transition-all group"
                        >
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-[#1e3a8a] group-hover:scale-110 transition-transform">
                                <Plus className="w-8 h-8" />
                            </div>
                            <div className="text-center">
                                <span className="block font-bold text-slate-800 text-lg">Registro Individual</span>
                                <span className="text-sm text-slate-500">Crea un inmueble y asigna su dueño</span>
                            </div>
                        </button>

                        {/* Opción Excel */}
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleExport}
                                disabled={loading}
                                className="flex-1 flex items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                        <Download className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <span className="block font-bold text-slate-800">Exportar Directorio</span>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Descargar Plantilla</span>
                                    </div>
                                </div>
                                {loading && <Loader2 className="w-5 h-5 animate-spin text-slate-400" />}
                            </button>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={loading}
                                className="flex-1 flex items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <span className="block font-bold text-slate-800">Importar Excel</span>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Carga Masiva</span>
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".xlsx, .xls"
                                    onChange={handleImport}
                                />
                            </button>
                        </div>
                    </div>
                )}

                {view === 'manual' && (
                    <form onSubmit={handleManualSubmit} className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Building className="w-4 h-4" /> Datos del Inmueble
                                </h4>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Identificador</label>
                                    <div className="relative">
                                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            required
                                            name="identificador"
                                            type="text"
                                            placeholder="Ej: Apto 10-A, Casa 44..."
                                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <User className="w-4 h-4" /> Datos del Propietario (Opcional)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Nombres</label>
                                        <input
                                            name="nombres"
                                            type="text"
                                            placeholder="Ej: Pedro"
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Apellidos</label>
                                        <input
                                            name="apellidos"
                                            type="text"
                                            placeholder="Ej: Perez"
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Cédula</label>
                                        <input
                                            name="cedula"
                                            type="text"
                                            placeholder="Ej: V-12345678"
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Teléfono</label>
                                        <input
                                            name="telefono"
                                            type="text"
                                            placeholder="Ej: 0412..."
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setView('options')}
                                className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all border border-slate-100"
                            >
                                Volver
                            </button>
                            <button
                                type="submit"
                                disabled={manualLoading}
                                className="flex-[2] py-4 bg-[#1e3a8a] text-white font-bold rounded-2xl shadow-lg hover:bg-blue-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {manualLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                {manualLoading ? 'Procesando...' : 'Completar Registro'}
                            </button>
                        </div>
                    </form>
                )}

                {status && (
                    <div className={`mt-6 flex items-center gap-3 px-4 py-4 rounded-2xl border text-sm font-medium animate-in fade-in slide-in-from-top-2 shadow-sm ${status.type === 'success'
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                        : 'bg-red-50 border-red-100 text-red-800'
                        }`}>
                        {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                        {status.message}
                    </div>
                )}
            </div>
        </div>
    )
}
