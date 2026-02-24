import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import NuevoPagoClient from './NuevoPagoClient'

export default async function NuevoPagoPageServer() {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const perfilId = cookieStore.get('propietario_token')?.value

    if (!perfilId) {
        redirect('/dashboard/propietario/validar')
    }

    // Obtener las Cuentas Bancarias del Condominio y su Anuncio/Tasa (Si las requieres)
    const { data: perfil } = await supabase
        .from('perfiles')
        .select(`
            condominios:condominio_id ( cuentas_bancarias )
        `)
        .eq('id', perfilId)
        .single()

    const condominioInfo = perfil?.condominios as any
    const cuentas = condominioInfo?.cuentas_bancarias || []

    return <NuevoPagoClient cuentasCondominio={cuentas} />
}
