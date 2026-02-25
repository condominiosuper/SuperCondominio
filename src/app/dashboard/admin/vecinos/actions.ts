'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function crearVecinoAction(formData: FormData) {
    try {
        const supabase = await createClient()

        // 1. Validar Admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autorizado' }

        const { data: adminPerfil } = await supabase
            .from('perfiles')
            .select('condominio_id')
            .eq('auth_user_id', user.id)
            .eq('rol', 'admin')
            .single()

        if (!adminPerfil) return { success: false, error: 'Perfil de admin no encontrado' }

        // 2. Extraer datos
        const cedula = formData.get('cedula') as string
        const nombres = formData.get('nombres') as string
        const apellidos = formData.get('apellidos') as string
        const telefono = formData.get('telefono') as string
        const inmuebleId = formData.get('inmueble_id') as string // Opcional al crear

        if (!cedula || !nombres || !apellidos) {
            return { success: false, error: 'Cédula, Nombres y Apellidos son requeridos.' }
        }

        // 3. Obtener el auth_user_id compartido del condominio (buscando un vecino existente)
        const { data: otroVecino } = await supabase
            .from('perfiles')
            .select('auth_user_id')
            .eq('condominio_id', adminPerfil.condominio_id)
            .eq('rol', 'propietario')
            .not('auth_user_id', 'is', null)
            .limit(1)
            .single()

        const sharedAuthId = otroVecino?.auth_user_id || null

        // 4. Crear Perfil
        const { data: nuevoPerfil, error: errorPerfil } = await supabase
            .from('perfiles')
            .insert({
                condominio_id: adminPerfil.condominio_id,
                rol: 'propietario',
                nombres,
                apellidos,
                cedula,
                telefono,
                auth_user_id: sharedAuthId
            })
            .select()
            .single()

        if (errorPerfil) {
            console.error("Error al crear perfil:", errorPerfil)
            return { success: false, error: 'Error al crear el perfil del vecino.' }
        }

        // 5. Vincular con inmueble si se especificó
        if (inmuebleId && nuevoPerfil) {
            const { error: errorInmueble } = await supabase
                .from('inmuebles')
                .update({ propietario_id: nuevoPerfil.id })
                .eq('id', inmuebleId)

            if (errorInmueble) {
                console.error("Error al vincular inmueble:", errorInmueble)
            }
        }

        revalidatePath('/dashboard/admin/vecinos')
        return { success: true }
    } catch (err) {
        return { success: false, error: 'Error inesperado.' }
    }
}

export async function eliminarVecinoAction(perfilId: string) {
    try {
        const supabase = await createClient()

        // 1. Validar Admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autorizado' }

        // 2. Eliminar
        // Nota: El RLS debería proteger esto, pero lo hacemos explícito
        const { error } = await supabase
            .from('perfiles')
            .delete()
            .eq('id', perfilId)
            // No permitimos que un admin se borre a sí mismo desde aquí por error
            .eq('rol', 'propietario')

        if (error) {
            console.error("Error al eliminar vecino:", error)
            return { success: false, error: 'No se pudo eliminar al vecino. Asegúrate de que no tenga registros vinculados bloqueantes.' }
        }

        revalidatePath('/dashboard/admin/vecinos')
        return { success: true }
    } catch (err) {
        return { success: false, error: 'Error inesperado.' }
    }
}

export async function desvincularInmuebleAction(inmuebleId: string) {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('inmuebles')
            .update({ propietario_id: null })
            .eq('id', inmuebleId)

        if (error) {
            console.error("Error al desvincular:", error)
            return { success: false, error: 'Error al desvincular el inmueble.' }
        }

        revalidatePath('/dashboard/admin/vecinos')
        return { success: true }
    } catch (err) {
        return { success: false, error: 'Error inesperado.' }
    }
}

export async function actualizarInmuebleAction(inmuebleId: string, data: { identificador: string }) {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('inmuebles')
            .update({
                identificador: data.identificador
            })
            .eq('id', inmuebleId)

        if (error) {
            console.error("Error al actualizar inmueble:", error)
            return { success: false, error: 'Error al actualizar los datos del inmueble.' }
        }

        revalidatePath('/dashboard/admin/vecinos')
        return { success: true }
    } catch (err) {
        return { success: false, error: 'Error inesperado.' }
    }
}

