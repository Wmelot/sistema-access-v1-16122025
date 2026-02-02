
# Guia: Adicionar Variáveis na Vercel

Se o seu site está hospedado na Vercel, você precisa configurar as "Senhas" (Variáveis de Ambiente) lá para que o site em produção saiba quais chaves usar.

## 1. Pegue os valores no seu computador
Primeiro, abra o arquivo `.env.local` (ou `.env`) no seu VS Code. Procure por estas duas linhas e **copie os valores** (o texto depois do `=`):

```
GOOGLE_PLACES_API_KEY=...
GOOGLE_PLACE_ID=...
```

## 2. Acesse a Vercel
1. Vá para [vercel.com/dashboard](https://vercel.com/dashboard).
2. Clique no **Projeto** do seu sistema (Sistema Access).
3. No menu superior, clique em **Settings** (Configurações).

## 3. Adicione as Variáveis
1. Na barra lateral esquerda, clique em **Environment Variables**.
2. Você verá campos para "Key" (Nome) e "Value" (Valor).
3. **Adicione a primeira:**
   *   **Key:** `GOOGLE_PLACES_API_KEY`
   *   **Value:** (Cole a chave enorme que começa com `AIza...` que você copiou do seu arquivo local)
   *   Clique em **Save** (ou Add).
4. **Adicione a segunda:**
   *   **Key:** `GOOGLE_PLACE_ID`
   *   **Value:** (Cole o ID do lugar, geralmente começa com `ChIJ...`)
   *   Clique em **Save** (ou Add).

## 4. Redeploy (IMPORTANTE)
Depois de salvar as variáveis, elas **não funcionam imediatamente** no site que já está no ar. Você precisa fazer um novo deploy para elas entrarem em vigor.

1. Vá na aba **Deployments** (no menu superior).
2. Clique no deploy mais recente (o do topo), clique nos trê pontinhos (`...`) e escolha **Redeploy**.
3. **OU** simplesmente faça um `git push` de qualquer alteração (até um espaço em branco em um arquivo) que a Vercel vai reconstruir o site automaticamente usando as novas variáveis.
