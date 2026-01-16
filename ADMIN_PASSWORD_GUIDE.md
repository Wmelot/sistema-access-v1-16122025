# 🔐 Guia Completo: Senha Administrativa

## 📋 Entendendo o Problema

### Por que não consigo mudar minha senha?
Você usa **WebAuthn/FaceID** para fazer login, então não tem uma "senha tradicional" no Supabase Auth. Por isso, a função "Atualizar Senha" não funciona.

### Qual senha devo usar para excluir coisas?

Existem **2 opções**:

1. **Senha Administrativa** (Recomendado)
   - Senha separada, só para ações sensíveis
   - Funciona mesmo usando FaceID
   - Precisa ser configurada manualmente

2. **Senha de Login** (Não funciona para você)
   - Você não tem porque usa FaceID
   - Não é possível criar uma agora sem quebrar o FaceID

---

## ✅ Solução: Configurar Senha Administrativa

### Opção 1: Via SQL (Rápido)

Execute este comando para definir a senha administrativa como **"admin123"**:

```sql
UPDATE profiles 
SET admin_password = 'admin123'
WHERE email = 'wmelot@gmail.com';
```

**Como executar:**
1. Vá em **Configurações > Integrações (Migração)**
2. Cole o SQL acima
3. Execute

**Depois:**
- Use **"admin123"** para excluir serviços, produtos, etc.
- Você pode trocar essa senha depois

---

### Opção 2: Via Interface (Mais Seguro)

Vou criar uma página para você definir a senha administrativa com hash (mais seguro).

**Localização:** Configurações de Perfil > Segurança > Senha Administrativa

---

## 🎯 Como Usar a Senha Administrativa

1. **Para Excluir Serviço:**
   - Clique em "Excluir"
   - Digite: **admin123** (ou a senha que você definiu)
   - Confirme

2. **Para Outras Ações Sensíveis:**
   - Mesma senha funciona para:
     - Excluir produtos
     - Arquivar pacientes
     - Excluir profissionais
     - Etc.

---

## 🔄 Diferença entre Master e Admin

Você está correto! Vamos alinhar:

| Termo | Significado | Você é? |
|-------|-------------|---------|
| **Master** | Super Admin do Sistema | ✅ Sim |
| **Admin** | Administrador da Clínica | ✅ Sim (mesmo usuário) |

**Conclusão:** Você é **Master** E **Admin** ao mesmo tempo. São apenas nomes diferentes para o mesmo nível de acesso.

---

## 🚀 Próximos Passos

1. **Execute o SQL acima** para definir senha "admin123"
2. **Teste excluir um serviço** usando "admin123"
3. **Depois, troque para uma senha mais forte** (opcional)

---

**Precisa de ajuda para executar o SQL?** Me avise que eu executo para você!
