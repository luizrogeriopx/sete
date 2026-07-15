-- Cria o bucket cursos no Supabase Storage se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('cursos', 'cursos', true)
ON CONFLICT (id) DO NOTHING;
