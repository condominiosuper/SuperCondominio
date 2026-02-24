'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function guardarParametrosFinancierosAction(montoMensual: number, diaCobro: number) {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'No autorizado' }

        // Extraer condominio del admin
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('condominio_id')
            .eq('auth_user_id', user.id)
            .single()

        if (!perfil?.condominio_id) return { error: 'Condominio no encontrado' }

        // Validar data
        if (montoMensual < 0) return { error: 'El monto no puede ser negativo' }
        if (diaCobro < 1 || diaCobro > 31) return { error: 'Día de cobro inválido (1-31)' }

        // Hacer Update a la tabla maestra
        const { error } = await supabase
            .from('condominios')
            .update({
                monto_mensual_usd: montoMensual,
                dia_cobro: diaCobro
            })
            .eq('id', perfil.condominio_id)

        if (error) {
            console.error('Error supabase guardarParametrosFinancierosAction:', error)
            return { error: 'Error al comunicarse con la Base de Datos.' }
        }

        revalidatePath('/dashboard/admin/finanzas')
        revalidatePath('/dashboard/admin/ajustes')

        return { success: true }
    } catch (err) {
        console.error('Catch error guardarParametrosFinancierosAction:', err)
        return { error: 'Ocurrió un error inesperado al guardar los parámetros.' }
    }
}
