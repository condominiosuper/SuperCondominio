'use client'

import { Trash2, Pin } from 'lucide-react'
import { eliminarAnuncioAction, toggleFijarAnuncioAction } from './actions'
import { useState } from 'react'

export function DeleteButton({ id }: { id: string }) {
    const [isDeleting, setIsDeleting] = useState(false)

    return (
        <button
            disabled={isDeleting}
            onClick={async () => {
                if (confirm('¿Eliminar este anuncio permanentemente? Esta acción no se puede deshacer.')) {
                    setIsDeleting(true)
                    await eliminarAnuncioAction(id)
                }
            }}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Eliminar Anuncio"
        >
            <Trash2 className="w-5 h-5" />
        </button>
    )
}

export function PinButton({ id, isPinned }: { id: string, isPinned: boolean }) {
    const [isLoading, setIsLoading] = useState(false)

    return (
        <button
            disabled={isLoading}
            onClick={async () => {
                setIsLoading(true)
                await toggleFijarAnuncioAction(id, isPinned)
                setIsLoading(false)
            }}
            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${isPinned ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                }`}
            title={isPinned ? 'Quitar Fijado' : 'Fijar al Inicio'}
        >
            <Pin className="w-5 h-5" />
        </button>
    )
}
