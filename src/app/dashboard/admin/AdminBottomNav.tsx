'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Wallet, Users, Settings, Megaphone } from 'lucide-react'

export default function AdminBottomNav() {
    const pathname = usePathname()

    const navItems = [
        {
            name: 'Dashboard',
            href: '/dashboard/admin',
            icon: LayoutDashboard,
            // Match exacto para el dashboard, match parcial para otras
            isActive: pathname === '/dashboard/admin' || pathname === '/dashboard/admin/emitir-cobro'
        },
        {
            name: 'Finanzas',
            href: '/dashboard/admin/finanzas',
            icon: Wallet,
            isActive: pathname.startsWith('/dashboard/admin/finanzas')
        },
        {
            name: 'Muro',
            href: '/dashboard/admin/anuncios',
            icon: Megaphone,
            isActive: pathname.startsWith('/dashboard/admin/anuncios')
        },
        {
            name: 'Vecinos',
            href: '/dashboard/admin/vecinos',
            icon: Users,
            isActive: pathname.startsWith('/dashboard/admin/vecinos')
        },
        {
            name: 'Ajustes',
            href: '/dashboard/admin/ajustes',
            icon: Settings,
            isActive: pathname.startsWith('/dashboard/admin/ajustes')
        }
    ]

    return (
        <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 px-6 py-3 pb-safe z-50">
            <div className="max-w-md mx-auto flex justify-between items-center text-xs font-medium">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isSelected = item.isActive

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 transition-colors ${isSelected ? 'text-[#1e3a8a]' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Icon className={`w-6 h-6 ${isSelected ? 'fill-[#1e3a8a] text-[#1e3a8a]' : ''}`} />
                            <span>{item.name}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
