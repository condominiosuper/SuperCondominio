import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import NotificacionesClientList from '@/components/NotificacionesClientList'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const metadata = {
    title: 'Notificaciones | SUPERcondominio',
    description: 'Buzón de notificaciones del propietario',
}

export default async function PropietarioNotificacionesPage() {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const perfilId = cookieStore.get('propietario_token')?.value

    if (!perfilId) {
        redirect('/dashboard/propietario/validar')
    }

    const { data: perfil } = await supabase
        .from('perfiles')
        .select('condominio_id')
        .eq('id', perfilId)
        .single()

    if (!perfil) redirect('/dashboard/propietario/validar')

    // Cargar notificaciones
    const { data: notificaciones } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('condominio_id', perfil.condominio_id)
        .eq('perfil_id', perfilId)
        .order('created_at', { ascending: false })

    return (
        <div className="pb-24 lg:pb-8 min-h-screen bg-slate-50 relative">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <Link href="/dashboard/propietario" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors border border-transparent mr-2">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Centro de Notificaciones</h1>
                        <p className="text-xs text-slate-500 font-medium hidden sm:block">Avisos y reportes sobre tu inmueble.</p>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                <NotificacionesClientList
                    initialNotificaciones={notificaciones || []}
                    condominioId={perfil.condominio_id}
                    perfilId={perfilId}
                />
            </main>
        </div>
    )
}
