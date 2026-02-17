# Integração com Endpoint de Pedidos Externos

Esta documentação detalha como implementar a integração com o endpoint `pedidos_externos` no frontend.

## Detalhes do Endpoint

- **URL**: `https://us-central1-dev-propulsao.cloudfunctions.net/pedidos_axion`
- **Método**: `POST`
- **Headers**:
  - `Content-Type`: `application/json`

## Estrutura da Requisição

O corpo da requisição deve ser um objeto JSON contendo dois objetos principais: `payload` (dados sensíveis criptografados) e `info` (dados públicos do pedido).

```json
{
  "payload": "BASE64_STRING_CRIPTOGRAFADA",
  "info": {
    // ... dados do pedido ...
  }
}
```

### 1. Criptografia (Payload)

Os dados sensíveis devem ser criptografados usando **RSA-OAEP** com hash **SHA-256**.
Você precisará da chave pública abaixo para criptografar os dados.

**Chave Pública (RSA Public Key):**

```pem
-----BEGIN PUBLIC KEY-----

-----END PUBLIC KEY-----
```

**Dados a serem criptografados (Objeto JSON):**

```json
{
  "timestamp": 1678900000,    // Timestamp atual em SEGUNDOS (Math.floor(Date.now() / 1000))
  "Email_paciente": "email@exemplo.com",
  "IdFisio": "UID_DO_FISIO", // Array de strings ou string única
  "LocalPedido": "AXIOM",
  "Nome_Paciente": "Nome do Paciente"
}
```

*Nota: O backend verifica se o `timestamp` está dentro de uma janela de 2 minutos (120 segundos).*

### 2. Dados Públicos (Info)

O objeto `info` contém os detalhes técnicos do pedido e não precisa ser criptografado.

**Campos Obrigatórios e Opcionais:**

```json
{
  "Cobertura": "EVA AZUL",           // Padrão: "EVA AZUL"
  "Numeracao": 40,                   // Número do calçado (Number)
  "ladoPedido": "DireitoEsquerdo",   // "Direito", "Esquerdo" ou "DireitoEsquerdo"
  "PrecoPedido": 150.00,             // Valor (Number)
  "Produto": "Palmilha 3D",
  "observacoesCompra": "Obs...",     // Texto livre
  "PontosGerados": 0,

  // Dados do Profissional (para etiqueta/contato)
  "Nome_indicacao": "Nome do Fisioterapeuta",
  "Contato_indicacao": "Endereço completo...",

  // Especificações da Palmilha (Strings)
  "Absorcao_dir": "0",               // "0" se não houver
  "Absorcao_esq": "0",
  "Antepe_Dir": "0",
  "Antepe_Esq": "0",
  "Retrope_Dir": "0",
  "Retrope_Esq": "0",
  "Barra_Dir": "0",
  "Barra_Esq": "0",
  "Elevacao_Dir": "0",
  "Elevacao_Esq": "0",
  "Arco_Dir": "Baixo",               // "Baixo", "Medio", "Alto"
  "Arco_Esq": "Baixo",
  "SuporteArco_dir": "Flexivel",     // "Flexivel", "Rigido"
  "SuporteArco_esq": "Flexivel",

  // Arquivos STL (Obrigatório enviar placeholder se não houver)
  "fileE": "UExhY2Vob2xkZXI=",       // Base64 do arquivo ou placeholder
  "fileD": "UExhY2Vob2xkZXI="
}
```

## Exemplo de Implementação (Frontend)

Recomenda-se o uso de bibliotecas como `node-forge` ou `jsencrypt` (verificar suporte a OAEP-SHA256) ou a API nativa `crypto.subtle`.

Abaixo, um exemplo utilizando **node-forge** (comum em projetos React/Vue):

### Instalação
```bash
npm install node-forge
```

### Código JavaScript

```javascript
import forge from 'node-forge';

const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----

-----END PUBLIC KEY-----`;

async function enviarPedido(dadosPedido, dadosPaciente, uidFisio) {
    try {
        // 1. Preparar Dados Sensíveis
        const sensitiveData = {
            timestamp: Math.floor(Date.now() / 1000),
            Email_paciente: dadosPaciente.email || "",
            IdFisio: [uidFisio],
            LocalPedido: "Fitsole Frontend",
            Nome_Paciente: dadosPaciente.nome || "Não Informado"
        };

        // 2. Criptografar com node-forge
        const publicKey = forge.pki.publicKeyFromPem(PUBLIC_KEY_PEM);
        const buffer = forge.util.createBuffer(JSON.stringify(sensitiveData), 'utf8');
        
        // OAEP SHA-256
        const encrypted = publicKey.encrypt(buffer.getBytes(), 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: {
                md: forge.md.sha256.create()
            }
        });
        
        const base64Payload = forge.util.encode64(encrypted);

        // 3. Montar Body Final
        const body = {
            payload: base64Payload,
            info: {
                // Mapeie seus dados do form aqui...
                Cobertura: dadosPedido.cobertura || "EVA AZUL",
                Numeracao: Number(dadosPedido.numeracao),
                ladoPedido: dadosPedido.lado, // "DireitoEsquerdo"
                Produto: "Palmilha 3D",
                
                // ... outros campos obrigatórios do 'info' ...
                Nome_indicacao: uidFisio.nome || "Fisio", 
                Contato_indicacao: "Endereço...",
                
                // Arquivos Base64 (Placeholder se não tiver STL real)
                fileE: "UExhY2Vob2xkZXI=", 
                fileD: "UExhY2Vob2xkZXI="
            }
        };

        // 4. Enviar Request
        const response = await fetch("https://us-central1-dev-propulsao.cloudfunctions.net/pedidos_externos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status} - ${await response.text()}`);
        }

        const result = await response.text();
        console.log("Sucesso:", result);
        return result;

    } catch (error) {
        console.error("Erro ao enviar pedido:", error);
        throw error;
    }
}
```

## Respostas da API

- **200 OK**: Pedido recebido com sucesso.
- **400 Bad Request**: Erro nos dados enviados (ex: timestamp expirado, payload inválido).
- **500 Internal Server Error**: Erro no servidor.
