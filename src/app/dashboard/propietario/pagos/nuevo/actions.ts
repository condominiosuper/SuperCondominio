'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function submitPagoAction(formData: FormData) {
    try {
        const supabase = await createClient()
        const cookieStore = await cookies()
        const perfilId = cookieStore.get('propietario_token')?.value

        if (!perfilId) {
            return { success: false, error: 'Sesión no válida o expirada. Por favor, vuelve a iniciar sesión.' }
        }

        // 1. Obtener Condominio asociado al Perfil
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('condominio_id')
            .eq('id', perfilId)
            .single()

        if (!perfil) {
            return { success: false, error: 'No se encontró el condominio asociado.' }
        }

        // 2. Extraer datos del formulario
        const montoBs = formData.get('montoBs') as string
        const referencia = formData.get('referencia') as string
        const fecha = formData.get('fecha') as string
        const archivo = formData.get('capture') as File

        if (!archivo || archivo.size === 0) {
            return { success: false, error: 'Debe adjuntar un comprobante de pago válido.' }
        }

        // 3. Subir archivo a Storage (comprobantes_pago)
        const fileExt = archivo.name.split('.').pop()
        const fileName = `${perfil.condominio_id}/${perfilId}-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('comprobantes_pago')
            .upload(fileName, archivo, {
                cacheControl: '3600',
                upsert: false
            })

        if (uploadError) {
            console.error("Storage Error:", uploadError)
            return { success: false, error: 'Error al subir la imagen del comprobante.' }
        }

        // 4. Obtener URL Pública de la imagen
        const { data: publicUrlData } = supabase.storage
            .from('comprobantes_pago')
            .getPublicUrl(fileName)

        const captureUrl = publicUrlData.publicUrl

        // 5. Tasa BCV (Mock temporal para el MVP)
        const tasaSimulada = 36.25
        const montoEquivalenteUsd = Number(montoBs) / tasaSimulada

        // 6. Insertar Registro en base de datos
        const { error: insertError } = await supabase
            .from('pagos_reportados')
            .insert({
                condominio_id: perfil.condominio_id,
                perfil_id: perfilId,
                monto_bs: montoBs,
                tasa_aplicada: tasaSimulada,
                monto_equivalente_usd: montoEquivalenteUsd,
                referencia: referencia,
                fecha_pago: fecha,
                banco_origen: 'No Especificado', // Podría agregarse al form luego
                banco_destino: 'Banesco',
                capture_url: captureUrl,
                estado: 'en_revision'
            })

        if (insertError) {
            console.error("Insert Error:", insertError)
            return { success: false, error: 'Error al guardar el pago en la base de datos.' }
        }

        // 7. Éxito
        revalidatePath('/dashboard/propietario/pagos')
        return { success: true }

    } catch (err: any) {
        console.error("Catch Error:", err)
        return { success: false, error: err.message || 'Ocurrió un error inesperado al procesar tu pago.' }
    }
}
