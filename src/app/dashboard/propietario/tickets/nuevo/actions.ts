'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

export async function crearTicketAction(formData: FormData) {
    try {
        const supabase = await createClient()

        // --- ADMIN CLIENT PARALLEL ---
        const supabaseAdmin = createSupabaseAdmin(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const cookieStore = await cookies()
        const perfilId = cookieStore.get('propietario_token')?.value

        if (!perfilId) {
            return { error: 'Sesión no válida o expirada. Por favor, vuelve a iniciar sesión.' }
        }

        const asunto = formData.get('asunto') as string
        const descripcion = formData.get('descripcion') as string

        if (!asunto || !descripcion || asunto.length < 5 || descripcion.length < 10) {
            return { error: 'Por favor, proporciona un asunto y una descripción detallada.' }
        }

        // Obtener Condominio asociado al Perfil
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('condominio_id')
            .eq('id', perfilId)
            .single()

        if (!perfil) {
            return { error: 'No se encontró el condominio asociado.' }
        }

        const { error: insertError } = await supabaseAdmin
            .from('tickets_soporte')
            .insert({
                condominio_id: perfil.condominio_id,
                perfil_id: perfilId,
                asunto,
                descripcion,
                estado: 'abierto'
            })

        if (insertError) {
            console.error("Error al crear ticket:", insertError)
            return { error: 'Ocurrió un error al enviar el ticket.' }
        }

        // --- NOTIFICAR AL ADMIN ---
        await supabaseAdmin.from('notificaciones').insert({
            condominio_id: perfil.condominio_id,
            perfil_id: null,
            tipo: 'nuevo_ticket',
            titulo: 'Nuevo Reclamo Abierto',
            mensaje: `El residente ha abierto un ticket: ${asunto.substring(0, 50)}...`,
            enlace: '/dashboard/admin'
        })

    } catch (err: any) {
        return { error: 'Error inesperado.' }
    }

    revalidatePath('/dashboard/propietario/tickets')
    redirect('/dashboard/propietario/tickets?success=ticket_creado')
}
