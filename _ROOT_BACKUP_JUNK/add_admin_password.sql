-- Add admin_password column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS admin_password TEXT;

-- Add comment
COMMENT ON COLUMN profiles.admin_password IS 'Senha administrativa para ações sensíveis (excluir, arquivar, etc). Independente do método de login (WebAuthn/Password).';
