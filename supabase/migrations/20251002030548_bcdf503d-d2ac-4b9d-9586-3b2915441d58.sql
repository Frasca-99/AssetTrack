-- Criar tabela de patrimônios
CREATE TABLE public.patrimonies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  registered_by TEXT NOT NULL,
  observations TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  location TEXT NOT NULL,
  custom_location TEXT,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.patrimonies ENABLE ROW LEVEL SECURITY;

-- Policy para permitir SELECT (leitura pública)
CREATE POLICY "Permitir leitura pública de patrimônios"
  ON public.patrimonies
  FOR SELECT
  USING (true);

-- Policy para permitir INSERT (criação pública)
CREATE POLICY "Permitir criação pública de patrimônios"
  ON public.patrimonies
  FOR INSERT
  WITH CHECK (true);

-- Policy para permitir UPDATE (atualização pública)
CREATE POLICY "Permitir atualização pública de patrimônios"
  ON public.patrimonies
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy para permitir DELETE (exclusão pública)
CREATE POLICY "Permitir exclusão pública de patrimônios"
  ON public.patrimonies
  FOR DELETE
  USING (true);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.patrimonies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Criar índice para melhorar performance de buscas por número
CREATE INDEX idx_patrimonies_number ON public.patrimonies(number);
CREATE INDEX idx_patrimonies_registered_at ON public.patrimonies(registered_at DESC);