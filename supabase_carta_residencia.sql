-- SCRIPT DE ACTUALIZACIÓN: FASE 27 - CARTA DE RESIDENCIA
-- =======================================================
-- Añadir columna a tabla condominios
ALTER TABLE public.condominios
ADD COLUMN IF NOT EXISTS carta_residencia_url VARCHAR NULL;

-- =======================================================
-- Creación del Bucket 'documentos' si no existe
-- =======================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('documentos', 'documentos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para el bucket 'documentos'

-- Permitir a cualquier usuario autenticado (o público general) LEER los documentos
DROP POLICY IF EXISTS "Public o Autenticados pueden ver documentos" ON storage.objects;
CREATE POLICY "Public o Autenticados pueden ver documentos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'documentos' );

-- Permitir a los admins SUBIR y MODIFICAR en el bucket 'documentos'
DROP POLICY IF EXISTS "Admins pueden subir documentos" ON storage.objects;
CREATE POLICY "Admins pueden subir documentos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos' AND
  EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid() OR auth_user_id = auth.uid() AND rol = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins pueden actualizar documentos" ON storage.objects;
CREATE POLICY "Admins pueden actualizar documentos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documentos' AND
  EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid() OR auth_user_id = auth.uid() AND rol = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins pueden eliminar documentos" ON storage.objects;
CREATE POLICY "Admins pueden eliminar documentos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documentos' AND
  EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid() OR auth_user_id = auth.uid() AND rol = 'admin'
  )
);

-- Refrescar el caché lógico de PostgREST
NOTIFY pgrst, 'reload schema';

-- Listo. 🚀
