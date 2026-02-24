-- Agrega o corre esto en Supabase SQL Editor para crear el BUCKET de almacenamiento.
-- 1. Crear el bucket si no existe (Hacerlo público para poder ver los recibos por URL sin firmar)
insert into storage.buckets (id, name, public)
values ('comprobantes_pago', 'comprobantes_pago', true)
on conflict (id) do nothing;

-- Asegúrate de que las políticas de STORAGE estén activas
CREATE POLICY "Propietarios pueden subir comprobantes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'comprobantes_pago' 
    -- idealmente validar auth.uid()
  );

CREATE POLICY "Cualquiera puede ver comprobantes publicos"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'comprobantes_pago' );
