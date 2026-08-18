-- 1. Mover cursos das categorias antigas para as novas
-- Teologia (e7384566-a912-4492-b6c3-3661c62662cf) -> FORMAÇÃO TEOLÓGICA (3b350ddb-202a-4f0a-a2d1-2c1afb21f31c)
UPDATE public.cursos 
SET categoria_id = '3b350ddb-202a-4f0a-a2d1-2c1afb21f31c' 
WHERE categoria_id = 'e7384566-a912-4492-b6c3-3661c62662cf';

-- EME (8acc3976-a0c3-445f-94da-9493e362d6e4) -> FORMAÇÃO MINISTERIAL (00b98359-f6a7-44ad-b874-1983f8afb42f)
UPDATE public.cursos 
SET categoria_id = '00b98359-f6a7-44ad-b874-1983f8afb42f' 
WHERE categoria_id = '8acc3976-a0c3-445f-94da-9493e362d6e4';

-- Extensão (121f21bc-0f74-4d96-9726-3b6be633815a) -> CURSOS DE EXTENSÃO (889a47fd-e5f9-4a27-b7fb-266087f6483a)
UPDATE public.cursos 
SET categoria_id = '889a47fd-e5f9-4a27-b7fb-266087f6483a' 
WHERE categoria_id = '121f21bc-0f74-4d96-9726-3b6be633815a';

-- 2. Remover categorias antigas
DELETE FROM public.categorias 
WHERE id IN (
  'e7384566-a912-4492-b6c3-3661c62662cf', -- Teologia
  '8acc3976-a0c3-445f-94da-9493e362d6e4', -- EME
  '121f21bc-0f74-4d96-9726-3b6be633815a'  -- Extensão
);

-- 3. Ajustar ordem das categorias para garantir a sequência correta
UPDATE public.categorias SET ordem = 1 WHERE id = '3b350ddb-202a-4f0a-a2d1-2c1afb21f31c'; -- FORMAÇÃO TEOLÓGICA
UPDATE public.categorias SET ordem = 2 WHERE id = '00b98359-f6a7-44ad-b874-1983f8afb42f'; -- FORMAÇÃO MINISTERIAL
UPDATE public.categorias SET ordem = 3 WHERE id = '889a47fd-e5f9-4a27-b7fb-266087f6483a'; -- CURSOS DE EXTENSÃO
