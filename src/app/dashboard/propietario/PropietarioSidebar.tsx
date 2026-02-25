'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CreditCard, Ticket, User, LogOut, Megaphone } from 'lucide-react'
import { signOutAction } from '@/app/auth/actions'

export default function PropietarioSidebar() {
    const pathname = usePathname()

    const navItems = [
        {
            name: 'Inicio',
            href: '/dashboard/propietario',
            icon: Home,
            isActive: pathname === '/dashboard/propietario'
        },
        {
            name: 'Pagos y Recibos',
            href: '/dashboard/propietario/pagos',
            icon: CreditCard,
            isActive: pathname.startsWith('/dashboard/propietario/pagos')
        },
        {
            name: 'Muro Vecinal',
            href: '/dashboard/propietario#muro-vecinal',
            icon: Megaphone,
            isActive: false
        },
        {
            name: 'Mi Perfil',
            href: '/dashboard/propietario/perfil',
            icon: User,
            isActive: pathname.startsWith('/dashboard/propietario/perfil')
        }
    ]

    return (
        <aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200 h-screen sticky top-0 py-8 px-6 shadow-sm z-50">
            {/* Logo o Marca */}
            <div className="mb-10 pl-2">
                <Link href="/dashboard/propietario" className="text-2xl font-black text-[#1e3a8a] tracking-tighter flex items-center gap-2">
                    <span className="bg-[#1e3a8a] text-white p-1.5 rounded-lg text-sm">SC</span>
                    SUPER<span className="text-slate-800 font-light">condominio</span>
                </Link>
                <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-2">Portal de Residentes</p>
            </div>

            {/* Navegación Principal */}
            <nav className="flex-1 space-y-2">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isSelected = item.isActive

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all ${isSelected
                                ? 'bg-blue-50 text-[#1e3a8a] shadow-sm border border-blue-100'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isSelected ? 'fill-[#1e3a8a] text-[#1e3a8a]' : ''}`} />
                            <span className="text-sm">{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* Logout Footer */}
            <div className="mt-8 pt-6 border-t border-slate-100">
                <form action={signOutAction}>
                    <button type="submit" className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 font-bold text-sm rounded-xl transition-colors">
                        <LogOut className="w-5 h-5" />
                        Cerrar Sesión
                    </button>
                </form>
            </div>
        </aside>
    )
}
