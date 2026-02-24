-- Añadir las nuevas columnas para soportar la Fase 15 de Configuración (Tablón de Anuncios y Bancos)
ALTER TABLE public.condominios
ADD COLUMN anuncio_tablon TEXT DEFAULT NULL,
ADD COLUMN cuentas_bancarias JSONB DEFAULT '[]'::jsonb;

-- Asegurarnos de que los Administradores puedan actualizar su propia fila de condominio
CREATE POLICY "Admins pueden actualizar su propio condominio" ON public.condominios
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.perfiles
        WHERE perfiles.auth_user_id = auth.uid()
        AND perfiles.rol = 'admin'
        AND perfiles.condominio_id = condominios.id
    )
);
