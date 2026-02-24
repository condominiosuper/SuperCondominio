import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import PropietarioSidebar from './PropietarioSidebar'
import PropietarioBottomNav from './PropietarioBottomNav'

export default async function PropietarioDashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const cookieStore = await cookies()
    const hasToken = cookieStore.has('propietario_token')

    return (
        <div className="bg-slate-50 min-h-screen font-sans w-full flex flex-col md:flex-row">

            {/* Sidebar (Only visible on MD+ screens) */}
            {hasToken && <PropietarioSidebar />}

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-md md:max-w-4xl lg:max-w-5xl xl:max-w-7xl mx-auto relative pb-safe shadow-sm bg-slate-50 min-h-screen border-x border-slate-100 pb-24 md:pb-8">
                {children}
            </main>

            {/* Bottom Navigation solo si el propietario ya validó su cédula */}
            {/* Bottom Navigation solo si el propietario ya validó su cédula */}
            {hasToken && (
                <div className="md:hidden">
                    <PropietarioBottomNav />
                </div>
            )}
        </div>
    )
}
