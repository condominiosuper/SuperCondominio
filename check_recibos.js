require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
async function run() {
    const adminPerfil = { condominio_id: '11111111-1111-1111-1111-111111111111' }; // dummy, we will just query any receipt
    const { data, error } = await supabase.from('recibos_cobro').select('id, mes, monto_usd, fecha_emision').limit(5);
    console.log("Recibos sample:", data);
}
run();
