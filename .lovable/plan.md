# Plano de Reestruturação do Menu de Cursos e Categorias

Este plano descreve as alterações necessárias para transformar o link "Cursos" em um menu suspenso (dropdown) com categorias específicas, além de garantir que a exibição dos cursos siga o estilo "Netflix" solicitado.

## Alterações Propostas

### 1. Menu de Navegação (Header)
- Transformar o link simples "Cursos" em um componente de menu suspenso.
- O submenu conterá as categorias:
    - **FORMAÇÃO TEOLÓGICA**
    - **FORMAÇÃO MINISTERIAL** (Substituindo a referência anterior a EME)
    - **CURSOS DE EXTENSÃO**
- Cada item do submenu levará o usuário para a página de cursos filtrada por essa categoria.

### 2. Página de Cursos (Catálogo)
- Assegurar que ao clicar em uma categoria no menu, o usuário veja apenas os cursos daquela categoria.
- Manter e aprimorar o layout estilo "Netflix" (fileiras horizontais roláveis por categoria ou grade visual de posters).
- Garantir que a terminologia "Formação Ministerial" seja refletida corretamente nas labels e filtros.

### 3. Banco de Dados e Backend
- Criar ou ajustar as categorias no banco de dados para corresponderem exatamente aos nomes solicitados:
    - `formacao-teologica`
    - `formacao-ministerial`
    - `cursos-extensao`

## Detalhes Técnicos

### Componentes UI
- Utilizar `DropdownMenu` ou `NavigationMenu` no `SiteHeader` em `src/components/site/site-chrome.tsx`.
- Atualizar a lógica de filtragem em `src/routes/cursos.index.tsx` para aceitar parâmetros de busca (ex: `?categoria=slug`) facilitando o link direto do menu.

### Database (Supabase)
- Executar uma migração para garantir que as categorias existam:
```sql
INSERT INTO public.categorias (nome, slug, ordem)
VALUES 
('FORMAÇÃO TEOLÓGICA', 'formacao-teologica', 1),
('FORMAÇÃO MINISTERIAL', 'formacao-ministerial', 2),
('CURSOS DE EXTENSÃO', 'cursos-extensao', 3)
ON CONFLICT (slug) DO UPDATE SET nome = EXCLUDED.nome;
```

## Próximos Passos
1. Implementar o Dropdown no `SiteHeader`.
2. Ajustar a página de cursos para lidar com a navegação direta por categoria via search params.
3. Atualizar as categorias no banco de dados via migração.
