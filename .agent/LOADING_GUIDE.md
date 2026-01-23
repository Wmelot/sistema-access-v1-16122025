# 🎨 Guia de Loading & Feedback Visual

## Problema Resolvido
Usuários não sabiam se o clique foi registrado devido à falta de feedback visual durante carregamento.

---

## ✅ Componentes Criados

### 1. **NavigationLoadingBar** (Já Implementado)
Barra de progresso no topo da tela durante navegação.

**Localização:** Adicionado automaticamente no `layout.tsx`

**Visual:** Barra gradiente azul→roxo→rosa no topo

**Quando aparece:** Automaticamente em toda navegação entre páginas

---

### 2. **LoadingSpinner**
Spinner inline para botões e elementos.

**Uso:**
```tsx
import { LoadingSpinner } from '@/components/ui/loading'

<LoadingSpinner size="sm" />  // Pequeno
<LoadingSpinner size="md" />  // Médio (padrão)
<LoadingSpinner size="lg" />  // Grande
```

---

### 3. **LoadingOverlay**
Overlay de tela cheia para operações longas.

**Uso:**
```tsx
import { LoadingOverlay } from '@/components/ui/loading'

{isProcessing && <LoadingOverlay message="Processando pagamento..." />}
```

---

### 4. **Skeleton Loaders**
Placeholders animados para conteúdo.

**Uso:**
```tsx
import { Skeleton, CardSkeleton, TableSkeleton } from '@/components/ui/loading'

// Skeleton genérico
<Skeleton className="h-4 w-full" />

// Card completo
<CardSkeleton />

// Tabela
<TableSkeleton rows={5} />
```

---

### 5. **Button com Loading**
Botão com estado de loading integrado.

**Uso:**
```tsx
import { Button } from '@/components/ui/button-with-loading'

<Button 
  loading={isSubmitting}
  loadingText="Salvando..."
  onClick={handleSubmit}
>
  Salvar
</Button>
```

**Resultado:**
- Botão desabilitado durante loading
- Spinner aparece automaticamente
- Texto muda para "Salvando..."
- Animação de scale ao clicar

---

## 🎯 Hooks Personalizados

### useNavigationWithLoading
Para navegação com feedback visual.

**Uso:**
```tsx
import { useNavigationWithLoading } from '@/hooks/use-loading'

function MyComponent() {
  const { navigate, isPending, isNavigating } = useNavigationWithLoading()

  return (
    <button 
      onClick={() => navigate('/dashboard/patients')}
      disabled={isPending}
    >
      {isNavigating('/dashboard/patients') ? 'Carregando...' : 'Ver Pacientes'}
    </button>
  )
}
```

---

### useAsyncAction
Para ações assíncronas com loading.

**Uso:**
```tsx
import { useAsyncAction } from '@/hooks/use-loading'

function MyComponent() {
  const { execute, isLoading } = useAsyncAction(
    async (data) => {
      return await savePatient(data)
    },
    {
      onSuccess: (result) => {
        toast.success('Paciente salvo!')
      },
      onError: (error) => {
        toast.error(error.message)
      }
    }
  )

  return (
    <Button 
      loading={isLoading}
      onClick={() => execute(formData)}
    >
      Salvar
    </Button>
  )
}
```

---

## 📋 Checklist de Implementação

### Já Implementado ✅
- [x] NavigationLoadingBar no layout principal
- [x] Componentes de loading criados
- [x] Hooks personalizados
- [x] Button com loading integrado

### Para Implementar 📝

#### 1. Substituir Botões Principais
Trocar botões importantes por versão com loading:

**Antes:**
```tsx
import { Button } from '@/components/ui/button'

<Button onClick={handleSave}>Salvar</Button>
```

**Depois:**
```tsx
import { Button } from '@/components/ui/button-with-loading'

<Button loading={isSaving} onClick={handleSave}>Salvar</Button>
```

**Locais prioritários:**
- [ ] Botão "Finalizar Atendimento"
- [ ] Botão "Salvar" em formulários
- [ ] Botão "Criar Paciente"
- [ ] Botão "Agendar"
- [ ] Botões de ações em modais

---

#### 2. Adicionar Skeletons em Listas
Mostrar skeleton enquanto carrega dados:

**Exemplo - Lista de Pacientes:**
```tsx
import { TableSkeleton } from '@/components/ui/loading'

function PatientsList() {
  const { data: patients, isLoading } = usePatients()

  if (isLoading) {
    return <TableSkeleton rows={10} />
  }

  return (
    <table>
      {/* ... */}
    </table>
  )
}
```

**Locais prioritários:**
- [ ] Lista de pacientes
- [ ] Lista de agendamentos
- [ ] Lista de profissionais
- [ ] Dashboard (cards de métricas)

---

#### 3. Adicionar Overlay em Operações Longas
Para operações que demoram mais de 2 segundos:

**Exemplo:**
```tsx
import { LoadingOverlay } from '@/components/ui/loading'

function FinishAttendance() {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFinish = async () => {
    setIsProcessing(true)
    try {
      await finishAttendance()
      await generateInvoice()
      await sendNotification()
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      {isProcessing && <LoadingOverlay message="Finalizando atendimento..." />}
      <Button onClick={handleFinish}>Finalizar</Button>
    </>
  )
}
```

**Locais prioritários:**
- [ ] Finalizar atendimento
- [ ] Processar pagamento
- [ ] Gerar relatório
- [ ] Upload de arquivos grandes

---

## 🎨 Exemplos Visuais

### Barra de Navegação
```
┌─────────────────────────────────────┐
│ ████████████████░░░░░░░░░░░░░░░░░░ │ ← Gradiente animado
└─────────────────────────────────────┘
```

### Botão com Loading
```
┌──────────────────┐
│ ⟳ Salvando...   │ ← Spinner + texto
└──────────────────┘
```

### Skeleton Card
```
┌────────────────────┐
│ ████████░░░░░░░░  │ ← Animação shimmer
│ ████░░░░░░░░░░░░  │
│ ██████████░░░░░░  │
│ [████] [████]     │
└────────────────────┘
```

---

## 🚀 Próximos Passos

1. **Testar navegação** - Clique em links e veja a barra no topo
2. **Implementar em botões principais** - Começar pelos mais usados
3. **Adicionar skeletons** - Listas que demoram a carregar
4. **Feedback em ações** - Toast notifications + loading states

---

## 💡 Dicas

- **Sempre** mostre feedback visual em ações que demoram >300ms
- **Use skeletons** ao invés de spinners para listas
- **Desabilite botões** durante loading para evitar cliques duplos
- **Mantenha consistência** - use os mesmos componentes em todo o app

---

## 📊 Impacto Esperado

- ✅ **UX melhorada** - Usuários sabem que o clique foi registrado
- ✅ **Menos frustração** - Feedback imediato
- ✅ **Menos cliques duplos** - Botões desabilitados durante loading
- ✅ **Percepção de velocidade** - Skeletons fazem parecer mais rápido
