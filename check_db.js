require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
async function run() {
    const { data } = await supabase.from('recibos_cobro')
        .select('mes, monto_usd, fecha_emision, estado, inmuebles(identificador)')
        .eq('estado', 'pendiente');
    console.log(JSON.stringify(data, null, 2));
}
run();
