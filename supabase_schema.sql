-- ==============================================================================
-- SQL DDL PARA SUPABASE - SAAS CONDOMINIOS VENEZUELA
-- ==============================================================================

-- Habilitar extensión UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. TABLAS
-- ------------------------------------------------------------------------------

-- Tabla: condominios
CREATE TABLE condominios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  rif VARCHAR(50) UNIQUE NOT NULL,
  porcentaje_mora DECIMAL(5,2) DEFAULT 0.00,
  multa_fija DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tipo ENUM para roles de usuario
CREATE TYPE user_role AS ENUM ('admin', 'propietario');

-- Tabla: perfiles (Extiende de auth.users)
CREATE TABLE perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  rol user_role NOT NULL DEFAULT 'propietario',
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  cedula VARCHAR(20) NOT NULL,
  telefono VARCHAR(20),
  estado_solvencia BOOLEAN DEFAULT true, -- true = solvente, false = moroso
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (condominio_id, cedula)
);

-- Tabla: inmuebles
CREATE TABLE inmuebles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  identificador VARCHAR(50) NOT NULL, -- Ej: "Apt 4B", "Casa 12"
  alicuota DECIMAL(5,4) NOT NULL, -- Porcentaje de participación (0.0000 a 1.0000)
  propietario_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: recibos_cobro
