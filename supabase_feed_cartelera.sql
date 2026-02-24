-- ==============================================================================
-- SQL MIGRACIÓN - SAAS CONDOMINIOS VENEZUELA
-- FASE 25: Feed Dinámico de Cartelera de Anuncios
-- ==============================================================================

-- 1. Añadimos la columna 'categoria' a nuestra tabla existente de cartelera_anuncios.
-- Categorías sugeridas (usar en UI Front-End): 'General', 'Mantenimiento', 'Finanzas', 'Normativa', 'Urgente'
ALTER TABLE public.cartelera_anuncios
ADD COLUMN categoria VARCHAR(50) DEFAULT 'General';

-- (Opcional) Limpieza de anuncios de prueba viejos
-- DELETE FROM public.cartelera_anuncios;
