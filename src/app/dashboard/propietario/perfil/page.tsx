import { User, CreditCard, Shield, HelpCircle, LogOut, ChevronRight, FileText, Download } from 'lucide-react'
import { signOutAction } from '@/app/auth/actions'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function PerfilPropietarioPage() {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const perfilId = cookieStore.get('propietario_token')?.value

    let condominioData = null;

    if (perfilId) {
        const { data: perfil } = await supabase
            .from('perfiles')
            .select(`
                condominios ( nombre, carta_residencia_url )
            `)
            .eq('id', perfilId)
            .single()

        condominioData = perfil?.condominios as any;
    }

    return (
        <div className="relative pb-10">
            {/* Header Propietario */}
            <header className="bg-[#1e3a8a] px-5 pt-10 pb-16 flex items-center justify-center relative rounded-b-[40px]">
                <h1 className="text-xl font-bold text-white z-10">Mi Perfil</h1>
            </header>

            <div className="px-5 space-y-6 -mt-10 relative z-20">

                {/* Tarjeta de Usuario */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <User className="w-10 h-10 text-slate-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Propietario Activo</h2>
                    <p className="text-sm text-slate-500 font-medium">Torre Principal</p>
                    <span className="mt-3 bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        Solvente
                    </span>
                </div>

                {/* Carta de Residencia */}
                {condominioData?.carta_residencia_url && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between hover:border-slate-300 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#1e3a8a]/5 text-[#1e3a8a] rounded-xl flex items-center justify-center border border-[#1e3a8a]/10">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-[15px]">Carta de Residencia</h3>
                                <p className="text-sm text-slate-500">Descargar documento PDF</p>
                            </div>
                        </div>
                        <a
                            href={condominioData.carta_residencia_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 bg-slate-50 text-slate-600 hover:text-[#1e3a8a] hover:bg-[#1e3a8a]/5 rounded-xl transition-all border border-slate-200"
                        >
                            <Download className="w-5 h-5" />
                        </a>
                    </div>
                )}

                {/* Opciones */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <Link href="/dashboard/propietario/pagos/nuevo" className="px-4 py-4 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors w-full">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-slate-700">Métodos de Pago</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                    </Link>

                    <Link href="/dashboard/propietario/perfil" className="px-4 py-4 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors w-full">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                                <Shield className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-slate-700">Privacidad y Seguridad</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                    </Link>

                    <Link href="/dashboard/propietario/tickets" className="px-4 py-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors w-full">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                <HelpCircle className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-slate-700">Soporte y Ayuda</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                    </Link>
                </div>

                {/* Botón Salir */}
                <form action={signOutAction} className="pt-2">
                    <button
                        type="submit"
                        className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-xl p-4 flex items-center justify-center gap-2 font-bold transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        Cerrar Sesión
                    </button>
                </form>

            </div>
        </div>
    )
}