CREATE TABLE recibos_cobro (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  inmueble_id UUID NOT NULL REFERENCES inmuebles(id) ON DELETE CASCADE,
  mes VARCHAR(20) NOT NULL, -- Ej: "Octubre 2023"
  monto_usd DECIMAL(10,2) NOT NULL,
  monto_pagado_usd DECIMAL(10,2) DEFAULT 0.00,
  estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, pagado, moroso
  fecha_emision DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: tasa_bcv
CREATE TABLE tasa_bcv (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tasa DECIMAL(10,4) NOT NULL,
  fecha DATE UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: pagos_reportados
CREATE TABLE pagos_reportados (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  recibo_id UUID REFERENCES recibos_cobro(id) ON DELETE CASCADE,
  perfil_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  monto_bs DECIMAL(10,2) NOT NULL,
  tasa_aplicada DECIMAL(10,4) NOT NULL,
  monto_equivalente_usd DECIMAL(10,2) NOT NULL,
  referencia VARCHAR(50) NOT NULL,
  fecha_pago DATE NOT NULL,
  banco_origen VARCHAR(50) NOT NULL,
  banco_destino VARCHAR(50) NOT NULL,
  capture_url TEXT NOT NULL,
  estado VARCHAR(20) DEFAULT 'en_revision', -- en_revision, aprobado, rechazado
  nota_admin TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: tickets_soporte
CREATE TABLE tickets_soporte (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  perfil_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  asunto VARCHAR(200) NOT NULL,
  descripcion TEXT NOT NULL,
  foto_url TEXT,
  estado VARCHAR(20) DEFAULT 'abierto', -- abierto, en_proceso, cerrado
  respuesta_admin TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: cartelera_anuncios
CREATE TABLE cartelera_anuncios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  contenido TEXT NOT NULL,
  fijado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ------------------------------------------------------------------------------
-- 2. FUNCIONES Y TRIGGERS DE ACTUALIZACIÓN
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_condominios_modtime BEFORE UPDATE ON condominios FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_perfiles_modtime BEFORE UPDATE ON perfiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_inmuebles_modtime BEFORE UPDATE ON inmuebles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_recibos_cobro_modtime BEFORE UPDATE ON recibos_cobro FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_pagos_reportados_modtime BEFORE UPDATE ON pagos_reportados FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tickets_modtime BEFORE UPDATE ON tickets_soporte FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_cartelera_anuncios_modtime BEFORE UPDATE ON cartelera_anuncios FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();


-- ------------------------------------------------------------------------------
-- 3. ACTIVACIÓN RLS Y SEGURIDAD
-- ------------------------------------------------------------------------------
ALTER TABLE condominios ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inmuebles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recibos_cobro ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasa_bcv ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_reportados ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets_soporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartelera_anuncios ENABLE ROW LEVEL SECURITY;


-- Funciones Auxiliares para consultar el Condominio y Rol del usuario logueado en RLS
CREATE OR REPLACE FUNCTION auth_user_condominio_id()
RETURNS UUID AS $$
  SELECT condominio_id FROM public.perfiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
  SELECT rol FROM public.perfiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;


-- ------------------------------------------------------------------------------
-- 4. POLÍTICAS ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------

-- NOTA: Asumimos que todo usuario logueado posee un registro en `perfiles`.
-- Los usuarios no autenticados (Anónimos) no tienen acceso, a menos que se defina la política para consulta libre (como en el Portal).

-- -- 4.1. Condominios
CREATE POLICY "Admins pueden ver y editar su propio condominio" ON condominios
  FOR ALL USING (id = auth_user_condominio_id() AND auth_user_role() = 'admin');

CREATE POLICY "Propietarios pueden ver su propio condominio" ON condominios
  FOR SELECT USING (id = auth_user_condominio_id());

-- -- 4.2. Perfiles
CREATE POLICY "Admins gestionan perfiles de su condominio" ON perfiles
  FOR ALL USING (condominio_id = auth_user_condominio_id() AND auth_user_role() = 'admin');

CREATE POLICY "Propietarios ven su perfil o el perfil admin" ON perfiles
  FOR SELECT USING (id = auth.uid() OR (condominio_id = auth_user_condominio_id() AND rol = 'admin'));

CREATE POLICY "Propietarios pueden actualizar su propio perfil" ON perfiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Acceso Anónimo Portal: permitimos lectura de perfil por cedula para todos, útil para consulta de saldos en app Edge/Edge Function o API publica si fuera directo." ON perfiles
  FOR SELECT USING (true);
-- Si la consulta publica de cedula se hace por medio de una API / Route handler, se puede utilizar el Service Role Key del lado del servidor.

-- -- 4.3. Inmuebles
CREATE POLICY "Admins gestionan inmuebles de su condominio" ON inmuebles
  FOR ALL USING (condominio_id = auth_user_condominio_id() AND auth_user_role() = 'admin');

CREATE POLICY "Propietarios pueden ver los inmuebles de su condominio" ON inmuebles
  FOR SELECT USING (condominio_id = auth_user_condominio_id());

-- -- 4.4. Recibos_cobro
CREATE POLICY "Admins gestionan recibos de su condominio" ON recibos_cobro
  FOR ALL USING (condominio_id = auth_user_condominio_id() AND auth_user_role() = 'admin');

CREATE POLICY "Propietarios ven recibos de sus inmuebles" ON recibos_cobro
  FOR SELECT USING (
    inmueble_id IN (SELECT id FROM inmuebles WHERE propietario_id = auth.uid())
    AND condominio_id = auth_user_condominio_id()
  );

-- -- 4.5. Tasa BCV
-- Todos los usuarios pueden leer la tasa BCV (incluso anónimos para la ruta pública)
CREATE POLICY "Lectura pública de tasa BCV" ON tasa_bcv
  FOR SELECT USING (true);
-- Insertar / Modificar reservado para cron job usando SERVICE_ROLE. No damos persistencia pública.

-- -- 4.6. Pagos Reportados
CREATE POLICY "Admins gestionan pagos de su condominio" ON pagos_reportados
  FOR ALL USING (condominio_id = auth_user_condominio_id() AND auth_user_role() = 'admin');

CREATE POLICY "Propietarios ven sus propios reportes de pago" ON pagos_reportados
  FOR SELECT USING (perfil_id = auth.uid() AND condominio_id = auth_user_condominio_id());

CREATE POLICY "Propietarios crean sus reportes de pago" ON pagos_reportados
  FOR INSERT WITH CHECK (perfil_id = auth.uid() AND condominio_id = auth_user_condominio_id());

-- -- 4.7. Tickets de Soporte
CREATE POLICY "Admins gestionan todos los tickets de su condominio" ON tickets_soporte
  FOR ALL USING (condominio_id = auth_user_condominio_id() AND auth_user_role() = 'admin');

CREATE POLICY "Propietarios ven soporte generados por ellos mismos" ON tickets_soporte
  FOR SELECT USING (perfil_id = auth.uid() AND condominio_id = auth_user_condominio_id());

CREATE POLICY "Propietarios abren tickets de soporte" ON tickets_soporte
  FOR INSERT WITH CHECK (perfil_id = auth.uid() AND condominio_id = auth_user_condominio_id());

CREATE POLICY "Propietarios responden sus tickets" ON tickets_soporte
  FOR UPDATE USING (perfil_id = auth.uid() AND condominio_id = auth_user_condominio_id());

-- -- 4.8. Cartelera Anuncios
CREATE POLICY "Admins gestionan la cartelera de su condominio" ON cartelera_anuncios
  FOR ALL USING (condominio_id = auth_user_condominio_id() AND auth_user_role() = 'admin');

CREATE POLICY "Propietarios leen la cartelera" ON cartelera_anuncios
  FOR SELECT USING (condominio_id = auth_user_condominio_id());
