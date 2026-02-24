'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function signOutAction() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    const cookieStore = await cookies()
    cookieStore.delete('propietario_token') // Importante limpiar el token también
    redirect('/login')
}

export async function validarCedula(formData: FormData) {
    const prefijo = formData.get('prefijo') as string
    const numero = formData.get('numero') as string
    const cedula = `${prefijo}${numero}`

    const supabase = await createClient()

    // 1. Validar a qué user está asociado este inicio de sesión
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Sesión no válida o expirada.' }
    }

    // 2. Buscar si la cédula ingresada corresponde a ALGUIEN dentro de los perfiles
    // vinculados al mismo condominio principal del user logueado.

    // Obtenemos el condominio del 'vecino general' logueado
    const { data: mainProfile } = await supabase
        .from('perfiles')
        .select('condominio_id')
        .eq('auth_user_id', user.id)
        .limit(1)
        .single()

    if (!mainProfile) {
        return { error: 'No se encontró condominio asociado a esta cuenta base.' }
    }

    // Ahora validamos la cédula exactamente dentro de ese condominio
    const { data: perfilOwner } = await supabase
        .from('perfiles')
        .select('id')
        .eq('condominio_id', mainProfile.condominio_id)
        .eq('cedula', cedula)
        .limit(1)
        .single()

    if (!perfilOwner) {
        return { error: 'No se encontró un propietario con esa cédula en este Condominio.' }
    }

    // 3. Crear la cookie con el ID del perfil y redirigir al Dashboard Real
    const cookieStore = await cookies()
    cookieStore.set('propietario_token', perfilOwner.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    })

    redirect('/dashboard/propietario')
}
