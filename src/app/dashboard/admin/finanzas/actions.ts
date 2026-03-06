'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAdminProfile } from '@/utils/supabase/admin-helper'

export async function guardarParametrosFinancierosAction(montoMensual: number, diaCobro: number) {
    try {
        const { user, profile: adminPerfil } = await getAdminProfile()
        const supabase = await createClient()

        if (!user || !adminPerfil) return { error: 'No autorizado o perfil no encontrado' }

        const condominioId = adminPerfil.condominio_id

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
            .eq('id', condominioId)

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
    try {
        const { user, profile: adminPerfil } = await getAdminProfile()
        const supabase = await createClient()

        if (!user || !adminPerfil) return { error: 'No autorizado o perfil no encontrado' }

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

            const recibosAdeudados = recibosInm.filter(r => r.estado !== 'pagado')
            const saldoTotalUSD = recibosAdeudados.reduce((acc, r) => acc + (Number(r.monto_usd) - Number(r.monto_pagado_usd)), 0)

            let cargoMesActualUSD = 0;
            let cargoMesNombre = 'N/A';

            if (ultimoRecibo && recibosAdeudados.length > 0) {
                const sortedAdeudados = [...recibosAdeudados].sort((a, b) => new Date(b.fecha_emision).getTime() - new Date(a.fecha_emision).getTime())
                const ultimoAdeudado = sortedAdeudados[0]

                if (ultimoAdeudado) {
                    const fechaRef = new Date(ultimoAdeudado.fecha_emision);
                    const mesRef = fechaRef.getMonth();
                    const yearRef = fechaRef.getFullYear();

                    const recibosDelMes = recibosAdeudados.filter(r => {
                        const d = new Date(r.fecha_emision);
                        return d.getMonth() === mesRef && d.getFullYear() === yearRef;
                    });

                    cargoMesActualUSD = recibosDelMes.reduce((acc, r) => acc + (Number(r.monto_usd) - Number(r.monto_pagado_usd)), 0);

                    const nombresUnicos = Array.from(new Set(recibosDelMes.map(r => r.mes ? r.mes.trim() : 'Cuota')));
                    cargoMesNombre = nombresUnicos.length > 2 ? 'Varias Cuotas' : nombresUnicos.join(' + ');
                }
            } else if (ultimoRecibo) {
                cargoMesNombre = ultimoRecibo.mes;
            }

            const saldoAnteriorUSD = saldoTotalUSD - cargoMesActualUSD

            // Último pago asociado al perfil del propietario
            const prop = inm.propietario as any
            const ultimoPago = prop ? pagos.find(p => p.perfil_id === prop.id) : null

            // Calcular Meses en Mora (basado en meses únicos de emisión de deuda)
            const mesesMoraSet = new Set(recibosAdeudados.map(r => {
                const d = new Date(r.fecha_emision);
                return `${d.getFullYear()}-${d.getMonth()}`;
            }));
            const mesesMora = mesesMoraSet.size;

            return {
                id: inm.id,
                identificador: inm.identificador,
                propietario: prop ? `${prop.nombres} ${prop.apellidos}` : 'Sin Propietario',
                saldoAnteriorUSD,
                cargoMesActualUSD,
                cargoMesNombre,
                saldoTotalUSD,
                mesesMora,
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
    const targetYear = year || new Date().getFullYear()

    try {
        const { user, profile: adminPerfil } = await getAdminProfile()
        const supabase = await createClient()

        if (!user || !adminPerfil) return { error: 'No autorizado o perfil no encontrado' }

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

            // Initialize all months to 0
            meses.forEach(m => { row[m] = 0; })

            // Accumulate amounts based on emission date month
            recibosInm.forEach(rec => {
                if (!rec.fecha_emision) return;
                // fecha_emision format: 2026-03-06 or 2026-03-06T...
                const datePart = rec.fecha_emision.split('T')[0]; // "2026-03-06"
                const monthStr = datePart.split('-')[1]; // "03"
                if (monthStr) {
                    const monthIndex = parseInt(monthStr, 10) - 1; // 0-based for array
                    if (monthIndex >= 0 && monthIndex < 12) {
                        const monthName = meses[monthIndex];
                        row[monthName] += Number(rec.monto_usd || 0);
                    }
                }
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
    try {
        const { user, profile: adminPerfil } = await getAdminProfile()
        const supabase = await createClient()

        if (!user || !adminPerfil) return { error: 'No autorizado o perfil no encontrado' }

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

interface ManualPaymentProps {
    inmuebleId: string;
    inmuebleIdentificador: string;
    montoRegistrado: number;
    moneda: 'USD' | 'BS';
    metodo: string;
    referencia: string;
    fecha: string;
    tasaAplicada: number;
    equivalenteUsd: number;
}

export async function registrarPagoManualAction(datos: ManualPaymentProps) {
    try {
        const supabase = await createClient()
        const { user, profile: adminPerfil } = await getAdminProfile()

        if (!user || !adminPerfil) return { success: false, error: 'No autorizado.' }

        // 1. Obtener perfil asociado al inmueble (para notificarlo y enrutarlo)
        const { data: perfilData } = await supabase
            .from('perfiles')
            .select('id')
            .eq('inmueble_id', datos.inmuebleId)
            .single()

        const perfilId = perfilData?.id || null

        // 2. Registrar el pago en pagos_reportados como APROBADO ya que lo hizo el Admin
        const { data: nuevoPago, error: insertError } = await supabase
            .from('pagos_reportados')
            .insert({
                condominio_id: adminPerfil.condominio_id,
                perfil_id: perfilId,
                monto_bs: datos.moneda === 'BS' ? datos.montoRegistrado : (datos.montoRegistrado * datos.tasaAplicada),
                tasa_aplicada: datos.tasaAplicada,
                monto_equivalente_usd: datos.equivalenteUsd,
                referencia: `${datos.referencia || 'Registro Manual Adm.'} (Inmueble: ${datos.inmuebleIdentificador})`,
                fecha_pago: datos.fecha,
                banco_origen: datos.metodo,
                banco_destino: 'Caja',
                capture_url: 'MANUAL', // Etiqueta especial
                estado: 'aprobado'
            })
            .select('id')
            .single()

        if (insertError) {
            console.error("Error insertando pago:", insertError)
            return { success: false, error: 'Ocurrió un error al guardar el pago.' }
        }

        // 3. Cascada de Conciliación Automática
        let montoDisponibleUsd = Number(datos.equivalenteUsd)

        const { data: recibosPendientes } = await supabase
            .from('recibos_cobro')
            .select('*')
            .eq('inmueble_id', datos.inmuebleId)
            .in('estado', ['pendiente', 'moroso'])
            .order('fecha_emision', { ascending: true })

        if (recibosPendientes && recibosPendientes.length > 0) {
            for (const recibo of recibosPendientes) {
                if (montoDisponibleUsd <= 0.01) break;

                const montoDeuda = Number(recibo.monto_usd) - Number(recibo.monto_pagado_usd)
                let nuevoPagado = Number(recibo.monto_pagado_usd)
                let nuevoEstado = recibo.estado

                if (montoDisponibleUsd >= montoDeuda) {
                    nuevoPagado += montoDeuda
                    montoDisponibleUsd -= montoDeuda
                    nuevoEstado = 'pagado'
                } else {
                    nuevoPagado += montoDisponibleUsd
                    montoDisponibleUsd = 0
                }

                await supabase
                    .from('recibos_cobro')
                    .update({
                        monto_pagado_usd: nuevoPagado.toFixed(2),
                        estado: nuevoEstado
                    })
                    .eq('id', recibo.id)
            }
        }

        // 4. Notificar al usuario (si tiene un perfil creado)
        if (perfilId) {
            await supabase.from('notificaciones').insert({
                condominio_id: adminPerfil.condominio_id,
                perfil_id: perfilId,
                tipo: 'pago_aprobado',
                titulo: 'Pago Registrado Oficialmente',
                mensaje: `La administración ha registrado un pago por valor de $${datos.equivalenteUsd.toFixed(2)} USD y ha sido acreditado a tu cuenta de condominio.`,
                enlace: '/dashboard/propietario/pagos'
            })
        }

        revalidatePath('/dashboard/admin/finanzas')
        return { success: true }
    } catch (err: any) {
        console.error("Error catched en registrarPagoManualAction:", err)
        return { success: false, error: 'Error inesperado del servidor.' }
    }
}
