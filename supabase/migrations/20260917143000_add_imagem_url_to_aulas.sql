-- Adicionar coluna imagem_url na tabela aulas para upload de imagem ilustrativa da aula  
ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS imagem_url text; 
