INSERT INTO public.categorias (nome, slug, ordem)
VALUES 
('FORMAÇÃO TEOLÓGICA', 'formacao-teologica', 1),
('FORMAÇÃO MINISTERIAL', 'formacao-ministerial', 2),
('CURSOS DE EXTENSÃO', 'cursos-extensao', 3)
ON CONFLICT (slug) DO UPDATE SET nome = EXCLUDED.nome;