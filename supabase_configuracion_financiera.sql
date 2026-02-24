-- =========================================================================================
-- SCRIPT DE ACTUALIZACIÓN: FASE 16 - CONFIGURACIÓN FINANCIERA (MENSUALIDAD Y FECHA COBRO)
-- =========================================================================================
-- Ejecutar en el Editor SQL de Supabase para añadir los campos al Panel de Finanzas.

-- 1. Añadir campos a la tabla condominios (Monto Mensual base y Día de corte)
ALTER TABLE public.condominios 
ADD COLUMN IF NOT EXISTS monto_mensual_usd NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS dia_cobro INTEGER DEFAULT 1;

-- Asegurar validación de que el dia de cobro sea un número entre 1 y 31
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.check_constraints 
        WHERE constraint_name = 'chk_dia_cobro'
    ) THEN
        ALTER TABLE public.condominios
        ADD CONSTRAINT chk_dia_cobro CHECK (dia_cobro >= 1 AND dia_cobro <= 31);
    END IF;
END $$;

-- 2. Refrescar el caché lógico de PostgREST
NOTIFY pgrst, 'reload schema';

-- Listo. 🚀
