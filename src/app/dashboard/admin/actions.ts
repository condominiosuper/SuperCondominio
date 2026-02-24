'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function aprobarPagoAction(pagoId: string) {
    try {
        const supabase = await createClient()

        // 1. Obtener la información del pago y su propietario
        const { data: pago, error: errPago } = await supabase
            .from('pagos_reportados')
            .select(`
                *,
                perfiles:perfil_id (
                    inmuebles ( id )
                )
            `)
            .eq('id', pagoId)
            .single()

        if (errPago || !pago) return { success: false, error: 'Pago no encontrado.' }

        // Múltiples inmuebles? Tomamos el primero por simplicidad en este MVP
        // @ts-ignore
        const inmuebleId = pago.perfiles?.inmuebles?.[0]?.id;

        if (inmuebleId) {
            let montoDisponibleUsd = Number(pago.monto_equivalente_usd)

            // 2. Obtener los recibos pendientes o morosos de este inmueble (los más viejos primero)
            const { data: recibosPendientes } = await supabase
                .from('recibos_cobro')
                .select('*')
                .eq('inmueble_id', inmuebleId)
                .in('estado', ['pendiente', 'moroso'])
                .order('fecha_emision', { ascending: true })

            // 3. Cascada de Conciliación Automática
            if (recibosPendientes && recibosPendientes.length > 0) {
                for (const recibo of recibosPendientes) {
                    if (montoDisponibleUsd <= 0.01) break; // Fondos agotados (0.01 para float margin)

                    const montoDeuda = Number(recibo.monto_usd) - Number(recibo.monto_pagado_usd)
                    let nuevoPagado = Number(recibo.monto_pagado_usd)
                    let nuevoEstado = recibo.estado

                    if (montoDisponibleUsd >= montoDeuda) {
                        // Pago completo de esta factura
                        nuevoPagado += montoDeuda
                        montoDisponibleUsd -= montoDeuda
                        nuevoEstado = 'pagado'
                    } else {
                        // Pago parcial (abono)
                        nuevoPagado += montoDisponibleUsd
                        montoDisponibleUsd = 0
                    }

                    // 4. Actualizar estado del recibo
                    await supabase
                        .from('recibos_cobro')
                        .update({
                            monto_pagado_usd: nuevoPagado.toFixed(2),
                            estado: nuevoEstado
                        })
                        .eq('id', recibo.id)
                }
            }
        }

        // 5. Finalmente, actualizar estado del pago a APROBADO
        const { error } = await supabase
            .from('pagos_reportados')
            .update({ estado: 'aprobado' })
            .eq('id', pagoId)

        if (error) {
            console.error("Error al aprobar:", error)
            return { success: false, error: 'Error en la base de datos al aprobar el pago.' }
        }

        // --- NOTIFICACIÓN AL PROPIETARIO ---
        await supabase.from('notificaciones').insert({
            condominio_id: pago.condominio_id,
            perfil_id: pago.perfil_id,
            tipo: 'pago_aprobado',
            titulo: 'Pago Aprobado',
            mensaje: `Tu reporte de pago por ${Number(pago.monto_bs).toLocaleString('es-VE')} Bs. (Ref: ${pago.referencia}) ha sido acreditado a tu cuenta.`,
            enlace: '/dashboard/propietario/pagos'
        })

        revalidatePath('/dashboard/admin')
        return { success: true }
    } catch (err: any) {
        return { success: false, error: 'Error inesperado.' }
    }
}

export async function rechazarPagoAction(pagoId: string, nota?: string) {
    try {
        const supabase = await createClient()

        const { data: pago } = await supabase
            .from('pagos_reportados')
            .select('condominio_id, perfil_id, referencia, monto_bs')
            .eq('id', pagoId)
            .single()

        if (!pago) return { success: false, error: 'Pago no encontrado.' }

        // 1. Actualizar estado del pago a RECHAZADO
        const { error } = await supabase
            .from('pagos_reportados')
            .update({
                estado: 'rechazado',
                nota_admin: nota || 'Rechazado por inconsistencia'
            })
            .eq('id', pagoId)

        if (error) {
            console.error("Error al rechazar:", error)
            return { success: false, error: 'Error en la base de datos al rechazar el pago.' }
        }

        // --- NOTIFICACIÓN AL PROPIETARIO ---
        await supabase.from('notificaciones').insert({
            condominio_id: pago.condominio_id,
            perfil_id: pago.perfil_id,
            tipo: 'pago_rechazado',
            titulo: 'Pago Rechazado',
            mensaje: `El reporte (Ref: ${pago.referencia}) fue declinado. Razón: ${nota || 'Revisión administrativa'}. Contacta a la gerencia.`,
            enlace: '/dashboard/propietario/pagos'
        })

        revalidatePath('/dashboard/admin')
        return { success: true }
    } catch (err: any) {
        return { success: false, error: 'Error inesperado.' }
    }
}
