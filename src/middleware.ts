import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/auth-helper'

export async function middleware(request: NextRequest) {
    // Update session & handle routing based on authentication
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Aplica el middleware a todas las rutas excepto a:
         * - _next/static (archivos estáticos)
         * - _next/image (optimización de imágenes de next)
         * - favicon.ico
         * - imagenes varias
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
