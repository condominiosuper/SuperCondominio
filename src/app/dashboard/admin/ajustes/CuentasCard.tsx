'use client'

import { useState, useEffect } from 'react'
import { guardarCuentasAction } from './actions'
import { Landmark, Plus, Trash2, Save } from 'lucide-react'

export default function CuentasCard({ cuentasIniciales }: { cuentasIniciales: any[] }) {
    const [cuentas, setCuentas] = useState<any[]>(cuentasIniciales || [])
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Estado del formulario interno
    const [nuevoBanco, setNuevoBanco] = useState('')
    const [nuevoTitular, setNuevoTitular] = useState('')
    const [nuevoNumero, setNuevoNumero] = useState('')
    const [tipoCuenta, setTipoCuenta] = useState('Pago Móvil / Transferencia')

    console.log('CuentasCard Render - Props:', cuentasIniciales, 'State:', cuentas)

    async function agregarCuenta() {
        if (!nuevoBanco || !nuevoTitular || !nuevoNumero) {
            setError('Todos los campos son obligatorios para añadir la cuenta.')
            setTimeout(() => setError(null), 3000)
            return;
        }

        const nueva = {
            id: Date.now().toString(),
            banco: nuevoBanco,
            titular: nuevoTitular,
            numero: nuevoNumero,
            tipo: tipoCuenta
        }

        const nuevasCuentas = [...cuentas, nueva]
        setCuentas(nuevasCuentas)
        setNuevoBanco('')
        setNuevoTitular('')
        setNuevoNumero('')

        // Auto-guardado
        await guardarCambios(nuevasCuentas)
    }

    async function eliminarCuenta(id: string) {
        const filtradas = cuentas.filter(c => c.id !== id)
        setCuentas(filtradas)

        // Auto-guardado
        await guardarCambios(filtradas)
    }

    async function guardarCambios(listaCuentas: any[]) {
        console.log('Intentando guardar cuentas:', listaCuentas)
        setLoading(true)
        setError(null)
        setSuccess(false)

        const res = await guardarCuentasAction(listaCuentas)
        console.log('Resultado del guardado:', res)

        if (res?.error) {
            setError(res.error)
        } else {
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        }
        setLoading(false)
    }

    return (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <Landmark className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-lg">Cuentas Bancarias</h3>
                    <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Visible en pagos de inquilinos</p>
                </div>
            </div>

            {/* Listado Actual */}
            <div className="space-y-3 mb-6">
                {cuentas.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        No hay cuentas configuradas.
                    </p>
                ) : (
                    cuentas.map((cuenta) => (
                        <div key={cuenta.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <div className="min-w-0 pr-4">
                                <p className="font-bold text-slate-800 text-sm truncate">{cuenta.banco}</p>
                                <p className="text-xs text-slate-500 truncate">{cuenta.numero} • {cuenta.titular}</p>
                            </div>
                            <button
                                onClick={() => eliminarCuenta(cuenta.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Añadir Nueva */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Agregar Nueva Cuenta</h4>

                <input
                    type="text"
                    placeholder="Banco (Ej: Banco Provincial, Zelle...)"
                    value={nuevoBanco}
                    onChange={(e) => setNuevoBanco(e.target.value)}
                    className="w-full text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <input
                    type="text"
                    placeholder="Titular (Ej: Condominio Las Rosas, J-12345)"
                    value={nuevoTitular}
                    onChange={(e) => setNuevoTitular(e.target.value)}
                    className="w-full text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <input
                    type="text"
                    placeholder="Número de Cuenta o Teléfono Pago Móvil"
                    value={nuevoNumero}
                    onChange={(e) => setNuevoNumero(e.target.value)}
                    className="w-full text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />

                <button
                    onClick={agregarCuenta}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                >
                    {loading ? <Plus className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {loading ? 'Guardando...' : 'Añadir a la lista'}
                </button>
            </div>

            {/* Estado del Auto-guardado */}
            <div className="mt-4 h-6">
                {error && <p className="text-xs text-red-500 font-medium text-center">{error}</p>}
                {success && <p className="text-xs text-emerald-600 font-medium text-center flex items-center justify-center gap-1">
                    <Save className="w-3 h-3" /> ¡Cambios guardados automáticamente!
                </p>}
            </div>
        </div>
    )
}
