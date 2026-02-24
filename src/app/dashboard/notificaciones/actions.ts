'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function marcarNotificacionLeidaAction(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('id', id)

    if (error) {
        console.error("Error al marcar notificación como leída", error)
        return { success: false, error: 'Hubo un error de base de datos.' }
    }

    revalidatePath('/dashboard/admin/notificaciones')
    revalidatePath('/dashboard/propietario/notificaciones')
    revalidatePath('/dashboard/admin', 'layout')
    revalidatePath('/dashboard/propietario', 'layout')

    return { success: true }
}

export async function eliminarNotificacionAction(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('notificaciones')
        .delete()
        .eq('id', id)

    if (error) {
        console.error("Error al eliminar notificación", error)
        return { success: false, error: 'Hubo un error al eliminarla.' }
    }

    revalidatePath('/dashboard/admin/notificaciones')
    revalidatePath('/dashboard/propietario/notificaciones')
    revalidatePath('/dashboard/admin', 'layout')
    revalidatePath('/dashboard/propietario', 'layout')

    return { success: true }
}

export async function marcarTodasLeidasAction(condominio_id: string, perfil_id: string | null = null) {
    const supabase = await createClient()

    let query = supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('condominio_id', condominio_id)
        .eq('leida', false)

    if (perfil_id) {
        query = query.eq('perfil_id', perfil_id)
    } else {
        query = query.is('perfil_id', null)
    }

    const { error } = await query

    if (error) {
        return { success: false, error: 'Hubo un error de base de datos.' }
    }

    revalidatePath('/dashboard/admin/notificaciones')
    revalidatePath('/dashboard/propietario/notificaciones')
    revalidatePath('/dashboard/admin', 'layout')
    revalidatePath('/dashboard/propietario', 'layout')

    return { success: true }
}
