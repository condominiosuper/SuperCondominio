'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function guardarAnuncioAction(formData: FormData) {
    try {
        const supabase = await createClient()

        // 1. Validar Administrador y Obtener Condominio
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'No autorizado' }

        const { data: adminPerfil } = await supabase
            .from('perfiles')
            .select('condominio_id')
            .eq('auth_user_id', user.id)
            .eq('rol', 'admin')
            .single()

        if (!adminPerfil) return { error: 'Perfil de admin no encontrado' }

        const nuevoAnuncio = formData.get('anuncio') as string
        const textoLimpio = nuevoAnuncio?.trim() || null // Si envía vacío, limpiamos el tablón

        // 2. Actualizar Tabla Condominios
        const { error } = await supabase
            .from('condominios')
            .update({ anuncio_tablon: textoLimpio })
            .eq('id', adminPerfil.condominio_id)

        if (error) {
            console.error(error)
            return { error: 'Error al actualizar el tablón.' }
        }

        revalidatePath('/dashboard/admin/ajustes')
        revalidatePath('/dashboard/propietario') // Refrescar vista del inquilino
        return { success: true }
    } catch (err) {
        return { error: 'Error inesperado.' }
    }
}

export async function guardarCuentasAction(cuentasJson: any[]) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'No autorizado' }

        const { data: adminPerfil } = await supabase
            .from('perfiles')
            .select('condominio_id')
            .eq('auth_user_id', user.id)
            .eq('rol', 'admin')
            .single()

        if (!adminPerfil) return { error: 'Perfil no encontrado' }

        const { error } = await supabase
            .from('condominios')
            .update({ cuentas_bancarias: cuentasJson })
            .eq('id', adminPerfil.condominio_id)

        if (error) {
            console.error(error)
            return { error: 'Error al guardar cuentas.' }
        }

        revalidatePath('/dashboard/admin/ajustes')
        return { success: true }
    } catch (err) {
        return { error: 'Error inesperado.' }
    }
}

export async function subirCartaResidenciaAction(formData: FormData) {
    try {
        const supabase = await createClient()

        // 1. Validar Admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autorizado' }

        const { data: adminPerfil } = await supabase
            .from('perfiles')
            .select('id, condominio_id')
            .eq('auth_user_id', user.id)
            .eq('rol', 'admin')
            .single()

        if (!adminPerfil) return { success: false, error: 'Perfil no encontrado' }

        // 2. Extraer archivo
        const archivo = formData.get('documento') as File
        if (!archivo || archivo.size === 0) {
            return { success: false, error: 'Debe adjuntar un archivo válido.' }
        }

        // 3. Subir archivo a Storage (documentos)
        const fileExt = archivo.name.split('.').pop()
        // Usamos el ID del condominio para que sobrescriba el viejo y no acumule basura
        const fileName = `carta-residencia-${adminPerfil.condominio_id}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('documentos')
            .upload(fileName, archivo, {
                cacheControl: '3600',
                upsert: true
            })

        if (uploadError) {
            console.error("Storage Error:", uploadError)
            return { success: false, error: 'Error al subir el documento.' }
        }

        // 4. Obtener URL Pública
        const { data: publicUrlData } = supabase.storage
            .from('documentos')
            .getPublicUrl(fileName)

        const fileUrl = publicUrlData.publicUrl

        // 5. Insertar URL en condominios
        const { error: updateError } = await supabase
            .from('condominios')
            .update({ carta_residencia_url: fileUrl })
            .eq('id', adminPerfil.condominio_id)

        if (updateError) {
            console.error(updateError)
            return { success: false, error: 'Error al actualizar base de datos.' }
        }

        revalidatePath('/dashboard/admin/ajustes')
        revalidatePath('/dashboard/propietario/perfil')
        return { success: true }
    } catch (err: any) {
        return { success: false, error: 'Error inesperado al subir el documento.' }
    }
}
