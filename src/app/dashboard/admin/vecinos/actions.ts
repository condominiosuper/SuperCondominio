'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAdminProfile } from '@/utils/supabase/admin-helper'

async function logAdminAction(supabase: any, perfilId: string, evento: string, detalles: string | object) {
    try {
        await supabase.from('logs_sistema').insert({
            evento,
            detalles,
            perfil_id: perfilId
        })
    } catch (e) {
        console.error("No se pudo guardar el log de sistema:", e)
    }
}

export async function crearVecinoAction(formData: FormData) {
    try {
        const { user, profile: adminPerfil } = await getAdminProfile()
        const supabase = await createClient()

        if (!user || !adminPerfil) return { success: false, error: 'No autorizado o perfil no encontrado' }

        // 2. Extraer datos
        const cedula = formData.get('cedula') as string
        const nombres = formData.get('nombres') as string
        const apellidos = formData.get('apellidos') as string
        const email = formData.get('email') as string
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
            return { success: false, error: errorPerfil.message || 'Error al crear el perfil del vecino.' }
        }

        // 5. Vincular con inmueble si se especificó
        if (inmuebleId && nuevoPerfil) {
            const { error: errorInmueble } = await supabase
                .from('inmuebles')
                .update({ propietario_id: nuevoPerfil.id })
                .eq('id', inmuebleId)

            if (errorInmueble) {
                console.error("Error al vincular inmueble:", errorInmueble)
                return { success: false, error: errorInmueble.message || 'Error al vincular inmueble con el propietario.' }
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
        const { user, profile: adminPerfil } = await getAdminProfile()
        if (!user || !adminPerfil) return { success: false, error: 'No autorizado o perfil no encontrado' }

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
            return { success: false, error: 'No se pudo eliminar el recidente. Verifica que no tenga inmuebles vinculados primero.' }
        }

        // --- Loggeo de Acción ---
        await logAdminAction(supabase, adminPerfil.id, 'Eliminación de Residente', `Eliminó un perfil de vecino del sistema.`)

        revalidatePath('/dashboard/admin/vecinos')
        return { success: true }
    } catch (err) {
        return { success: false, error: 'Error inesperado.' }
    }
}

export async function desvincularInmuebleAction(inmuebleId: string) {
    try {
        const supabase = await createClient()

        // 1. Validar Admin
        const { user, profile: adminPerfil } = await getAdminProfile()
        if (!user || !adminPerfil) return { success: false, error: 'No autorizado o perfil no encontrado' }

        const { error } = await supabase
            .from('inmuebles')
            .update({ propietario_id: null })
            .eq('id', inmuebleId)

        if (error) {
            console.error("Error al desvincular:", error)
            return { success: false, error: 'Error al desvincular el inmueble.' }
        }

        // --- Loggeo de Acción ---
        await logAdminAction(supabase, adminPerfil.id, 'Desvinculación de Inmueble', `Desvinculó el inmueble ${inmuebleId} de su propietario.`)

        revalidatePath('/dashboard/admin/vecinos')
        return { success: true }
    } catch (err) {
        return { success: false, error: 'Error inesperado.' }
    }
}

export async function asignarInmuebleAction(inmuebleId: string, perfilId: string) {
    try {
        const supabase = await createClient()

        // 1. Validar Admin
        const { user, profile: adminPerfil } = await getAdminProfile()
        if (!user || !adminPerfil) return { success: false, error: 'No autorizado o perfil no encontrado' }

        const { error } = await supabase
            .from('inmuebles')
            .update({ propietario_id: perfilId })
            .eq('id', inmuebleId)

        if (error) {
            console.error("Error al asignar ocupante:", error)
            return { success: false, error: 'Error al vincular el inmueble.' }
        }

        // --- Loggeo de Acción ---
        await logAdminAction(supabase, adminPerfil.id, 'Asignación de Inmueble', `Unió el perfil ${perfilId} al inmueble ${inmuebleId}.`)

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
        const { user, profile: adminPerfil } = await getAdminProfile()
        const supabase = await createClient()

        if (!user || !adminPerfil) return { success: false, error: 'No autorizado o perfil no encontrado' }

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
            return { success: false, error: error.message || 'Error al registrar el inmueble.' }
        }

        // --- Loggeo de Acción ---
        await logAdminAction(supabase, adminPerfil.id, 'Creación de Inmueble', `Registró el nuevo inmueble ${identificador}.`)

        revalidatePath('/dashboard/admin/vecinos')
        return { success: true, id: newInm.id }
    } catch (err) {
        return { success: false, error: 'Error inesperado.' }
    }
}

export async function eliminarInmuebleAction(inmuebleId: string) {
    try {
        const supabase = await createClient()

        // 1. Validar Admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autorizado' }

        // 2. Eliminar
        const { error } = await supabase
            .from('inmuebles')
            .delete()
            .eq('id', inmuebleId)

        if (error) {
            console.error("Error al eliminar inmueble:", error)
            return { success: false, error: 'No se pudo eliminar el inmueble. Asegúrate de que no tenga registros vinculados (como recibos de cobro).' }
        }

        // --- Loggeo de Acción --- (Requiere temporalmente el perfil del admin llamandola)
        const { profile } = await getAdminProfile()
        if (profile) {
            await logAdminAction(supabase, profile.id, 'Eliminación de Inmueble', `Borrón de un inmueble del sistema.`)
        }

        revalidatePath('/dashboard/admin/vecinos')
        return { success: true }
    } catch (err) {
        return { success: false, error: 'Error inesperado.' }
    }
}

export async function importarInmueblesMasivoAction(items: any[]) {
    try {
        const { user, profile: adminPerfil } = await getAdminProfile()
        const supabase = await createClient()

        if (!user || !adminPerfil) return { success: false, error: 'No autorizado o perfil no encontrado' }

        const condominioId = adminPerfil.condominio_id

        // 2. Procesar cada fila
        let procesados = 0
        let errores = 0

        for (const item of items) {
            try {
                const { inmueble, nombre, apellido, cedula, telefono, email } = item

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
        const { user, profile: adminPerfil } = await getAdminProfile()
        const supabase = await createClient()

        if (!user || !adminPerfil) return { error: 'No autorizado o perfil no encontrado' }

        const { data: inmuebles } = await supabase
            .from('inmuebles')
            .select(`
                identificador,
                propietarios:propietario_id (
                    nombres,
                    apellidos,
                    cedula,
                    email,
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
