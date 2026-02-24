import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Settings, LogOut, User, Building } from 'lucide-react'
import TablonCard from './TablonCard'
import CuentasCard from './CuentasCard'
import TasaBcvWidget from './TasaBcvWidget'
import CartaResidenciaCard from './CartaResidenciaCard'
import { signOutAction } from '@/app/auth/actions'

export default async function AdminAjustesPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return (
            <div className="p-5 text-center text-slate-500">
                Sesión no iniciada. <Link href="/login" className="text-blue-600 underline">Ir al Login</Link>
            </div>
        )
    }

    // Obtener condominio y perfil del Admin
    const { data: adminPerfil } = await supabase
        .from('perfiles')
        .select(`
            *,
            condominios:condominio_id ( nombre, direccion, anuncio_tablon, cuentas_bancarias, carta_residencia_url )
        `)
        .eq('auth_user_id', user.id)
        .eq('rol', 'admin')
        .single()

    const condominioData = adminPerfil?.condominios as any;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="px-5 py-6 bg-white border-b border-slate-200 sticky top-0 z-40">
                <h1 className="text-2xl font-bold text-[#1e3a8a]">Ajustes de Perfil</h1>
                <p className="text-slate-500 text-sm mt-1">Configuración Administrativa</p>
            </header>

            <div className="p-5 space-y-6">
                {/* Perfil Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 w-full h-24 bg-gradient-to-r from-blue-900 to-[#1e3a8a]" />

                    <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-md relative z-10 flex items-center justify-center mt-8">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                            <User className="w-8 h-8" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-800 mt-4">{adminPerfil?.nombres} {adminPerfil?.apellidos}</h2>
                    <p className="text-slate-500 text-sm">{user.email}</p>

                    <span className="mt-3 bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-[10px] tracking-widest uppercase shadow-sm">
                        Administrador Oficial
                    </span>
                </div>

                {/* Condominio Card */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center">
                            <Building className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">CONDOMINIO ADMINISTRADO</p>
                            <h3 className="font-bold text-slate-800 text-lg">
                                {/* @ts-ignore */}
                                {adminPerfil?.condominios?.nombre || 'Condominio Central'}
                            </h3>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-medium">
                        {/* @ts-ignore */}
                        {adminPerfil?.condominios?.direccion || 'Dirección no configurada'}
                    </div>
                </div>

                {/* --- NUEVAS SECCIONES DE CONFIGURACIÓN (FASE 15) --- */}
                <div className="pt-4 space-y-6">
                    <h2 className="text-xl font-bold text-[#1e3a8a] flex items-center gap-2">
                        <Settings className="w-6 h-6" /> Parámetros Globales
                    </h2>

                    {/* Tasa BCV Oficial */}
                    <TasaBcvWidget />

                    {/* Tablón de Anuncios */}
                    <TablonCard anuncioActual={condominioData?.anuncio_tablon || null} />

                    {/* Carta de Residencia */}
                    <CartaResidenciaCard urlActual={condominioData?.carta_residencia_url || null} />

                    {/* Cuentas Bancarias */}
                    <CuentasCard cuentasIniciales={condominioData?.cuentas_bancarias || []} />
                </div>
                {/* --------------------------------------------------- */}

                {/* Salir */}
                <form action={signOutAction} className="pt-8">
                    <button type="submit" className="w-full flex justify-center items-center gap-2 bg-red-50 text-red-600 font-semibold p-4 rounded-2xl hover:bg-red-100 hover:text-red-700 transition border border-red-100">
                        <LogOut className="w-5 h-5" />
                        Cerrar Sesión Administrador
                    </button>
                </form>
            </div>
        </div>
    )
}
