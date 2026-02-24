import { createClient } from '@supabase/supabase-js'

// Usamos el Service Role Key para hacer bypass de RLS y consultar deudas públicamente 
// (ya que los recibos e inmuebles no tienen políticas de acceso público)
export function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
