# Investigação: `setor` incorreto em `POST /instrumentos/`

## Resumo executivo

Foi identificada uma **desincronização entre duas origens de “seleção”**:

| Origem | Onde vive | Usada por `CreateInstrument` no cabeçalho da árvore? |
|--------|-----------|------------------------------------------------------|
| `SectorTreeContext.selectedId` → `selectedItem` derivado em `VirtualizedSectorTree` | Contexto + `nodes` | **Sim** (`setor={selectedItem}` no `TreeHeader`) |
| `useAssetsVm` → `selectedItem` + `setSelectedItem` | Estado do pai | **Não** no fluxo do header; só noutros filhos (ex. `InstrumentDetails` passa `setor` do pai) |

O formulário de criação no **header** da árvore usa **apenas** o `selectedItem` derivado do **contexto**. Qualquer atualização que chame **só** `setSelectedItem` (pai) sem `selectNode` (contexto) deixa o contexto com um **setor/instrumento ainda selecionado de antes** → o `onSubmit` calcula `setor` a partir da prop `setor` **desatualizada** → PK errado (ex.: 44 em vez de 40).

## Causa raiz (confirmada no código)

1. **`frontend/src/assets/components/SearchWithTreeExpansion.jsx`**  
   Ao escolher um instrumento na pesquisa, chama `onSelectInstrument({ id: 'instrument-…', type, parentId })`, que atualiza `useAssetsVm.selectedItem`, mas **não** chama `selectNode` no `SectorTreeContext`. O highlight/expansão usa `expandPathToSector`, mas a **seleção lógica** do contexto permanece a anterior.

2. **`frontend/src/assets/viewModels/useAssetsVM.js`** (rota `instrumentos/:id/:idSetor`)  
   O `useEffect` define `setSelectedItem` para o instrumento da URL mas **não** chama `selectNode`, pelo mesmo motivo.

3. **Dupla leitura no `CreateInstrument`**  
   - Criação a partir da **árvore** (sem `tableViewCreate`): `setor` no payload vem da prop `setor` (`setor?.id` / `parentId`), não de `setorId` local.  
   - Criação a partir da **tabela**: usa `setorId`.  
   Isto não é bug por si só, mas agrava a confusão ao depurar: logs de `setorId` podem parecer “certos” enquanto o POST usa a prop `setor`.

## Backend (sanidade)

- `InstrumentoDoClienteWriteSerializer`: campo `setor` é FK por PK; erro `Pk inválido "44" - objeto não existe` indica que **44** não existe (ou não é válido para o queryset) no momento da validação — coerente com envio de ID errado pelo cliente.

## Correções aplicadas (sincronização contexto ↔ seleção)

- **`SearchWithTreeExpansion`:** após expandir o caminho, chama `selectNode(\`instrument-${item.id}\`)` para alinhar `selectedId` ao instrumento escolhido (o `onSubmit` usa `parentId` quando o tipo é `instrument`).
- **`useAssetsVM`:** no `useEffect` da rota `id`/`idSetor`, chama `selectNode(\`instrument-${id}\`)` após `setSelectedItem`.

## Instrumentação (dev)

- Em **`CreateInstrument`**, `onSubmit` regista em `import.meta.env.DEV` o ramo, `tableViewCreate`, prop `setor`, `setorId` e o valor numérico enviado em `setor`, para correlacionar com a aba Network.

## Reprodução manual (pós-correção)

1. Na árvore, selecionar um setor A (anotar PK).  
2. Usar a **pesquisa** para saltar para um instrumento noutro setor B.  
3. Abrir **Criar instrumento** no header e submeter sem clicar de novo na árvore.  
4. **Antes da correção:** o `setor` no POST podia ser o de A.  
5. **Depois:** deve corresponder ao setor do instrumento escolhido na pesquisa (`parentId`).

## Próximos passos (opcional)

- Avaliar o mesmo tipo de sync após **criar setor** (`useSectorMutations` só faz `setSelectedItem`).  
- “Snapshot” `targetSetorPk` ao abrir o modal se ainda houver relatos de corrida em redes lentas.  
- Testes E2E para pesquisa → criar instrumento.
