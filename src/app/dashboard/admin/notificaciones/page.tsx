import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import NotificacionesClientList from '@/components/NotificacionesClientList'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const metadata = {
    title: 'Notificaciones Administrativas | SUPERcondominio',
    description: 'Buzón de notificaciones del administrador',
}

export default async function AdminNotificacionesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Obtener condominio del admin
    const { data: adminPerfil } = await supabase
        .from('perfiles')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

    if (!adminPerfil || adminPerfil.rol !== 'admin') {
        redirect('/login')
    }

    // Cargar notificaciones para administradores (perfil_id IS NULL)
    const { data: notificaciones } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('condominio_id', adminPerfil.condominio_id)
        .is('perfil_id', null)
        .order('created_at', { ascending: false })

    return (
        <div className="pb-24 lg:pb-8 min-h-screen bg-slate-50 relative">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <Link href="/dashboard/admin" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors border border-transparent mr-2">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Centro de Alertas (Admin)</h1>
                        <p className="text-xs text-slate-500 font-medium hidden sm:block">Avisos generales y reportes de vecinos.</p>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                <NotificacionesClientList
                    initialNotificaciones={notificaciones || []}
                    condominioId={adminPerfil.condominio_id}
                // No pasamos perfilId porque estas notif. son para el rol admin colectivo
                />
            </main>
        </div>
    )
}
