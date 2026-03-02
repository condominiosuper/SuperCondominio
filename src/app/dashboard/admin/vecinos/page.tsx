import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Users, Building, Mail, Phone, ArrowLeft, UserPlus, Home } from 'lucide-react'
import VecinoActions from './VecinoActions'
import InmuebleEditableInfo from './InmuebleEditableInfo'
import RegistroMasivoVecinos from './RegistroMasivoVecinos'
import { getAdminProfile } from '@/utils/supabase/admin-helper'

export default async function AdminVecinosPage() {
    const { user, profile: adminPerfil } = await getAdminProfile()
    const supabase = await createClient()

    if (!user) {
        return (
            <div className="p-5 text-center text-slate-500">
                Sesión no iniciada. <Link href="/login" className="text-blue-600 underline">Ir al Login</Link>
            </div>
        )
    }

    if (!adminPerfil) {
        return <div className="p-5 text-red-500">Error: Perfil Admin no encontrado.</div>
    }

    // Obtener inmuebles y perfiles (vecinos)
    const { data: inmuebles, error } = await supabase
        .from('inmuebles')
        .select(`
            id,
            identificador,
            propietario:perfiles (
                id,
                nombres,
                apellidos,
                telefono,
                auth_user_id 
            )
        `)
        .eq('condominio_id', adminPerfil.condominio_id)
        .order('identificador', { ascending: true })

    if (error) {
        console.error('Error fetching inmuebles:', JSON.stringify(error, null, 2))
    }

    const inmueblesVancantes = inmuebles?.filter(i => !i.propietario) || []

    return (
        <div className="min-h-screen bg-slate-50 pb-20 pt-32 lg:pt-36">
            {/* Header Rediseñado y Fixed */}
            <div className="fixed top-0 left-0 right-0 md:left-72 z-50 bg-[#1e3a8a] text-white pt-12 pb-6 px-1 rounded-b-[2rem] shadow-xl border-b border-white/10 transition-shadow duration-300">
                <div className="flex justify-between items-center max-w-md md:max-w-4xl lg:max-w-5xl xl:max-w-7xl mx-auto px-5 md:px-0">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/admin" className="p-2 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/20">
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter leading-none">Directorio Vecinal</h1>
                            <p className="text-blue-100/60 text-[10px] font-black uppercase tracking-widest mt-1.5">Gestión de Inmuebles</p>
                        </div>
                    </div>
                    <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10 hidden md:block">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                </div>
            </div>

            <div className="px-5 space-y-6">
                {/* Nueva Sección Unificada de Alta (Individual + Excel) */}
                <RegistroMasivoVecinos inmueblesVacantes={inmueblesVancantes} />

                <div className="bg-white border text-center border-slate-200 p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="text-left">
                            <h2 className="text-xl font-bold text-slate-800">{inmuebles?.length || 0} Inmuebles</h2>
                            <p className="text-sm text-slate-500 mt-1">Inventario total registrado</p>
                        </div>
                        <Home className="w-8 h-8 text-blue-200" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(!inmuebles || inmuebles.length === 0) ? (
                        <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                            <Building className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No hay inmuebles registrados todavía.</p>
                            <p className="text-slate-400 text-sm">Utiliza el formulario superior para añadir el primero.</p>
                        </div>
                    ) : (
                        inmuebles.map((inmueble) => {
                            const prop: any = Array.isArray(inmueble.propietario) ? inmueble.propietario[0] : inmueble.propietario;

                            return (
                                <div key={inmueble.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-blue-200 transition-colors">
                                    {/* Cabecera del Inmueble (Editable - Fase 31) */}
                                    <InmuebleEditableInfo
                                        inmuebleId={inmueble.id}
                                        identificadorInicial={inmueble.identificador}
                                    />

                                    {prop ? (
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 group relative mb-4">
                                            <p className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                                                {prop.nombres} {prop.apellidos}
                                            </p>

                                            {prop.telefono && (
                                                <p className="text-xs text-slate-500 flex items-center gap-2">
                                                    <Phone className="w-3 h-3" /> {prop.telefono}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 text-orange-600 text-[11px] font-bold uppercase tracking-wide flex items-center gap-2 mb-4">
                                            <Users className="w-4 h-4 opacity-70" />
                                            Inmueble Desocupado
                                        </div>
                                    )}

                                    {/* Componente Cliente para Acciones (Fase 30) */}
                                    <VecinoActions
                                        inmuebleId={inmueble.id}
                                        perfilId={prop?.id}
                                        tienePropietario={!!prop}
                                    />
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
