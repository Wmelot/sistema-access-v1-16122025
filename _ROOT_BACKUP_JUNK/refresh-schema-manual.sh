#!/bin/bash

echo "🔄 FORÇANDO REFRESH DO SCHEMA CACHE - MÉTODO ALTERNATIVO..."
echo ""

# Método 1: Enviar sinal SIGUSR1 para o PostgREST via endpoint admin
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔵 BASE ATUAL (robptuukezhqvtasjyhz) - Tentando NOTIFY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Tentar via endpoint de health/admin
curl -v -X GET 'https://robptuukezhqvtasjyhz.supabase.co/rest/v1/' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4" \
  -H "Prefer: schema-reload=true" 2>&1 | grep -i "schema\|cache\|reload" || echo "Endpoint acessado"

echo ""
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 SOLUÇÃO MANUAL RECOMENDADA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "O cache do Supabase precisa ser atualizado manualmente via Dashboard:"
echo ""
echo "1. Acesse: https://supabase.com/dashboard/project/robptuukezhqvtasjyhz"
echo "2. Vá em: Settings > API > Schema Cache"
echo "3. Clique em: 'Reload Schema Cache'"
echo ""
echo "OU execute este SQL no SQL Editor:"
echo ""
echo "   NOTIFY pgrst, 'reload schema';"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
