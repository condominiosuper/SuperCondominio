'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.error("Auth Supabase Error:", error)
        return { error: `Error Supabase: ${error.message}` }
    }

    // Si fue exitoso, el middleware se encargará de redirigir a /dashboard/admin o propietario
    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
