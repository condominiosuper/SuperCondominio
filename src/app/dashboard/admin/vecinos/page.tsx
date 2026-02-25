import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Users, Building, Mail, Phone, ArrowLeft, UserPlus, Home } from 'lucide-react'
import VecinoActions from './VecinoActions'
import InmuebleEditableInfo from './InmuebleEditableInfo'
import RegistroMasivoVecinos from './RegistroMasivoVecinos'

export default async function AdminVecinosPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return (
            <div className="p-5 text-center text-slate-500">
                Sesión no iniciada. <Link href="/login" className="text-blue-600 underline">Ir al Login</Link>
            </div>
        )
    }

    // Obtener condominio del Admin
    const { data: adminPerfil } = await supabase
        .from('perfiles')
        .select('condominio_id')
        .eq('auth_user_id', user.id)
        .eq('rol', 'admin')
        .single()

    if (!adminPerfil) {
        return <div className="p-5 text-red-500">Error: Perfil Admin no encontrado.</div>
    }

    // Obtener inmuebles y perfiles (vecinos)
    const { data: inmuebles, error } = await supabase
        .from('inmuebles')
        .select(`
            id,
            identificador,
            propietarios:propietario_id (
                id,
                nombres,
                apellidos,
                telefono,
                auth_user_id 
            )
        `)
        .eq('condominio_id', adminPerfil.condominio_id)
        .order('identificador', { ascending: true })

    const inmueblesVancantes = inmuebles?.filter(i => !i.propietarios) || []

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header Rediseñado */}
            <div className="bg-[#1e3a8a] text-white px-6 pt-12 pb-6 rounded-b-3xl shadow-md sticky top-0 z-40">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/admin" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Directorio Vecinal</h1>
                            <p className="text-blue-100/80 text-sm mt-1">Gestión de Inmuebles y Propietarios</p>
                        </div>
                    </div>
                    <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                </div>
            </div>

            <div className="px-5 mt-6 space-y-6">
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
                            const prop: any = Array.isArray(inmueble.propietarios) ? inmueble.propietarios[0] : inmueble.propietarios;

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
