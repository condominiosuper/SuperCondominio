-- ACTULIZACIÓN RLS PARA PAGOS (Ajuste de Cuentas Compartidas Fase 6)
-- Corre esto en el Editor SQL de Supabase para arreglar el Guardado de Pagos.

-- 1. Eliminar políticas viejas que comparaban `perfil_id` directo con `auth.uid()`
DROP POLICY IF EXISTS "Propietarios ven sus propios reportes de pago" ON public.pagos_reportados;
DROP POLICY IF EXISTS "Propietarios crean sus reportes de pago" ON public.pagos_reportados;

-- 2. Crear las nuevas políticas que validan si el `perfil_id` pertenece al `auth.uid()` (vecinos@condominio compartidos)
CREATE POLICY "Propietarios ven sus propios reportes de pago" ON public.pagos_reportados
  FOR SELECT USING (
    perfil_id IN (SELECT id FROM public.perfiles WHERE auth_user_id = auth.uid()) 
    AND condominio_id = auth_user_condominio_id()
  );

CREATE POLICY "Propietarios crean sus reportes de pago" ON public.pagos_reportados
  FOR INSERT WITH CHECK (
    perfil_id IN (SELECT id FROM public.perfiles WHERE auth_user_id = auth.uid()) 
    AND condominio_id = auth_user_condominio_id()
  );
