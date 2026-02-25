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

export async function getReporteConsolidadosAction() {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'No autorizado' }

        const { data: adminPerfil } = await supabase
            .from('perfiles')
            .select('condominio_id')
            .eq('auth_user_id', user.id)
            .eq('rol', 'admin')
            .single()

        if (!adminPerfil) return { error: 'Perfil no encontrado' }

        const condominioId = adminPerfil.condominio_id

        // 1. Obtener inmuebles con sus propietarios (incluyendo el ID de perfil para el mapeo)
        const { data: inmuebles, error: errInmuebles } = await supabase
            .from('inmuebles')
            .select(`
                id,
                identificador,
                propietario:perfiles (
                    id,
                    nombres,
                    apellidos
                )
            `)
            .eq('condominio_id', condominioId)
            .order('identificador', { ascending: true })

        if (errInmuebles) throw errInmuebles

        // 2. Obtener todos los recibos para estos inmuebles
        const { data: recibos, error: errRecibos } = await supabase
            .from('recibos_cobro')
            .select('inmueble_id, monto_usd, monto_pagado_usd, estado, mes, fecha_emision')
            .eq('condominio_id', condominioId)

        if (errRecibos) throw errRecibos

        // 3. Obtener últimos pagos aprobados
        const { data: pagos, error: errPagos } = await supabase
            .from('pagos_reportados')
            .select('perfil_id, monto_bs, fecha_pago, created_at')
            .eq('condominio_id', condominioId)
            .eq('estado', 'aprobado')
            .order('created_at', { ascending: false })

        if (errPagos) throw errPagos

        // 4. Consolidar data
        const reporte = inmuebles.map(inm => {
            const recibosInm = recibos.filter(r => r.inmueble_id === inm.id)

            // Ordenar recibos por fecha de emisión (más reciente primero)
            const sortedRecibos = [...recibosInm].sort((a, b) => new Date(b.fecha_emision).getTime() - new Date(a.fecha_emision).getTime())
            const ultimoRecibo = sortedRecibos[0]

            const saldoTotalUSD = recibosInm.reduce((acc, r) => acc + (Number(r.monto_usd) - Number(r.monto_pagado_usd)), 0)
            const cargoMesActualUSD = ultimoRecibo && ultimoRecibo.estado === 'pendiente' ? Number(ultimoRecibo.monto_usd) : 0
            const saldoAnteriorUSD = saldoTotalUSD - cargoMesActualUSD

            // Último pago asociado al perfil del propietario
            const prop = inm.propietario as any
            const ultimoPago = prop ? pagos.find(p => p.perfil_id === prop.id) : null

            return {
                id: inm.id,
                identificador: inm.identificador,
                propietario: prop ? `${prop.nombres} ${prop.apellidos}` : 'Sin Propietario',
                saldoAnteriorUSD,
                cargoMesActualUSD,
                cargoMesNombre: ultimoRecibo?.mes || 'N/A',
                saldoTotalUSD,
                ultimoPago: ultimoPago ? {
                    monto_bs: Number(ultimoPago.monto_bs),
                    fecha_pago: ultimoPago.fecha_pago
                } : null
            }
        })

        return { data: reporte }

    } catch (err) {
        console.error('Error en getReporteConsolidadosAction:', err)
        return { error: 'Error al generar el reporte.' }
    }
}

export async function getReporteAnualAction(year?: number) {
    const supabase = await createClient()
    const targetYear = year || new Date().getFullYear()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'No autorizado' }

        const { data: adminPerfil } = await supabase
            .from('perfiles')
            .select('condominio_id')
            .eq('auth_user_id', user.id)
            .single()

        if (!adminPerfil) return { error: 'Perfil no encontrado' }

        // 0. Obtener nombre del condominio
        const { data: condo } = await supabase
            .from('condominios')
            .select('nombre')
            .eq('id', adminPerfil.condominio_id)
            .single()

        // 1. Obtener inmuebles con cédula
        const { data: inmuebles, error: errInmuebles } = await supabase
            .from('inmuebles')
            .select(`
                id,
                identificador,
                propietario:perfiles (
                    nombres,
                    apellidos,
                    cedula
                )
            `)
            .eq('condominio_id', adminPerfil.condominio_id)

        if (errInmuebles) throw errInmuebles

        // 2. Obtener recibos del año
        const startDate = `${targetYear}-01-01`
        const endDate = `${targetYear}-12-31`

        const { data: recibos, error: errRecibos } = await supabase
            .from('recibos_cobro')
            .select('inmueble_id, monto_usd, mes, fecha_emision')
            .eq('condominio_id', adminPerfil.condominio_id)
            .gte('fecha_emision', startDate)
            .lte('fecha_emision', endDate)

        if (errRecibos) throw errRecibos

        // 3. Formatear para Excel
        const dataExcel = inmuebles.map(inm => {
            const recibosInm = recibos.filter(r => r.inmueble_id === inm.id)
            const row: any = {
                'Identificador': inm.identificador,
                // @ts-ignore
                'Propietario': inm.propietario ? `${inm.propietario.nombres} ${inm.propietario.apellidos}` : 'N/A',
                // @ts-ignore
                'Cedula': inm.propietario?.cedula || 'N/A'
            }

            const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
            meses.forEach(m => {
                const r = recibosInm.find(rec => rec.mes.toLowerCase() === m.toLowerCase())
                row[m] = r ? Number(r.monto_usd) : 0
            })

            return row
        })

        return {
            data: dataExcel,
            condominio: condo?.nombre || 'Condominio'
        }
    } catch (err) {
        console.error('Error en getReporteAnualAction:', err)
        return { error: 'Error al obtener data anual.' }
    }
}

export async function importRecibosExcelAction(data: any[]) {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'No autorizado' }

        const { data: adminPerfil } = await supabase
            .from('perfiles')
            .select('condominio_id')
            .eq('auth_user_id', user.id)
            .single()

        if (!adminPerfil) return { error: 'Perfil no encontrado' }

        // Mapeo simple: Identificador -> ID del inmueble
        const { data: inmuebles } = await supabase
            .from('inmuebles')
            .select('id, identificador')
            .eq('condominio_id', adminPerfil.condominio_id)

        if (!inmuebles) return { error: 'No se encontraron inmuebles' }

        const inserts = []
        const currentYear = new Date().getFullYear()

        for (const row of data) {
            const inm = inmuebles.find(i => i.identificador === row.Identificador)
            if (!inm) continue

            const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

            for (let i = 0; i < meses.length; i++) {
                const mesNombre = meses[i]
                const monto = Number(row[mesNombre])

                if (monto > 0) {
                    const monthNum = (i + 1).toString().padStart(2, '0')
                    inserts.push({
                        condominio_id: adminPerfil.condominio_id,
                        inmueble_id: inm.id,
                        mes: mesNombre,
                        monto_usd: monto,
                        monto_pagado_usd: 0,
                        estado: 'pendiente',
                        fecha_emision: `${currentYear}-${monthNum}-01`,
                        fecha_vencimiento: `${currentYear}-${monthNum}-15`
                    })
                }
            }
        }

        if (inserts.length > 0) {
            // Para simplificar, insertamos. En producción se debería hacer upsert o borrar previos del año.
            const { error } = await supabase.from('recibos_cobro').insert(inserts)
            if (error) throw error
        }

        revalidatePath('/dashboard/admin/finanzas')
        return { success: true, count: inserts.length }

    } catch (err) {
        console.error('Error en importRecibosExcelAction:', err)
        return { error: 'Error al importar datos.' }
    }
}
