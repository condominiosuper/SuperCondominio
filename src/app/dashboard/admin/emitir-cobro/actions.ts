'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function emitirCobroMasivoAction(formData: FormData) {
    try {
        const supabase = await createClient()

        // Obtener usuario admin autenticado
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'No autorizado' }

        const { data: adminPerfil } = await supabase
            .from('perfiles')
            .select('condominio_id')
            .eq('auth_user_id', user.id)
            .eq('rol', 'admin')
            .single()

        if (!adminPerfil) return { error: 'Perfil de administrador no encontrado' }

        const condominioId = adminPerfil.condominio_id

        // Extraer datos del formulario
        const mes = formData.get('mes') as string
        const montoTotalUsd = parseFloat(formData.get('monto_total_usd') as string)
        const fechaEmision = formData.get('fecha_emision') as string
        const fechaVencimiento = formData.get('fecha_vencimiento') as string

        if (!mes || isNaN(montoTotalUsd) || !fechaEmision || !fechaVencimiento) {
            return { error: 'Todos los campos son obligatorios' }
        }

        // Obtener todos los inmuebles del condominio y su alícuota
        const { data: inmuebles, error: errInmuebles } = await supabase
            .from('inmuebles')
            .select('id, alicuota')
            .eq('condominio_id', condominioId)

        if (errInmuebles || !inmuebles || inmuebles.length === 0) {
            return { error: 'No se encontraron inmuebles registrados en este condominio.' }
        }

        // Estructurar los recibos a insertar
        const recibosAInsertar = inmuebles.map(inm => {
            // Se cobra el monto fijo exacto a cada inmueble, independientemente de su alícuota
            const montoInmueble = montoTotalUsd.toFixed(2)

            return {
                condominio_id: condominioId,
                inmueble_id: inm.id,
                mes: mes,
                monto_usd: montoInmueble,
                monto_pagado_usd: 0.00,
                estado: 'pendiente',
                fecha_emision: fechaEmision,
                fecha_vencimiento: fechaVencimiento
            }
        })

        // Insertar masivamente en Supabase
        const { error: insertError } = await supabase
            .from('recibos_cobro')
            .insert(recibosAInsertar)

        if (insertError) {
            console.error("Error al insertar recibos masivamente:", insertError)
            return { error: 'Error en la base de datos al emitir los recibos.' }
        }

        // --- NOTIFICAR A PROPIETARIOS ---
        const { data: propietarios } = await supabase
            .from('perfiles')
            .select('id')
            .eq('condominio_id', condominioId)
            .eq('rol', 'propietario')

        if (propietarios && propietarios.length > 0) {
            const notifs = propietarios.map((p: any) => ({
                condominio_id: condominioId,
                perfil_id: p.id,
                tipo: 'nuevo_cobro',
                titulo: 'Nueva Cuota Emitida',
                mensaje: `Se ha emitido un nuevo recibo de cobro por $${montoTotalUsd.toFixed(2)} correspondiente a: ${mes}`,
                enlace: '/dashboard/propietario/pagos'
            }))
            await supabase.from('notificaciones').insert(notifs)
        }

    } catch (err: any) {
        return { error: 'Error inesperado.' }
    }

    revalidatePath('/dashboard/admin')
    redirect('/dashboard/admin?success=cobros_emitidos')
}
