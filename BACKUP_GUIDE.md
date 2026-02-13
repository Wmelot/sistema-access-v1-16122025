# 🛡️ Guia de Backup Automático (Local)

Este guia explica como configurar o seu computador para salvar uma cópia completa do sistema Access todos os dias automaticamente.

## 1. Pré-requisito: Instalação do PostgreSQL
O script utiliza o comando `pg_dump`. Caso você não o tenha instalado, abra o seu terminal e execute:

```bash
# Se você usa Homebrew (Recomendado):
brew install libpq
brew link --force libpq

# Ou instale o instalador oficial:
# https://www.postgresql.org/download/macosx/
```

## 2. Como agendar o Backup Diário
No Mac, usamos o `crontab` para agendar tarefas.

1. Abra o terminal.
2. Digite: `crontab -e`.
3. Pressione a tecla `i` para entrar no modo de edição.
4. Cole a linha abaixo (ela executará o backup todos os dias às 23:00):

```bash
00 23 * * * /Users/wmelo/Axiom/scripts/daily_backup.sh >> /Users/wmelo/Axiom/backups/log.txt 2>&1
```

5. Pressione `Esc`, digite `:wq` e dê `Enter`.

## 3. Localização dos Backups
Os arquivos serão salvos na pasta:
`/Users/wmelo/Axiom/backups/`

O script mantém apenas os últimos **30 dias** de backup para economizar espaço no seu HD. No final de cada mês, você pode simplesmente copiar esta pasta para um HD Externo.

---
*Configurado via script: `scripts/daily_backup.sh`*
