'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function responderTicketAction(formData: FormData) {
    try {
        const supabase = await createClient()

        const ticketId = formData.get('ticket_id') as string
        const respuesta = formData.get('respuesta') as string

        if (!ticketId || !respuesta || respuesta.length < 5) {
            return { error: 'La respuesta no puede estar vacía.' }
        }

        const { error } = await supabase
            .from('tickets_soporte')
            .update({
                respuesta_admin: respuesta,
                estado: 'resuelto'
            })
            .eq('id', ticketId)

        if (error) {
            console.error("Error al responder ticket:", error)
            return { error: 'Error en la base de datos al responder el ticket.' }
        }

        // --- NOTIFICAR AL PROPIETARIO ---
        const { data: ticket } = await supabase
            .from('tickets_soporte')
            .select('condominio_id, perfil_id, asunto')
            .eq('id', ticketId)
            .single()

        if (ticket && ticket.perfil_id) {
            await supabase.from('notificaciones').insert({
                condominio_id: ticket.condominio_id,
                perfil_id: ticket.perfil_id,
                tipo: 'ticket_respuesta',
                titulo: 'Respuesta de Administración',
                mensaje: `Han respondido a tu reporte de Soporte: ${ticket.asunto.substring(0, 50)}...`,
                enlace: '/dashboard/propietario/tickets'
            })
        }

        revalidatePath('/dashboard/admin/tickets')
        return { success: true }
    } catch (err: any) {
        return { error: 'Error inesperado.' }
    }
}
