-- Cria o bucket perfis no Supabase Storage se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('perfis', 'perfis', true)
ON CONFLICT (id) DO NOTHING;

-- Politicas para o bucket de perfis
-- 1. Leitura pública para qualquer usuário
CREATE POLICY "Public Access Perfis"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'perfis');

-- 2. Permite inserção/atualização/exclusão para qualquer usuário autenticado
CREATE POLICY "Users Manage Perfis Storage"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'perfis')
WITH CHECK (bucket_id = 'perfis');
