'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function crearAnuncioAction(formData: FormData) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { error: 'No autorizado' }

        const { data: adminPerfil } = await supabase
            .from('perfiles')
            .select('id, condominio_id')
            .eq('auth_user_id', user.id)
            .eq('rol', 'admin')
            .single()

        if (!adminPerfil) return { error: 'Perfil no encontrado' }

        const titulo = formData.get('titulo') as string
        const contenido = formData.get('contenido') as string
        const categoria = formData.get('categoria') as string
        const fijado = formData.get('fijado') === 'on'

        if (!titulo || !contenido) return { error: 'Faltan campos obligatorios' }

        const { error: insertError } = await supabase
            .from('cartelera_anuncios')
            .insert({
                condominio_id: adminPerfil.condominio_id,
                autor_id: adminPerfil.id,
                titulo,
                contenido,
                categoria: categoria || 'General',
                fijado
            })

        if (insertError) {
            console.error(insertError)
            return { error: 'Ocurrió un error en la base de datos al publicar.' }
        }

        // --- NOTIFICAR A PROPIETARIOS ---
        const { data: propietarios } = await supabase
            .from('perfiles')
            .select('id')
            .eq('condominio_id', adminPerfil.condominio_id)
            .eq('rol', 'propietario')

        if (propietarios && propietarios.length > 0) {
            const notifs = propietarios.map((p: any) => ({
                condominio_id: adminPerfil.condominio_id,
                perfil_id: p.id,
                tipo: 'nuevo_anuncio',
                titulo: 'Nuevo Aviso en Cartelera',
                mensaje: `La administración ha publicado un anuncio: ${titulo}`,
                enlace: '/dashboard/propietario#muro-vecinal'
            }))
            await supabase.from('notificaciones').insert(notifs)
        }

    } catch (err: any) {
        return { error: 'Ocurrió un error al publicar el anuncio.' }
    }

    revalidatePath('/dashboard/admin/anuncios')
    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/propietario')
    return { success: true }
}

export async function eliminarAnuncioAction(anuncioId: string) {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from('cartelera_anuncios')
            .delete()
            .eq('id', anuncioId)

        if (error) throw error
    } catch (err) {
        return { error: 'No se pudo eliminar el anuncio' }
    }
    revalidatePath('/dashboard/admin/anuncios')
    revalidatePath('/dashboard/propietario')
    return { success: true }
}

export async function toggleFijarAnuncioAction(anuncioId: string, currentState: boolean) {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from('cartelera_anuncios')
            .update({ fijado: !currentState })
            .eq('id', anuncioId)

        if (error) throw error
    } catch (err) {
        return { error: 'No se pudo actualizar el estado' }
    }
    revalidatePath('/dashboard/admin/anuncios')
    revalidatePath('/dashboard/propietario')
    return { success: true }
}
