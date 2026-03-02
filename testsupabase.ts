import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    // See what columns it actually has
    const { data: cols, error: e1 } = await supabase
        .from('logs_sistema')
        .select('*')
        .limit(1)

    if (e1) {
        console.error('ERROR col_check:', JSON.stringify(e1, null, 2))
    } else {
        console.log("Success: logs_cols exists.", cols, Object.keys(cols?.[0] || {}))
    }
}
run()
