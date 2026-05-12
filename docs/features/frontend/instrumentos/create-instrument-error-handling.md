# Criação de instrumentos: erros, feedback ao utilizador e melhorias possíveis

Documento de investigação (sem alterações de código). Foco em respostas **400 Bad Request** e outros erros que o utilizador percebe como “falhou” sem mensagem útil.

---

## 1. Fluxo atual (frontend)

- **Mutação:** `mutateCreateClient` em `frontend/src/assets/hooks/useAssetMutations.jsx` (`POST /instrumentos/`).
- **Tratamento de erro (`onError`):**
  - Se `erro.response.data` for um **objeto** (não array), percorre `Object.entries(errors)` e monta texto `Campo - mensagem` para o snackbar.
  - Casos especiais hardcoded: `instrumento` → label “Instrumento base”; `non_field_errors` → mensagem fixa de tag duplicada.
  - Se não conseguir montar `mensagemDetalhada`, usa `getErrorMessage(erro?.response?.status)` em `frontend/src/utils/error.js`.
- **Para status 400**, `getErrorMessage(400)` devolve sempre a **mesma frase genérica:**  
  `"Requisição inválida. Verifique os dados enviados."`  
  Isto aparece sempre que o corpo de erro **não** entra no formato que o `onError` sabe serializar (ver secção 3).
- **Estado de formulário:** `setError(errors)` repassa o objeto ao `CreateInstrument` para `error` em campos como `instrumento`, `tag`/`non_field_errors`, etc.

---

## 2. Comportamento típico do backend (DRF)

- Validação do serializer falha → **400** com corpo JSON em geral no formato:
  - `{ "campo": ["mensagem", ...] }` (lista por campo)
  - `{ "non_field_errors": ["..."] }` (erros não associados a um campo)
  - `{ "detail": "..." }` (ex.: permissão, throttling, ou `ValidationError` simples)
- Erros podem ser **aninhados** (objetos dentro de listas) em serializers complexos — o `join` simples no frontend pode produzir texto inútil ou falhar conceitualmente se algum elemento não for string.

---

## 3. Porque um 400 pode “não mostrar o porquê”

### 3.1 Fallback genérico para 400

Sempre que `mensagemDetalhada` fica `null` ou vazio, o utilizador vê só a mensagem fixa de `error.js` para 400, **sem** detalhe do servidor.

Isto pode acontecer quando, entre outros:

| Situação | Motivo |
|----------|--------|
| `response.data` é **string** (HTML, texto plano) | `typeof errors === "object"` falha; não há parsing. |
| `response.data` é **array** | `Object.entries` em array não reproduz bem erros de campo. |
| Corpo é `{ "detail": "..." }` | Pode ser mostrado como “Detail - …” (capitalização estranha) ou depender de como o `Object.entries` trata valores que não são arrays de strings. |
| Valores aninhados / não-string | `mensagens.join(", ")` assume lista de strings; objetos aparecem como `[object Object]` ou quebram a legibilidade. |
| Erro de rede / sem `response` | `erro?.response` é `undefined`; `getErrorMessage(undefined)` cai no ramo genérico. |

### 3.2 Interceptor Axios (`frontend/src/api.js`)

No ramo de **erro** da resposta, o código calcula `newError` com `humps.camelizeKeys(error.response.data)` mas faz **`return Promise.reject(error)`** com o erro **original**, não com `newError`. Em consequência:

- A intenção de normalizar chaves no erro **não se aplica** ao objeto que chega aos handlers.
- Qualquer inconsistência futura entre chaves `snake_case` (API) e o que o UI espera (`non_field_errors` vs `nonFieldErrors`) pode afetar **só** erros ou **só** sucessos, consoante o caminho — risco de mensagens não mapeadas para campos.

Isto é um candidato a revisão numa fase de implementação (documentado aqui como **risco**, não como causa única).

### 3.3 Cobertura incompleta no formulário

- Vários campos do `CreateInstrument` **não** mostram `helperText` ligado a `error[campo]` para todos os nomes de campo que o backend pode devolver (ex.: validações além de `instrumento`, `tag`, `non_field_errors`).
- O utilizador pode ver só o snackbar; se este for genérico, o motivo real só está no objeto `error` não exibido por campo.

### 3.4 Outras mutações no mesmo hook

- **`mutateUpdateClient` (PATCH):** o `onError` usa **apenas** `getErrorMessage(erro?.response?.status)` — **não** faz parsing de `response.data`. Para 400, o utilizador vê sempre a mensagem genérica de `error.js` (ou equivalente por status), **sem** lista de campos do DRF.

---

## 4. Melhorias possíveis (mitigação — para implementação futura)

Ordem sugerida por impacto vs esforço:

1. **Unificar parsing de erros DRF** numa função utilitária: suportar `detail` (string ou lista), dicionário de listas, e opcionalmente `detail` aninhado; nunca mostrar só “400 genérico” quando existir texto no corpo.
2. **Corrigir o interceptor de erro** do Axios para rejeitar o erro com `data` normalizado (ou documentar decisão: manter sempre `snake_case` e alinhar o UI).
3. **Snackbar:** mostrar sempre um resumo derivado do corpo; em dev, opcionalmente logar `response.data` completo.
4. **CreateInstrument:** mapear mais chaves de `error` para `TextField`/`helperText` conforme contrato real do serializer (incl. nomes em camelCase se a API for unificada).
5. **PATCH (edição):** reutilizar o mesmo parser de erros que o POST, em vez de só `getErrorMessage(status)`.
6. **Validação no cliente (opcional):** antes do submit, validar campos obrigatórios e formatos para reduzir 400 “evitáveis” (complementar, não substituto do backend).
7. **Documentação de API / contrato de erros** por endpoint (lista de códigos de campo) para alinhar QA e frontend.

---

## 5. Referências rápidas no repositório

| Ficheiro | Tema |
|----------|------|
| `frontend/src/assets/hooks/useAssetMutations.jsx` | `onError` de `mutateCreateClient` e `mutateUpdateClient` |
| `frontend/src/utils/error.js` | Mensagens por status (incl. 400 genérico) |
| `frontend/src/api.js` | Interceptor de resposta / erro |
| `frontend/src/assets/components/CreateInstrument.jsx` | Uso de `error` por campo |
| `bef-backend/app/instrumentos/serializers.py` | `InstrumentoDoClienteWriteSerializer` e validações |
| `docs/features/frontend/instrumentos/wrong-setor-id-investigation.md` | Bug de contexto/setor (causa distinta de “mensagem genérica”) |

---

## 6. Conclusão

O maior problema de UX em falhas “Bad Request” não é a ausência de detalhe no **servidor** na maioria dos casos (DRF costuma enviar JSON estruturado), mas sim a **camada de apresentação no cliente**: fallback para mensagem fixa de 400, parsing frágil de formatos alternativos, interceptor de erro incompleto e **PATCH sem parsing** do corpo de erro. As melhorias acima reduzem casos em que o utilizador vê erro sem perceber **qual** campo ou **qual** regra falhou.
