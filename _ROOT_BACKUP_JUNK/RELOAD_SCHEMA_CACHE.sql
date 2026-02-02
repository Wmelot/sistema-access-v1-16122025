-- ============================================
-- 🔄 RELOAD SCHEMA CACHE - SUPABASE
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- para forçar o reload do schema cache
-- ============================================

-- Método 1: NOTIFY (recomendado)
NOTIFY pgrst, 'reload schema';

-- Método 2: Se o método 1 não funcionar, tente este:
-- SELECT pg_notify('pgrst', 'reload schema');

-- ============================================
-- ✅ APÓS EXECUTAR:
-- 1. Aguarde 10-30 segundos
-- 2. Volte para o terminal
-- 3. Execute: npx tsx check-real-schema.ts
-- ============================================
