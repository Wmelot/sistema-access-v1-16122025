-- Add organization_id to message_logs table
-- This allows proper multi-tenant isolation of message history

-- Check if column exists first
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'message_logs' 
        AND column_name = 'organization_id'
    ) THEN
        -- Add column
        ALTER TABLE message_logs 
        ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        
        -- Add index for performance
        CREATE INDEX IF NOT EXISTS idx_message_logs_organization_id 
        ON message_logs(organization_id);
        
        RAISE NOTICE '✅ Coluna organization_id adicionada à tabela message_logs';
    ELSE
        RAISE NOTICE '⚠️  Coluna organization_id já existe';
    END IF;
END $$;
