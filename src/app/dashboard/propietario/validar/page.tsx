'use client'

import { Building2, Search } from 'lucide-react'
import { validarCedula } from '@/app/auth/actions'
import { useFormStatus } from 'react-dom'
import { useState, use } from 'react'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-[#1e3a8a] text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 transition-colors flex items-center justify-center gap-2"
        >
            <Search className="w-5 h-5" />
            {pending ? 'Validando...' : 'Entrar al Panel'}
        </button>
    )
}

export default function ValidarPropietarioPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedParams = use(searchParams)
    const [errorLocal, setErrorLocal] = useState<string | null>(null)

    async function handleValidar(formData: FormData) {
        const res = await validarCedula(formData)
        if (res?.error) {
            setErrorLocal(res.error)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col pt-16 px-4 items-center font-sans pb-12">
            <div className="flex flex-col items-center mb-10 text-center">
                <div className="bg-[#1e3a8a] p-3 rounded-xl shadow-sm mb-4">
                    <Building2 className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-[#1e3a8a] text-2xl font-bold tracking-tight mb-2">CondoSolución</h1>
                {resolvedParams.condominioNombre ? (
                    <p className="text-slate-500 font-medium">Vecinos de {resolvedParams.condominioNombre as string}</p>
                ) : (
                    <p className="text-slate-500 font-medium">Verificación de Propietario</p>
                )}
            </div>

            <div className="w-full max-w-md space-y-6">
                <div className="text-center px-4 mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Ingresa tu Cédula</h2>
                    <p className="text-slate-500 text-sm">
                        Estás accediendo a la cuenta general del condominio. Ingresa tu cédula de propietario para ver tu cuenta individual.
                    </p>
                </div>

                {/* Formulario Consulta */}
                <form action={handleValidar} className="space-y-6">
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

                    {errorLocal && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                            {errorLocal}
                        </div>
                    )}

                    <SubmitButton />
                </form>
            </div>
        </div>
    )
}
