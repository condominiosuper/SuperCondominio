import { Bell } from 'lucide-react'
import Link from 'next/link'

interface Props {
    count: number;
    href: string;
    theme?: 'light' | 'dark'; // dark para fondo azul, light para fondo blanco
}

export default function NotificacionesWidget({ count, href, theme = 'light' }: Props) {
    const isDark = theme === 'dark';

    return (
        <Link
            href={href}
            className={`relative p-2 inline-flex transition-colors rounded-full border ${isDark
                    ? 'text-white hover:bg-white/10 border-transparent'
                    : 'text-slate-400 hover:text-slate-600 bg-slate-50 border-slate-100 hover:border-slate-200'
                }`}
        >
            <Bell className={isDark ? "w-6 h-6" : "w-5 h-5"} />
            {count > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className={`relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-bold text-white items-center justify-center ${isDark ? 'border-2 border-[#1e3a8a]' : 'border-2 border-white'
                        }`}>
                        {count > 9 ? '9+' : count}
                    </span>
                </span>
            )}
        </Link>
    )
}
