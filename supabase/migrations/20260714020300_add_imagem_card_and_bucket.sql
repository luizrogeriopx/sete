-- Adiciona a coluna imagem_card na tabela cursos
ALTER TABLE public.cursos ADD COLUMN IF NOT EXISTS imagem_card TEXT;

-- Cria o bucket cursos no Supabase Storage se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('cursos', 'cursos', true)
ON CONFLICT (id) DO NOTHING;

-- Politicas para o bucket de cursos
-- 1. Leitura pública para qualquer usuário
CREATE POLICY "Public Access Cursos"
ON storage.objects FOR SELECT
USING (bucket_id = 'cursos');

-- 2. Permite inserção/atualização/exclusão apenas para administradores/staff
CREATE POLICY "Admins Manage Cursos Storage"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'cursos' AND public.is_staff(auth.uid()))
WITH CHECK (bucket_id = 'cursos' AND public.is_staff(auth.uid()));
