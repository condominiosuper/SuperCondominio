'use server'

import { createAdminClient } from '@/utils/supabase/admin'

export interface DeudaItem {
    condominio: string;
    inmueble: string;
    mesesMora: number;
    saldoUsd: number;
    saldoBs: number;
}

export interface ConsultaResult {
    error?: string;
    tasaBcv?: number;
    deudas?: DeudaItem[];
    totalUsd?: number;
    totalBs?: number;
}

export async function consultarSaldo(formData: FormData): Promise<ConsultaResult> {
    const prefijo = formData.get('prefijo') as string
    const numero = formData.get('numero') as string
    const cedula = `${prefijo}${numero}`

    const supabase = createAdminClient()

    try {
        let tasaBcv = 36.50 // Fallback final genérico

        // Obtener la tasa BCV más reciente desde la API externa
        try {
            const apiResponse = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
                next: { revalidate: 3600 } // Cachear por 1 hora para no saturar la API
            })
            if (apiResponse.ok) {
                const d = await apiResponse.json()
                if (d && d.promedio) {
                    tasaBcv = d.promedio
                }
            } else {
                throw new Error('API failed')
            }
        } catch {
            // Si falla, buscar la última conocida en DB
            const { data: tasaData } = await supabase
                .from('tasa_bcv')
                .select('tasa')
                .order('fecha', { ascending: false })
                .limit(1)
                .single()
            if (tasaData?.tasa) tasaBcv = tasaData.tasa
        }

        // Buscar perfiles con esa cédula
        const { data: perfiles, error: perfilesError } = await supabase
            .from('perfiles')
            .select('id, nombres, apellidos')
            .eq('cedula', cedula)

        if (perfilesError || !perfiles || perfiles.length === 0) {
            return { error: 'No se encontraron registros activos para la cédula ingresada.' }
        }

        const perfilesIds = perfiles.map(p => p.id)

        // Buscar los inmuebles asociados a esos perfiles, junto con su condominio
        const { data: inmuebles, error: inmueblesError } = await supabase
            .from('inmuebles')
            .select('id, identificador, condominios(nombre)')
            .in('propietario_id', perfilesIds)

        if (inmueblesError || !inmuebles || inmuebles.length === 0) {
            return { error: 'No existen inmuebles asociados a esta cédula.', tasaBcv }
        }

        const inmueblesIds = inmuebles.map(i => i.id)

        // Buscar los recibos pendientes
        const { data: recibos, error: recibosError } = await supabase
            .from('recibos_cobro')
            .select('inmueble_id, monto_usd, monto_pagado_usd')
            .in('inmueble_id', inmueblesIds)
            .neq('estado', 'pagado')

        if (recibosError || !recibos) {
            return { error: 'Error al consultar el saldo. Intenta más tarde.', tasaBcv }
        }

        // Agrupar deuda por inmueble
        const deudas: DeudaItem[] = inmuebles.map(inmueble => {
            const recibosInmueble = recibos.filter(r => r.inmueble_id === inmueble.id)
            const deudaUsd = recibosInmueble.reduce((sum, r) => sum + (r.monto_usd - r.monto_pagado_usd), 0)

            return {
                condominio: (inmueble.condominios as any)?.nombre || 'Condominio',
                inmueble: inmueble.identificador,
                mesesMora: recibosInmueble.length,
                saldoUsd: deudaUsd,
                saldoBs: deudaUsd * tasaBcv
            }
        }).filter(d => d.saldoUsd > 0) // Mostrar solo los que tienen deuda

        const totalUsd = deudas.reduce((acc, curr) => acc + curr.saldoUsd, 0)
        const totalBs = deudas.reduce((acc, curr) => acc + curr.saldoBs, 0)

        return {
            tasaBcv,
            deudas,
            totalUsd,
            totalBs
        }
    } catch (error) {
        return { error: 'Ocurrió un error inesperado al consultar.' }
    }
}
