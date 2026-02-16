#!/bin/bash

# ==============================================================================
# SCRIPT DE BACKUP AUTOMÁTICO - SISTEMA ACCESS
# Este script realiza o dump completo do banco de dados na nuvem para o seu HD.
# ==============================================================================

# 1. Configurações
DB_URL="postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres"
BACKUP_DIR="/Users/wmelo/Axiom/backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
FILE_NAME="access_backup_$DATE.sql"

# 2. Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

echo "------------------------------------------------------------"
echo "Iniciando backup local em: $BACKUP_DIR"
echo "Data: $(date)"

# 3. Executar o dump (pg_dump)
# Nota: Usamos o caminho absoluto para garantir funcionamento via crontab
/opt/homebrew/opt/libpq/bin/pg_dump "$DB_URL" > "$BACKUP_DIR/$FILE_NAME"

# 4. Verificar se o comando foi bem sucedido
if [ $? -eq 0 ]; then
    SIZE=$(du -h "$BACKUP_DIR/$FILE_NAME" | cut -f1)
    echo "✅ Backup realizado com sucesso!"
    echo "Arquivo: $FILE_NAME ($SIZE)"
    
    # 5. Rotação: Apagar backups com mais de 180 dias (6 meses)
    echo "Limpando backups antigos (mais de 180 dias)..."
    find "$BACKUP_DIR" -name "access_backup_*.sql" -mtime +180 -exec rm {} \;
    echo "Pronto."
else
    echo "❌ ERRO: Falha ao gerar o backup."
    echo "Certifique-se de que o 'pg_dump' está instalado no seu sistema."
    exit 1
fi
echo "------------------------------------------------------------"