export async function crearInmuebleAction(formData: FormData) {
    try {
        const supabase = await createClient()

        // 1. Validar Admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autorizado' }

        const { data: adminPerfil } = await supabase
            .from('perfiles')
            .select('condominio_id')
            .eq('auth_user_id', user.id)
            .eq('rol', 'admin')
            .single()

        if (!adminPerfil) return { success: false, error: 'Perfil de admin no encontrado' }

        // 2. Extraer datos
        const identificador = formData.get('identificador') as string

        if (!identificador) {
            return { success: false, error: 'El identificador del inmueble es requerido.' }
        }

        // 3. Crear Inmueble
        const { data: newInm, error } = await supabase
            .from('inmuebles')
            .insert({
                condominio_id: adminPerfil.condominio_id,
                identificador
            })
            .select()
            .single()

        if (error) {
            console.error("Error al crear inmueble:", error)
            return { success: false, error: 'Error al registrar el inmueble.' }
        }

        revalidatePath('/dashboard/admin/vecinos')
        return { success: true, id: newInm.id }
    } catch (err) {
        return { success: false, error: 'Error inesperado.' }
    }
}

export async function importarInmueblesMasivoAction(items: any[]) {
    try {
        const supabase = await createClient()

        // 1. Validar Admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autorizado' }

        const { data: adminPerfil } = await supabase
            .from('perfiles')
            .select('condominio_id')
            .eq('auth_user_id', user.id)
            .eq('rol', 'admin')
            .single()

        if (!adminPerfil) return { success: false, error: 'Perfil de admin no encontrado' }

        const condominioId = adminPerfil.condominio_id

        // 2. Procesar cada fila
        let procesados = 0
        let errores = 0

        for (const item of items) {
            try {
                const { inmueble, nombre, apellido, cedula, telefono } = item

                if (!inmueble) continue

                // a. Crear o buscar inmueble
                let { data: existingInmueble } = await supabase
                    .from('inmuebles')
                    .select('id, propietario_id')
                    .eq('condominio_id', condominioId)
                    .eq('identificador', inmueble)
                    .single()

                let currentInmuebleId = existingInmueble?.id

                if (!currentInmuebleId) {
                    const { data: newInm, error: errorInm } = await supabase
                        .from('inmuebles')
                        .insert({ condominio_id: condominioId, identificador: inmueble })
                        .select()
                        .single()

                    if (errorInm) {
                        console.error('Error creando inmueble:', errorInm)
                        errores++
                        continue
                    }
                    currentInmuebleId = newInm.id
                }

                // b. Si trae datos de dueño, crear perfil y vincular
                if (cedula && nombre && apellido) {
                    // Buscar si ya existe el perfil por cédula en este condominio
                    const { data: existingPerfil } = await supabase
                        .from('perfiles')
                        .select('id')
                        .eq('condominio_id', condominioId)
                        .eq('cedula', cedula)
                        .single()

                    let perfilId = existingPerfil?.id

                    if (!perfilId) {
                        const { data: newPerfil, error: errorP } = await supabase
                            .from('perfiles')
                            .insert({
                                condominio_id: condominioId,
                                rol: 'propietario',
                                nombres: nombre,
                                apellidos: apellido,
                                cedula,
                                telefono
                            })
                            .select()
                            .single()

                        if (errorP) {
                            console.error('Error creando perfil:', errorP)
                            errores++
                            continue
                        }
                        perfilId = newPerfil.id
                    }

                    // Vincular inmueble con perfil
                    await supabase
                        .from('inmuebles')
                        .update({ propietario_id: perfilId })
                        .eq('id', currentInmuebleId)
                }

                procesados++
            } catch (filaErr) {
                console.error('Error procesando fila:', filaErr)
                errores++
            }
        }

        revalidatePath('/dashboard/admin/vecinos')
        return { success: true, count: procesados, errors: errores }
    } catch (err) {
        console.error('Error total import:', err)
        return { success: false, error: 'Error inesperado durante la importación.' }
    }
}

export async function getInmueblesDatosAction() {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'No autorizado' }

        const { data: adminPerfil } = await supabase
            .from('perfiles')
            .select('condominio_id, condominios(nombre)')
            .eq('auth_user_id', user.id)
            .eq('rol', 'admin')
            .single()

        if (!adminPerfil) return { error: 'Perfil no encontrado' }

        const { data: inmuebles } = await supabase
            .from('inmuebles')
            .select(`
                identificador,
                propietarios:propietario_id (
                    nombres,
                    apellidos,
                    cedula,
                    telefono
                )
            `)
            .eq('condominio_id', adminPerfil.condominio_id)
            .order('identificador', { ascending: true })

        return {
            inmuebles: inmuebles || [],
            condominioNombre: (adminPerfil.condominios as any)?.nombre || 'Condominio'
        }
    } catch (err) {
        return { error: 'Error al obtener datos.' }
    }
}
