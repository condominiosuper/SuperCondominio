import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Users, Building, Mail, Phone } from 'lucide-react'

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
            alicuota,
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

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header Rediseñado */}
            <div className="bg-[#1e3a8a] text-white px-6 pt-12 pb-6 rounded-b-3xl shadow-md sticky top-0 z-40">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Directorio Vecinal</h1>
                        <p className="text-blue-100/80 text-sm mt-1">Gestión de Inmuebles y Propietarios</p>
                    </div>
                    <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                </div>
            </div>

            <div className="px-5 mt-6 space-y-4">
                <div className="bg-white border text-center border-slate-200 p-6 rounded-2xl shadow-sm mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-left">
                            <h2 className="text-xl font-bold text-slate-800">{inmuebles?.length || 0} Inmuebles</h2>
                            <p className="text-sm text-slate-500 mt-1">Registrados en el sistema</p>
                        </div>
                        <Building className="w-8 h-8 text-blue-200" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
                    {(!inmuebles || inmuebles.length === 0) ? (
                        <p className="text-center text-slate-500">No hay inmuebles registrados.</p>
                    ) : (
                        inmuebles.map((inmueble) => {
                            const prop: any = Array.isArray(inmueble.propietarios) ? inmueble.propietarios[0] : inmueble.propietarios;

                            return (<div key={inmueble.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                        <Building className="w-5 h-5 text-[#1e3a8a]" />
                                        <h3 className="font-bold text-slate-800 text-lg">{inmueble.identificador}</h3>
                                    </div>
                                    <span className="bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded text-xs tracking-wider border border-slate-200">
                                        Alícuota: {inmueble.alicuota}
                                    </span>
                                </div>

                                {prop ? (
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <p className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                                            <Users className="w-4 h-4 text-slate-400" />
                                            {prop.nombres} {prop.apellidos}
                                        </p>

                                        {prop.telefono && (
                                            <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                                <Phone className="w-3 h-3" /> {prop.telefono}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-orange-600 text-sm font-medium flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Inmueble Desocupado / Sin registro
                                    </div>
                                )}
                            </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
