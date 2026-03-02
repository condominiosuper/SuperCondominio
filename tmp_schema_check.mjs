import { createClient } from '@supabase/supabase-js'

// We need to pass the env vars manually when running via node
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key)

async function run() {
    const { data, error } = await supabase.from('perfiles').select('*').limit(1)
    if (error) {
        console.error("Error:", error)
        return
    }
    console.log("Columns:", Object.keys(data[0] || {}))
}

run()
