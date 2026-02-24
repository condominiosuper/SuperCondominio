import { create } from 'zustand'

export type UserRole = 'admin' | 'propietario'

export interface UserProfile {
    id: string
    condominio_id: string
    rol: UserRole
    nombres: string
    apellidos: string
    cedula: string
    estado_solvencia: boolean
}

interface UserState {
    profile: UserProfile | null
    setProfile: (profile: UserProfile | null) => void
    clearProfile: () => void
}

export const useUserStore = create<UserState>((set) => ({
    profile: null,
    setProfile: (profile) => set({ profile }),
    clearProfile: () => set({ profile: null }),
}))
