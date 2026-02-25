'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CreditCard, Ticket, User, Megaphone } from 'lucide-react'

export default function PropietarioBottomNav() {
    const pathname = usePathname()

    const navItems = [
        {
            name: 'Inicio',
            href: '/dashboard/propietario',
            icon: Home,
            isActive: pathname === '/dashboard/propietario'
        },
        {
            name: 'Pagos',
            href: '/dashboard/propietario/pagos',
            icon: CreditCard,
            isActive: pathname.startsWith('/dashboard/propietario/pagos')
        },
        {
            name: 'Muro',
            href: '/dashboard/propietario#muro-vecinal',
            icon: Megaphone,
            isActive: false // Al ser un ancla, no lo marcamos activo de forma persistente
        },
        {
            name: 'Perfil',
            href: '/dashboard/propietario/perfil',
            icon: User,
            isActive: pathname.startsWith('/dashboard/propietario/perfil')
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
