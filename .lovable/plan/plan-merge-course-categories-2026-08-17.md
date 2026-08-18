# Plan: Merge Course Categories

The user wants to merge specific course categories:
1.  **TEOLOGIA** (old) -> **FORMAÇÃO TEOLÓGICA** (new/current)
2.  **EME** (old) -> **FORMAÇÃO MINISTERIAL** (new/current)
3.  **EXTENSÃO** (old) -> **CURSOS DE EXTENSÃO** (new/current)

Based on the codebase, we already have `FORMAÇÃO TEOLÓGICA`, `FORMAÇÃO MINISTERIAL`, and `CURSOS DE EXTENSÃO` in the `categorias` table. The goal is to ensure all courses previously associated with the old category names (if they exist as data or logic) are moved to the new categories, and any remaining references to the old names are removed.

## Proposed Changes

### Database Migration
- Identify if there are any duplicate categories in the `categorias` table (e.g., both "TEOLOGIA" and "FORMAÇÃO TEOLÓGICA").
- Update all `cursos` that reference the old category IDs to point to the new category IDs.
- Delete the old categories from the `categorias` table.
- Ensure the `slug` and `nome` of the new categories are correct.

### Codebase Verification
- Verify that `src/components/site/site-chrome.tsx` and `src/routes/cursos.index.tsx` use the correct category names and slugs. (Already verified in initial inspection, they seem to use the new names).

## Technical Details
- SQL migration to:
    - Update courses belonging to 'TEOLOGIA' to 'FORMAÇÃO TEOLÓGICA'.
    - Update courses belonging to 'EME' to 'FORMAÇÃO MINISTERIAL'.
    - Update courses belonging to 'EXTENSÃO' to 'CURSOS DE EXTENSÃO'.
    - Clean up duplicate/old category rows.

## User Review Required
> [!IMPORTANT]
> The migration will permanently reassign courses from the old category names to the new ones. If you have specific courses that should NOT be merged this way, please let me know.
