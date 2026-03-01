-- ============================================================
-- Multi-tenant: empresas, RBAC por empresa, auditoria
-- ============================================================

-- 1. Tabela empresas
CREATE TABLE public.empresas (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        VARCHAR(200) NOT NULL,
  cnpj        VARCHAR(18),
  status      TEXT        NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','inativo')),
  invite_code TEXT        NOT NULL UNIQUE DEFAULT upper(substring(replace(gen_random_uuid()::text,'-',''),1,8)),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- 2. Tabela logs_auditoria
CREATE TABLE public.logs_auditoria (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  empresa_id  UUID        NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  acao        TEXT        NOT NULL CHECK (acao IN ('INSERT','UPDATE','DELETE')),
  entidade    TEXT        NOT NULL,
  entidade_id UUID,
  data_hora   TIMESTAMPTZ NOT NULL DEFAULT now(),
  detalhes    JSONB
);

ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_logs_empresa_id  ON public.logs_auditoria(empresa_id);
CREATE INDEX idx_logs_data_hora   ON public.logs_auditoria(data_hora DESC);
CREATE INDEX idx_logs_usuario_id  ON public.logs_auditoria(usuario_id);

-- 3. Extensões em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email      TEXT,
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_empresa_id ON public.profiles(empresa_id);

-- 4. Extensão em patrimonies
ALTER TABLE public.patrimonies
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_patrimonies_empresa_id ON public.patrimonies(empresa_id);

-- ============================================================
-- 5. Funções helper
-- ============================================================

-- Retorna empresa_id do usuário
CREATE OR REPLACE FUNCTION public.get_user_empresa_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT empresa_id FROM public.profiles WHERE id = _user_id;
$$;

-- ============================================================
-- 6. Atualizar handle_new_user para salvar email
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', profiles.full_name),
        email     = COALESCE(NEW.email, profiles.email);
  RETURN NEW;
END;
$$;

-- ============================================================
-- 7. Atualizar ensure_user_id para também forçar empresa_id
-- ============================================================
CREATE OR REPLACE FUNCTION public.ensure_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _empresa_id UUID;
BEGIN
  -- Forçar user_id = usuário logado
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Não é permitido definir user_id para outro usuário';
  END IF;

  -- Forçar empresa_id = empresa do usuário logado
  SELECT empresa_id INTO _empresa_id FROM public.profiles WHERE id = auth.uid();
  IF NEW.empresa_id IS NULL THEN
    NEW.empresa_id := _empresa_id;
  ELSIF NEW.empresa_id != _empresa_id THEN
    RAISE EXCEPTION 'Não é permitido definir empresa_id para outra empresa';
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 8. Função para regenerar invite_code
-- ============================================================
CREATE OR REPLACE FUNCTION public.regenerar_invite_code(_empresa_id UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _novo_code TEXT;
  _user_empresa UUID;
BEGIN
  -- Verificar que o usuário é admin da empresa
  SELECT get_user_empresa_id(auth.uid()) INTO _user_empresa;
  IF _user_empresa != _empresa_id THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem regenerar o código';
  END IF;

  _novo_code := upper(substring(replace(gen_random_uuid()::text,'-',''),1,8));
  UPDATE public.empresas SET invite_code = _novo_code WHERE id = _empresa_id;
  RETURN _novo_code;
END;
$$;

-- ============================================================
-- 9. Trigger de auditoria em patrimonies
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_patrimonio_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.logs_auditoria (usuario_id, empresa_id, acao, entidade, entidade_id, detalhes)
    VALUES (
      auth.uid(), OLD.empresa_id, 'DELETE', 'patrimonio', OLD.id,
      jsonb_build_object('number', OLD.number, 'model', OLD.model, 'status', OLD.status)
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.logs_auditoria (usuario_id, empresa_id, acao, entidade, entidade_id, detalhes)
    VALUES (
      auth.uid(), NEW.empresa_id, 'UPDATE', 'patrimonio', NEW.id,
      jsonb_build_object(
        'number', NEW.number, 'model', NEW.model,
        'status_anterior', OLD.status, 'status_novo', NEW.status
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.logs_auditoria (usuario_id, empresa_id, acao, entidade, entidade_id, detalhes)
    VALUES (
      auth.uid(), NEW.empresa_id, 'INSERT', 'patrimonio', NEW.id,
      jsonb_build_object('number', NEW.number, 'model', NEW.model, 'status', NEW.status)
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER audit_patrimonio_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.patrimonies
  FOR EACH ROW EXECUTE FUNCTION public.log_patrimonio_change();

-- ============================================================
-- 10. RLS — empresas
-- ============================================================
CREATE POLICY "Usuarios veem sua empresa"
  ON public.empresas FOR SELECT TO authenticated
  USING (id = get_user_empresa_id(auth.uid()));

-- ============================================================
-- 11. RLS — profiles: atualizar para ver colegas de empresa
-- ============================================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Usuarios veem perfis da empresa"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    empresa_id = get_user_empresa_id(auth.uid())
    OR id = auth.uid()
  );

-- ============================================================
-- 12. RLS — patrimonies: isolamento por empresa
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view all patrimonies" ON public.patrimonies;

CREATE POLICY "Usuarios veem patrimonios da empresa"
  ON public.patrimonies FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own patrimonies" ON public.patrimonies;

CREATE POLICY "Usuarios inserem patrimonios na empresa"
  ON public.patrimonies FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND empresa_id = get_user_empresa_id(auth.uid())
  );

DROP POLICY IF EXISTS "Users can update patrimonies" ON public.patrimonies;

CREATE POLICY "Usuarios atualizam patrimonios da empresa"
  ON public.patrimonies FOR UPDATE TO authenticated
  USING (
    empresa_id = get_user_empresa_id(auth.uid())
    AND (auth.uid() = user_id OR has_role(auth.uid(), 'admin'))
  );

DROP POLICY IF EXISTS "Users can delete patrimonies" ON public.patrimonies;

CREATE POLICY "Usuarios deletam patrimonios da empresa"
  ON public.patrimonies FOR DELETE TO authenticated
  USING (
    empresa_id = get_user_empresa_id(auth.uid())
    AND (auth.uid() = user_id OR has_role(auth.uid(), 'admin'))
  );

-- ============================================================
-- 13. RLS — user_roles: admins gerenciam roles da empresa
-- ============================================================
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Usuarios veem seus roles e admins veem da empresa"
  ON public.user_roles FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      has_role(auth.uid(), 'admin')
      AND user_id IN (
        SELECT id FROM public.profiles
        WHERE empresa_id = get_user_empresa_id(auth.uid())
      )
    )
  );

CREATE POLICY "Admins inserem roles na empresa"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    AND user_id IN (
      SELECT id FROM public.profiles
      WHERE empresa_id = get_user_empresa_id(auth.uid())
    )
  );

CREATE POLICY "Admins deletam roles na empresa"
  ON public.user_roles FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    AND user_id IN (
      SELECT id FROM public.profiles
      WHERE empresa_id = get_user_empresa_id(auth.uid())
    )
    AND user_id != auth.uid() -- admin não remove próprio role
  );

-- ============================================================
-- 14. RLS — logs_auditoria
-- ============================================================
CREATE POLICY "Admins veem logs da empresa"
  ON public.logs_auditoria FOR SELECT TO authenticated
  USING (
    empresa_id = get_user_empresa_id(auth.uid())
    AND has_role(auth.uid(), 'admin')
  );
