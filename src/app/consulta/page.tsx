'use client'

import { useState } from 'react'
import { Building2, Landmark, Search, ReceiptIcon, HeadphonesIcon } from 'lucide-react'
import { consultarSaldo, type ConsultaResult } from './actions'
import { useFormStatus } from 'react-dom'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-[#1e3a8a] text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 transition-colors flex items-center justify-center gap-2"
        >
            <Search className="w-5 h-5" />
            {pending ? 'Consultando...' : 'Consultar Saldo'}
        </button>
    )
}

export default function ConsultaPage() {
    const [result, setResult] = useState<ConsultaResult | null>(null)

    async function handleConsultar(formData: FormData) {
        const res = await consultarSaldo(formData)
        setResult(res)
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col pt-6 px-4 items-center font-sans pb-6">
            <div className="flex flex-col items-center mb-6">
                <div className="bg-[#1e3a8a] p-3 rounded-xl shadow-sm mb-4">
                    <Building2 className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-[#1e3a8a] text-2xl font-bold tracking-tight">CondoSolución</h1>
            </div>

            <div className="w-full max-w-md space-y-5">
                <div className="text-center px-4 mb-4">
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Consulta de Saldo</h2>
                    <p className="text-slate-500 text-sm">
                        Ingresa tu número de cédula para consultar tu estado de cuenta actualizado.
                    </p>
                </div>

                {/* Card Tasa BCV */}
                <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#cbd5e1] p-2 rounded-full">
                            <Landmark className="w-5 h-5 text-[#334155]" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 tracking-wider">TASA BCV OFICIAL</p>
                            <p className="text-xl font-bold text-[#1e3a8a]">
                                {result?.tasaBcv ? result.tasaBcv.toFixed(2) : '36.50'} Bs/$
                            </p>
                        </div>
                    </div>
                    <span className="text-sm italic text-slate-400">Hoy</span>
                </div>

                {/* Formulario Consulta */}
                <form action={handleConsultar} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-800">
                            Documento de Identidad
                        </label>
                        <div className="flex gap-2">
                            <select
                                name="prefijo"
                                className="w-24 px-3 py-3 bg-white border border-slate-300 rounded-lg text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1em_1em] shadow-sm"
                                style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")` }}
                            >
                                <option value="V-">V-</option>
                                <option value="E-">E-</option>
                                <option value="J-">J-</option>
                                <option value="G-">G-</option>
                            </select>
                            <input
                                type="text"
                                name="numero"
                                required
                                pattern="[0-9]+"
                                placeholder="Ej. 12345678"
                                className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:ring-2 focus:ring-[#1e3a8a] placeholder-slate-400 shadow-sm"
                            />
                        </div>
                    </div>

                    {result?.error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                            {result.error}
                        </div>
                    )}

                    <SubmitButton />
                </form>

                {/* Resultados si no hay error y hay datos */}
                {result?.deudas && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-[#1e3a8a] text-white p-4 text-center">
                            <h3 className="font-semibold text-lg">Estado de Cuenta</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            {result.deudas.length > 0 ? (
                                result.deudas.map((d, i) => (
                                    <div key={i} className="flex justify-between items-center border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                                        <div>
                                            <p className="font-semibold text-slate-800">{d.condominio}</p>
                                            <p className="text-sm text-slate-500">Inmueble: {d.inmueble} ({d.mesesMora} meses)</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-red-600">${d.saldoUsd.toFixed(2)}</p>
                                            <p className="text-xs text-slate-400">Bs. {d.saldoBs.toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-green-600 font-medium">¡Estás al día! No tienes deudas pendientes.</p>
                                </div>
                            )}

                            {result.deudas.length > 0 && (
                                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                                    <span className="font-bold text-slate-800 uppercase text-sm">Total a Pagar</span>
                                    <div className="text-right">
                                        <p className="font-bold text-xl text-slate-900">${result.totalUsd?.toFixed(2)}</p>
                                        <p className="text-sm text-slate-500">Bs. {result.totalBs?.toFixed(2)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Accesos Rápidos (Botones Abajo) */}
                {!result?.deudas && (
                    <div className="grid grid-cols-2 gap-3 pt-3">
                        <button className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors shadow-sm">
                            <ReceiptIcon className="w-6 h-6 text-[#1e3a8a]" />
                            <span className="text-sm font-medium text-slate-700">Ver Recibos</span>
                        </button>
                        <button className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors shadow-sm">
                            <HeadphonesIcon className="w-6 h-6 text-[#1e3a8a]" />
                            <span className="text-sm font-medium text-slate-700">Soporte</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="mt-auto pt-6 pb-2 text-center space-y-2">
                <div className="text-sm font-medium text-slate-500 flex justify-center gap-4">
                    <a href="#" className="hover:text-slate-800 transition-colors">Términos</a>
                    <span className="text-slate-300">•</span>
                    <a href="#" className="hover:text-slate-800 transition-colors">Condiciones</a>
                    <span className="text-slate-300">•</span>
                    <a href="#" className="hover:text-slate-800 transition-colors">Privacidad</a>
                </div>
                <p className="text-xs text-slate-400">
                    © 2024 CondoSolución. Todos los derechos reservados.
                </p>
            </footer>
        </div>
    )
}
