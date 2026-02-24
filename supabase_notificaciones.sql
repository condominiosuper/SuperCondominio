-- Tabla de historial de notificaciones globales e individuales
CREATE TABLE public.notificaciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    condominio_id UUID REFERENCES public.condominios(id) ON DELETE CASCADE NOT NULL,
    perfil_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NULL, -- Si es null, consideramos que es para admin (o general no logueado). Usualmente para alertar a la administración.
    tipo VARCHAR NOT NULL, -- ej: 'pago_aprobado', 'nuevo_anuncio', 'ticket_respuesta', 'nuevo_cobro', 'nuevo_ticket'
    titulo VARCHAR NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT false,
    enlace VARCHAR NULL, -- opcional, para navegar a la entidad relacionada
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Políticas RLS
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden leer sus propias notificaciones (donde su perfil es el destinatario)
CREATE POLICY "Usuarios leen sus notificaciones" ON public.notificaciones
    FOR SELECT USING (auth.uid() IS NOT NULL); -- En nuestro modelo compartido, filtraremos por query en el Backend, pero podemos habilitar lectura autenticada general.

-- Propietario puede actualizar 'leida' en sus notificaciones (vía API backend)
CREATE POLICY "Usuarios pueden marcar como leidas" ON public.notificaciones
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Los administradores (Service Role o insert normal) pueden insertar.
CREATE POLICY "Admins pueden insertar notificaciones" ON public.notificaciones
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
