-- ==============================================================================
-- ACTULIZACIÓN: REFACTORIZACIÓN A LOGIN COMPARTIDO (V2)
-- Ejecuta este script sobre la base de datos existente para migrar la arquitectura.
-- ==============================================================================

-- 1. Desvincular 'perfiles.id' de 'auth.users' y crear columna 'auth_user_id'
ALTER TABLE public.perfiles DROP CONSTRAINT IF EXISTS perfiles_id_fkey;
ALTER TABLE public.perfiles ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Asegurarse de que `id` en perfiles siga siendo la primary key por defecto (generador uuid si fuera nuevo)
ALTER TABLE public.perfiles ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- 2. Eliminar funciones RLS obsoletas y reemplazarlas con la nueva lógica central
-- (Quitamos los DROP explícitos para no romper las dependencias actuales con las políticas)

-- Nuevo método: Cuando un usuario está logueado en Supabase (`auth.uid()`) buscaremos a qué condominio está asignado este CAJERO o ADMIN en la tabla perfiles, o bien, si es la "cuenta genérica" de un condominio entero.
CREATE OR REPLACE FUNCTION auth_user_condominio_id()
RETURNS UUID AS $$
  -- Retorna el condominio de los perfiles asociados a ese auth.uid(). Asumimos 1 correo compartido por condominio (o 1 correo admin por condominio)
  SELECT condominio_id FROM public.perfiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
  -- Retorna el rol del primer perfil que encuentre (es decir, admin, o si es la cuenta compartida devuelve propietario)
  SELECT rol FROM public.perfiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;


-- 3. Actualizar o recrear las políticas de Perfiles
DROP POLICY IF EXISTS "Admins gestionan perfiles de su condominio" ON perfiles;
DROP POLICY IF EXISTS "Propietarios ven su perfil o el perfil admin" ON perfiles;

CREATE POLICY "Admins gestionan perfiles de su condominio" ON perfiles
  FOR ALL USING (condominio_id = auth_user_condominio_id() AND auth_user_role() = 'admin');

-- Propietarios pueden ver TODOS los perfiles de su edificio (necesario para la pantalla de validación de cédula que buscará coincidencia de perfiles en el mismo edificio del login). 
-- Restringiremos las consultas al nivel de la App (Backend Actions)
CREATE POLICY "Asignados al condominio ven todos los perfiles de su condominio" ON perfiles
  FOR SELECT USING (condominio_id = auth_user_condominio_id());


-- NOTA: Para poblar ahora un condominio:
-- 1. Creas auth.users "vecinos@condominio.com" (ID: 1111)
-- 2. Creas condominios "Los Parques" (ID: XYZ)
-- 3. Haces INSERT INTO perfiles (..., auth_user_id) VALUES (..., '1111') EN TODOS LOS PERFILES DE ESE EDIFICIO para que todos estén unidos al mismo login maestro.
