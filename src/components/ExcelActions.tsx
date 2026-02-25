'use client'

import React, { useRef, useState } from 'react'
import { FileSpreadsheet, Upload, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { getReporteAnualAction, importRecibosExcelAction } from '@/app/dashboard/admin/finanzas/actions'

export default function ExcelActions() {
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleExport = async () => {
        setLoading(true)
        setStatus(null)
        try {
            const result = await getReporteAnualAction();
            if (result.error) throw new Error(result.error);

            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Registro Anual');

            // --- DISEÑO ESTÉTICO ---

            // 1. Título principal
            sheet.mergeCells('A1', 'O1');
            const titleRow = sheet.getRow(1);
            titleRow.value = `REGISTRO ANUAL DE COBROS - ${result.condominio || 'CONDOMINIO'}`;
            titleRow.font = { name: 'Inter', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
            titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
            titleRow.height = 40;
            titleRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF1E3A8A' } // El azul oscuro del sistema
            };

            // 2. Subtítulo Año
            sheet.mergeCells('A2', 'O2');
            const subRow = sheet.getRow(2);
            subRow.value = `Año Fiscal: ${new Date().getFullYear()}`;
            subRow.font = { size: 12, italic: true };
            subRow.alignment = { horizontal: 'center' };

            // 3. Encabezados de Tabla
            const headers = [
                'Identificador', 'Propietario', 'Cedula',
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
            ];

            const headerRow = sheet.getRow(4);
            headerRow.values = headers;
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF334155' } // Slate 700
            };
            headerRow.height = 25;

            // 4. Agregar Datos
            const rows = result.data || [];
            rows.forEach((item: any, index: number) => {
                const rowData = [
                    item['Identificador'],
                    item['Propietario'],
                    item['Cedula'],
                    item['Enero'], item['Febrero'], item['Marzo'], item['Abril'],
                    item['Mayo'], item['Junio'], item['Julio'], item['Agosto'],
                    item['Septiembre'], item['Octubre'], item['Noviembre'], item['Diciembre']
                ];
                const row = sheet.addRow(rowData);

                // Estilo filas alternas
                if (index % 2 === 0) {
                    row.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF8FAFC' } // Slate 50
                    };
                }

                // Alineaciones campos numéricos
                for (let i = 4; i <= 15; i++) {
                    row.getCell(i).alignment = { horizontal: 'right' };
                    row.getCell(i).numFmt = '#,##0.00" $"';
                }
                row.getCell(1).alignment = { horizontal: 'center' };
                row.getCell(3).alignment = { horizontal: 'center' };
            });

            // 5. Ajustes finales (Anchos de columna)
            sheet.getColumn(1).width = 15; // Identificador
            sheet.getColumn(2).width = 35; // Propietario
            sheet.getColumn(3).width = 15; // Cédula
            for (let i = 4; i <= 15; i++) {
                sheet.getColumn(i).width = 12; // Meses
            }

            // 6. Bordes a la tabla
            const lastRowNumber = sheet.lastRow?.number || 4;
            for (let r = 4; r <= lastRowNumber; r++) {
                for (let c = 1; c <= 15; c++) {
                    sheet.getRow(r).getCell(c).border = {
                        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                    };
                }
            }

            // Inmovilizar encabezados
            sheet.views = [
                { state: 'frozen', xSplit: 0, ySplit: 4, activePane: 'bottomRight', selRange: 'A5' }
            ];

            // Generar y descargar
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `Reporte_Anual_${new Date().getFullYear()}.xlsx`);

            setStatus({ type: 'success', message: 'Excel Premium exportado correctamente.' });
        } catch (err: any) {
            console.error(err);
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
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) throw new Error('El archivo está vacío.');

                // Validar estructura básica (opcional pero recomendado)
                const firstRow: any = data[0];
                if (!firstRow?.Identificador) {
                    throw new Error('El formato no parece correcto. Falta la columna "Identificador".');
                }

                const result = await importRecibosExcelAction(data);
                if (result.error) throw new Error(result.error);

                setStatus({ type: 'success', message: `Importación exitosa: ${result.count} recibos procesados.` });
                if (fileInputRef.current) fileInputRef.current.value = '';
            } catch (err: any) {
                console.error(err);
                setStatus({ type: 'error', message: err.message || 'Error al importar Excel.' });
            } finally {
                setLoading(false)
            }
        };

        reader.readAsBinaryString(file);
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={handleExport}
                    disabled={loading}
                    className="flex items-center gap-2 bg-[#1e3a8a] text-white px-5 py-3 rounded-xl text-sm font-bold shadow-md hover:bg-blue-900 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5" />}
                    Descargar Registro Premium
                </button>

                <div className="relative">
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".xlsx, .xls"
                        onChange={handleImport}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className="flex items-center gap-2 bg-slate-100 text-slate-700 px-5 py-3 rounded-xl text-sm font-bold border border-slate-200 hover:bg-white hover:shadow-sm transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                        Importar Datos
                    </button>
                </div>
            </div>

            {status && (
                <div className={`flex items-center gap-3 px-4 py-4 rounded-2xl border text-sm font-medium animate-in fade-in slide-in-from-top-2 shadow-sm ${status.type === 'success'
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                        : 'bg-red-50 border-red-100 text-red-800'
                    }`}>
                    {status.type === 'success' ? (
                        <div className="bg-emerald-500 text-white p-1 rounded-full shadow-sm">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    ) : (
                        <div className="bg-red-500 text-white p-1 rounded-full shadow-sm">
                            <AlertCircle className="w-4 h-4" />
                        </div>
                    )}
                    {status.message}
                </div>
            )}
        </div>
    )
}
