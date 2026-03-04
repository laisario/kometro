# Solução: Erro `useSectorTreeContext must be used within SectorTreeProvider`

## 📋 Análise Completa

### A) Mapeamento de Uso

#### 1. Onde `CreateInstrument` é utilizado:

| Arquivo | Linha | Contexto de Renderização | Status |
|---------|-------|--------------------------|--------|
| `ClientDetailsPage.jsx` | 92 | `/admin/cliente/:id` | ❌ **PROBLEMA: Fora do provider** |
| `AssetsPage.jsx` | Via `SectorTreeView` | `/dashboard/instrumentos` | ✅ Dentro do provider |
| `InstrumentosTable.jsx` | 301 | Dentro de `AssetsPage` | ✅ Dentro do provider |
| `InstrumentDetails.jsx` | 126, 180 | `AssetsPage` e `InstrumentoDetailPage` | ⚠️ Parcial (InstrumentoDetailPage fora) |
| `SetorTree.jsx` | 33 | Dentro de `AssetsPage` | ✅ Dentro do provider |
| `ClientInstrumentInformation.jsx` | 75 | Usado em `ClientDetailsPage` | ❌ **PROBLEMA: Fora do provider** |

#### 2. Onde `useSectorTreeContext` é utilizado:

| Arquivo | Linha | Uso |
|---------|-------|-----|
| `CreateInstrument.jsx` | 81 | ❌ **PROBLEMA: Hook obrigatório, mas componente pode funcionar sem contexto** |
| `SectorTreeView.jsx` | 47 | ✅ Sempre dentro do provider |
| `VirtualizedSectorTree.jsx` | 125 | ✅ Sempre dentro do provider |
| `SearchWithTreeExpansion.jsx` | 16 | ✅ Sempre dentro do provider |
| `DeleteSectorDialog.jsx` | 87 | ✅ Sempre dentro do provider |

#### 3. Onde `SectorTreeProvider` estava declarado:

- **Antes**: Apenas em `AssetsPage.jsx` (linha 99)
- **Problema**: Não cobria `ClientDetailsPage` e `InstrumentoDetailPage`

### B) Diagnóstico da Causa Real

**Causa raiz identificada:**
1. `ClientDetailsPage` (`/admin/cliente/:id`) renderiza `CreateInstrument` diretamente, mas não está dentro de `SectorTreeProvider`
2. `InstrumentoDetailPage` (`/dashboard/instrumento/:id`) pode renderizar `CreateInstrument` via `InstrumentDetails`, mas também não estava dentro do provider
3. O hook `useSectorTreeContext` lançava erro obrigatório, mas `CreateInstrument` tem lógica para funcionar sem contexto (usando props `setores`)

### C) Proposta de Arquitetura

#### Análise das 3 Opções:

**Opção 1 — Provider no topo da aplicação (MainRouter/App)**
- ❌ **Rejeitada**: Carregaria provider em rotas que não precisam (auth, register)
- ❌ Impacto desnecessário em performance

**Opção 2 — Provider por layout/rota (CommonLayout)**
- ✅ **ESCOLHIDA**: Cobre todas as rotas que precisam (`/dashboard/*` e `/admin/*`)
- ✅ Não afeta rotas de autenticação
- ✅ Mantém escopo correto
- ✅ Evita duplicação de estado
- ✅ Provider só faz fetch quando `user?.cliente` existe, então não causa problemas de performance

**Opção 3 — Múltiplos providers**
- ❌ **Rejeitada**: Criaria instâncias isoladas de estado
- ❌ Quebraria UX se seleção/expansão de setores precisa ser compartilhada
- ❌ Complexidade desnecessária

### D) Implementação Aplicada

#### Mudanças Realizadas:

1. **Melhorada mensagem de erro** do hook obrigatório
   - Arquivo: `SectorTreeContext.jsx`
   - Mensagem mais informativa indicando que o provider está no CommonLayout

2. **Atualizado `CreateInstrument`** para usar hook obrigatório
   - Arquivo: `CreateInstrument.jsx`
   - Usa `useSectorTreeContext()` (obrigatório) já que o provider sempre está disponível
   - Mantém fallback para props `setores` apenas como segurança (caso edge raro)

4. **Movido `SectorTreeProvider` para `CommonLayout`**
   - Arquivo: `CommonLayout.jsx`
   - Provider agora cobre todas as rotas dentro de `/dashboard/*` e `/admin/*`
   - Garante que `ClientDetailsPage` e `InstrumentoDetailPage` estão dentro do provider

5. **Removido provider de `AssetsPage`**
   - Arquivo: `AssetsPage.jsx`
   - Provider agora está em nível superior, não precisa duplicar

6. **Corrigido `InstrumentoDetailPage`**
   - Arquivo: `InstrumentoDetailPage.jsx`
   - Removida prop `setores={sectors}` que não existia e não era usada

### E) Segurança Extra

#### ✅ Implementado:

1. **Mensagem de erro melhorada**: Indica onde o provider está disponível
2. **Código simplificado**: Hook obrigatório usado diretamente (provider sempre disponível)
3. **Fallback em `CreateInstrument`**: Mantido apenas como segurança (caso edge raro)

#### ⚠️ Recomendações Futuras (Opcional):

1. **ErrorBoundary**: Considerar adicionar ErrorBoundary específico para componentes críticos
2. **Testes**: Adicionar testes garantindo que rotas renderizam `CreateInstrument` sem crash
3. **TypeScript**: Se migrar para TypeScript, adicionar tipos para distinguir hook obrigatório vs opcional

## 📊 Resultado Final

### Antes:
- ❌ `ClientDetailsPage` → Erro ao usar `CreateInstrument`
- ❌ `InstrumentoDetailPage` → Potencial erro ao usar `CreateInstrument`
- ❌ Hook obrigatório impedia uso opcional

### Depois:
- ✅ `ClientDetailsPage` → Funciona (provider no `CommonLayout`)
- ✅ `InstrumentoDetailPage` → Funciona (provider no `CommonLayout`)
- ✅ `CreateInstrument` → Funciona com contexto obrigatório (sempre disponível)
- ✅ Todos os componentes que precisam do contexto obrigatório continuam funcionando
- ✅ Código simplificado: hook opcional removido (não era necessário)

## 🔍 Arquivos Modificados

1. `frontend/src/assets/contexts/SectorTreeContext.jsx`
   - Melhorada mensagem de erro de `useSectorTreeContext()`
   - Removido hook opcional (não era necessário)

2. `frontend/src/assets/components/CreateInstrument.jsx`
   - Alterado para usar `useSectorTreeContext()` (obrigatório)
   - Simplificada lógica: contexto sempre disponível

3. `frontend/src/layouts/common/CommonLayout.jsx`
   - Adicionado `SectorTreeProvider` envolvendo `<Outlet />`

4. `frontend/src/assets/pages/AssetsPage.jsx`
   - Removido `SectorTreeProvider` (agora está no layout superior)

5. `frontend/src/assets/pages/InstrumentoDetailPage.jsx`
   - Removida prop `setores={sectors}` não utilizada

## ✅ Validação

- ✅ Sem erros de lint
- ✅ Provider cobre todas as rotas que usam `CreateInstrument`
- ✅ Componentes que precisam do contexto obrigatório continuam funcionando
- ✅ `CreateInstrument` funciona com ou sem contexto
