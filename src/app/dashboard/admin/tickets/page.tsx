import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Ticket } from 'lucide-react'
import AdminTicketCard from './AdminTicketCard'

export default async function AdminTicketsPage() {
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

    // Cargar Tickets (abiertos o en proceso)
    const { data: tickets, error } = await supabase
        .from('tickets_soporte')
        .select(`
            *,
            perfiles:autor_id (
                nombres,
                apellidos,
                inmuebles ( identificador )
            )
        `)
        .eq('condominio_id', adminPerfil.condominio_id)
        .in('estado', ['abierto', 'en_proceso', 'resuelto'])
        .order('estado', { ascending: true }) // abierto primero (alfabéticamente a/e/r)
        .order('created_at', { ascending: false })

    const totalPendientes = tickets?.filter(t => t.estado !== 'resuelto').length || 0;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="px-5 py-4 flex items-center justify-between border-b border-slate-200 bg-white sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/admin" className="p-2 border border-slate-200 rounded-full text-slate-500 hover:bg-slate-50 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-lg font-bold text-[#1e3a8a]">Centro de Soporte</h1>
                </div>
            </header>

            <div className="px-5 pt-6 max-w-lg mx-auto">
                <div className="bg-white border flex items-center gap-4 border-slate-200 p-6 rounded-2xl shadow-sm mb-6">
                    <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center shrink-0">
                        <MessageSquare className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{totalPendientes} Tickets Activos</h2>
                        <p className="text-sm text-slate-500 mt-1">Reclamos y solicitudes pendientes por responder en el edificio.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(!tickets || tickets.length === 0) ? (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                                <Ticket className="w-8 h-8" />
                            </div>
                            <h3 className="text-slate-800 font-bold mb-2">Bandeja Vacía</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                No hay tickets de soporte creados por los residentes de este condominio.
                            </p>
                        </div>
                    ) : (
                        tickets.map((ticket) => (
                            <AdminTicketCard key={ticket.id} ticket={ticket} />
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
