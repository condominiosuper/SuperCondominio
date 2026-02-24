/* 
  SCRIPT DE DATos SEMILLA (TESTING) 
  Ejecuta esto en el SQL Editor de Supabase LUEGO de haber creado los usuarios en "Authentication".

  INSTRUCCIONES PREVIAS:
  1. Ve a Supabase -> Authentication -> Add User -> Create New User
  2. Crea dos usuarios con estas credenciales:
     - admin@condo.com / 123456
     - vecinos@condo.com / 123456
  3. Copia el UUID (User UID) de admin@condo.com y reemplázalo donde dice 'UUID_DEL_ADMIN_AQUI'
  4. Copia el UUID (User UID) de vecinos@condo.com y reemplázalo donde dice 'UUID_DE_VECINOS_AQUI'
  5. ¡Corre este script!
*/

-- Variables (Reemplázalas antes de correr)
DO $$ 
DECLARE
    -- !!!!!!! CAMBIA ESTO !!!!!!!
    id_usuario_admin UUID := 'f3adc6f5-c843-4e52-b4c2-f8abcb5d0019'; 
    id_usuario_vecinos UUID := '0def1a61-68cc-4895-bee2-8c0e13c7b239';
    
    -- Variables internas
    id_condominio UUID;
    id_perfil_admin UUID;
    id_perfil_prop_1 UUID;
    id_perfil_prop_2 UUID;
    id_perfil_prop_3 UUID;
BEGIN

    -- 1. Intentar obtener el Condominio si ya existe, o crearlo si no.
    SELECT id INTO id_condominio FROM public.condominios WHERE rif = 'J-12345678-9' LIMIT 1;
    
    IF id_condominio IS NULL THEN
        INSERT INTO public.condominios (nombre, rif)
        VALUES ('Residencias El Parque', 'J-12345678-9')
        RETURNING id INTO id_condominio;
    END IF;

    -- 2. Crear Perfil Administrador
    SELECT id INTO id_perfil_admin FROM public.perfiles WHERE cedula = 'V-ADMIN1' LIMIT 1;
    IF id_perfil_admin IS NULL THEN
        INSERT INTO public.perfiles (auth_user_id, condominio_id, rol, cedula, nombres, apellidos)
        VALUES (id_usuario_admin, id_condominio, 'admin', 'V-ADMIN1', 'Admin', 'Principal')
        RETURNING id INTO id_perfil_admin;
    END IF;

    -- 3. Crear 3 Perfiles de Propietarios (¡Todos unidos a la misma cuenta compartida de 'vecinos'!)
    
    -- Propietario 1 (Solvente)
    SELECT id INTO id_perfil_prop_1 FROM public.perfiles WHERE cedula = 'V-10101010' LIMIT 1;
    IF id_perfil_prop_1 IS NULL THEN
        INSERT INTO public.perfiles (auth_user_id, condominio_id, rol, cedula, nombres, apellidos, telefono, estado_solvencia)
        VALUES (id_usuario_vecinos, id_condominio, 'propietario', 'V-10101010', 'Carlos', 'Propietario A', '04120000001', true)
        RETURNING id INTO id_perfil_prop_1;
    END IF;

    -- Propietario 2 (Moroso)
    SELECT id INTO id_perfil_prop_2 FROM public.perfiles WHERE cedula = 'E-20202020' LIMIT 1;
    IF id_perfil_prop_2 IS NULL THEN
        INSERT INTO public.perfiles (auth_user_id, condominio_id, rol, cedula, nombres, apellidos, telefono, estado_solvencia)
        VALUES (id_usuario_vecinos, id_condominio, 'propietario', 'E-20202020', 'Maria', 'Propietario B', '04140000002', false)
        RETURNING id INTO id_perfil_prop_2;
    END IF;

    -- Propietario 3 (Solvente)
    SELECT id INTO id_perfil_prop_3 FROM public.perfiles WHERE cedula = 'V-30303030' LIMIT 1;
    IF id_perfil_prop_3 IS NULL THEN
        INSERT INTO public.perfiles (auth_user_id, condominio_id, rol, cedula, nombres, apellidos, telefono, estado_solvencia)
        VALUES (id_usuario_vecinos, id_condominio, 'propietario', 'V-30303030', 'Jose', 'Propietario C', '04160000003', true)
        RETURNING id INTO id_perfil_prop_3;
    END IF;

    -- ==========================================
    -- 4. Crear Inmuebles asociados a los perfiles
    -- ==========================================

    INSERT INTO public.inmuebles (condominio_id, propietario_id, identificador, alicuota)
    VALUES 
    (id_condominio, id_perfil_prop_1, 'Torre A - A-11', 0.0150),
    (id_condominio, id_perfil_prop_2, 'Torre B - B-22', 0.0200),
    (id_condominio, id_perfil_prop_3, 'Torre C - C-33', 0.0125);

END $$;
