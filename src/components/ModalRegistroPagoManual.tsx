import React, { useState } from 'react';
import { X, Loader2, Check } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ModalPagoProps {
    isOpen: boolean;
    onClose: () => void;
    inmueble: {
        id: string;
        identificador: string;
        propietario: string;
        saldoTotalUSD: number;
    } | null;
    tasaBcv: number;
    onSuccess: () => void;
}

export default function ModalRegistroPagoManual({ isOpen, onClose, inmueble, tasaBcv, onSuccess }: ModalPagoProps) {
    const [monto, setMonto] = useState('');
    const [moneda, setMoneda] = useState<'USD' | 'BS'>('USD');
    const [metodo, setMetodo] = useState('Efectivo USD');
    const [referencia, setReferencia] = useState('');
    const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen || !inmueble) return null;

    const montoNum = parseFloat(monto);
    const equivalenteUsd = moneda === 'BS' ? (montoNum / tasaBcv) : montoNum;
    const nuevoSaldo = inmueble.saldoTotalUSD - (isNaN(equivalenteUsd) ? 0 : equivalenteUsd);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isNaN(montoNum) || montoNum <= 0) {
            toast.error('El monto debe ser mayor a 0');
            return;
        }

        setIsLoading(true);
        // We will call the server action here!
        try {
            const { registrarPagoManualAction } = await import('@/app/dashboard/admin/finanzas/actions');
            const res = await registrarPagoManualAction({
                inmuebleId: inmueble.id,
                montoRegistrado: montoNum,
                moneda,
                metodo,
                referencia,
                fecha,
                tasaAplicada: tasaBcv,
                equivalenteUsd
            });

            if (res.success) {
                toast.success('Pago registrado y acreditado con éxito');
                onSuccess();
            } else {
                toast.error(res.error || 'Ocurrió un error al registrar el pago');
            }
        } catch (error) {
            toast.error('Error de conexión con el servidor');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-[#1e3a8a] text-white p-5 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-lg">Registrar Pago Manual</h3>
                        <p className="text-blue-200 text-sm">Acreditar saldo directamente</p>
                    </div>
                    <button onClick={onClose} disabled={isLoading} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* Info Cliente */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inmueble</p>
                            <p className="font-bold text-slate-800">{inmueble.identificador} - {inmueble.propietario}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deuda Actual</p>
                            <p className="font-black text-rose-600 text-lg">${inmueble.saldoTotalUSD.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">Monto</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={monto}
                                onChange={(e) => setMonto(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">Moneda</label>
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button type="button" onClick={() => setMoneda('USD')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${moneda === 'USD' ? 'bg-white shadow-sm text-[#1e3a8a]' : 'text-slate-500'}`}>USD</button>
                                <button type="button" onClick={() => setMoneda('BS')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${moneda === 'BS' ? 'bg-white shadow-sm text-[#1e3a8a]' : 'text-slate-500'}`}>BS</button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">Método</label>
                            <select
                                required
                                value={metodo}
                                onChange={(e) => setMetodo(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-[#1e3a8a]/20 outline-none"
                            >
                                <option value="Efectivo USD">Efectivo USD</option>
                                <option value="Efectivo BS">Efectivo BS</option>
                                <option value="Zelle">Zelle</option>
                                <option value="Pago Móvil">Pago Móvil</option>
                                <option value="Transferencia">Transferencia</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">Fecha</label>
                            <input
                                type="date"
                                required
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-[#1e3a8a]/20 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Referencia / Nota (Opcional)</label>
                        <input
                            type="text"
                            value={referencia}
                            onChange={(e) => setReferencia(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none"
                            placeholder="Entregado al conserje, Ref Zelle..."
                        />
                    </div>

                    {/* Footer Summary */}
                    <div className={`mt-6 p-4 rounded-xl border flex items-center justify-between transition-colors ${!isNaN(equivalenteUsd) && equivalenteUsd > 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Se acreditarán</p>
                            <p className="text-lg font-black text-indigo-700">${(isNaN(equivalenteUsd) ? 0 : equivalenteUsd).toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Nueva Deuda</p>
                            <p className={`text-lg font-black ${nuevoSaldo <= 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                                ${Math.max(0, nuevoSaldo).toFixed(2)}
                            </p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || isNaN(montoNum) || montoNum <= 0}
                        className="w-full mt-4 flex items-center justify-center gap-2 bg-[#1e3a8a] text-white py-3.5 rounded-xl font-bold hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        Confirmar y Acreditar Pago
                    </button>
                </form>

            </div>
        </div>
    );
}
