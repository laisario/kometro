# 📊 Guia de Importação de Planilha - Instrumentos do Cliente

Este documento explica como preencher corretamente a planilha Excel para importação de instrumentos no sistema KOMETRO.
Para importar acesse: https://kometro-backend.vps-kinghost.net/admin/instrumentos/instrumentodocliente/, e aperte o botão importar 

> 📌 **Importante:** Use a planilha de exemplo `planilha_base_importacao_instrumento_do_cliente.xlsx` como base para garantir que os nomes das colunas estejam corretos.

---

## 📋 Índice

1. [Campos Obrigatórios](#campos-obrigatórios)
2. [Legenda de Valores Aceitos](#legenda-de-valores-aceitos)
3. [Descrição Detalhada dos Campos](#descrição-detalhada-dos-campos)
4. [Campos Especiais - Critérios de Aceitação](#campos-especiais---critérios-de-aceitação)
5. [Formato de Datas](#formato-de-datas)
6. [Exemplos Práticos](#exemplos-práticos)
7. [Troubleshooting](#troubleshooting)

---

## 🔴 Campos Obrigatórios

O único campo **obrigatório** para a importação funcionar é:

- `descricao` - Descrição do tipo de instrumento

> ⚠️ **Nota:** Todos os outros campos são opcionais, mas recomenda-se preencher o máximo possível para ter um cadastro completo. Campos como `fabricante`, `modelo`, `resolucao`, `unidade`, `faixa nominal maxima` e `faixa nominal minima` são altamente recomendados para um cadastro adequado.

---

## 📖 Legenda de Valores Aceitos

### Status (Posição do Instrumento)

O campo `status` aceita apenas os seguintes valores:

| Valor | Significado |
|-------|-------------|
| **U** | Em uso |
| **E** | Em estoque |
| **I** | Inativo |
| **F** | Fora de uso |
| **C** | Em calibração |

> ❌ **NÃO use:** "Em uso", "em uso", "EM USO", etc. Use apenas a letra **U**.

### Resultado (Status da Calibração)

O campo `resultado` aceita apenas os seguintes valores:

| Valor | Significado |
|-------|-------------|
| **A** | Aprovado |
| **R** | Reprovado |

> ❌ **NÃO use:** "Aprovado", "aprovado", "APROVADO", etc. Use apenas a letra **A** ou **R**.

### Checagem

O campo `checagem` aceita os seguintes valores (case-insensitive):

**Valores que resultam em `True` (Sim):**
- `sim`
- `s`
- `yes`
- `y`
- `true`
- `1`

**Valores que resultam em `False` (Não):**
- `não`
- `nao`
- `n`
- `no`
- `false`
- `0`

**Qualquer outro valor** resultará em `None` (não definido).

### Sinal (Tipo de Sinal)

O campo `sinal` aceita apenas os seguintes valores:

| Valor | Significado |
|-------|-------------|
| **A** | Analógico |
| **D** | Digital |

> ❌ **NÃO use:** "Analógico", "Digital", "analógico", etc. Use apenas a letra **A** ou **D**.

### Período de Frequência

Os campos `frequencia calibracao periodo` e `frequencia checagem periodo` aceitam apenas os seguintes valores:

| Valor | Significado |
|-------|-------------|
| **dia** | Dia |
| **mes** | Mês |
| **ano** | Ano |

> ❌ **NÃO use:** "dias", "meses", "anos", "Dia", "Mês", etc. Use apenas: **dia**, **mes** ou **ano** (no singular e minúsculo).

---

## 📝 Descrição Detalhada dos Campos

### Identificação e Dados Básicos

| Nome da Coluna | Tipo | Obrigatório | Descrição | Exemplo |
|----------------|------|-------------|-----------|---------|
| `identificacao (tag)` | Texto | ❌ Não | Identificador único do instrumento no cliente | `INC-01`, `TERM-001` |
| `n serie` | Texto | ❌ Não | Número de série do fabricante | `SN123456` |
| `descricao` | Texto | ✅ Sim | Descrição do tipo de instrumento | `MEDIDOR DE INCLINAÇÃO`, `TERMÔMETRO` |
| `fabricante` | Texto | ❌ Não | Nome do fabricante | `Digimess`, `Fluke` |
| `modelo` | Texto | ❌ Não | Modelo do instrumento | `DM-100`, `51-II` |
| `laboratorio de referencia` | Texto | ❌ Não | Laboratório de referência para calibração | `B&F Laboratório` |

### Especificações Técnicas

| Nome da Coluna | Tipo | Obrigatório | Descrição | Exemplo |
|----------------|------|-------------|-----------|---------|
| `resolucao` | Decimal | ❌ Não | Resolução do instrumento | `0.01`, `0.1`, `1` |
| `unidade` | Texto | ❌ Não | Unidade de medida | `°`, `°C`, `kg`, `m` |
| `faixa nominal maxima` | Decimal | ❌ Não | Valor máximo da faixa nominal | `180`, `100`, `50` |
| `faixa nominal minima` | Decimal | ❌ Não | Valor mínimo da faixa nominal | `0`, `-50`, `-100` |
| `capacidade de medicao` | Decimal | ❌ Não | Capacidade de medição | `100`, `50` |
| `capacidade de medicao unidade` | Texto | ❌ Não | Unidade da capacidade de medição | `kg`, `m` |
| `sinal` | Texto | ❌ Não | Tipo de sinal do instrumento | **A** (Analógico) ou **D** (Digital) |

### Preços e Serviços

| Nome da Coluna | Tipo | Obrigatório | Descrição | Exemplo |
|----------------|------|-------------|-----------|---------|
| `valor calibracao no laboratorio` | Decimal | ❌ Não | Preço da calibração no laboratório | `150.00`, `250.50` |
| `valor calibracao no cliente` | Decimal | ❌ Não | Preço da calibração no cliente | `200.00`, `300.00` |
| `tipo de servico` | Texto | ❌ Não | Tipo de serviço oferecido | `Calibração`, `Verificação` |
| `Dias úteis` | Número Inteiro | ❌ Não | Prazo em dias úteis para calibração | `5`, `10`, `15` |

### Status e Localização

| Nome da Coluna | Tipo | Obrigatório | Descrição | Valores Aceitos |
|----------------|------|-------------|-----------|-----------------|
| `status` | Texto | ❌ Não | Posição do instrumento | **U**, **E**, **I**, **F**, **C** |
| `setor` | Texto | ❌ Não | Setor onde o instrumento está localizado | `Produção`, `Qualidade`, `Laboratório` |
| `local` | Texto | ❌ Não | Local específico da calibração | `Instalação permanente`, `Cliente`, `Terceirizada` |

### Datas

| Nome da Coluna | Tipo | Obrigatório | Formato | Exemplo |
|----------------|------|-------------|---------|---------|
| `data` | Data | ❌ Não | DD/MM/AAAA ou DD-MM-AAAA | `15/01/2025`, `15-01-2025` |
| `data utilizacao` | Data | ❌ Não | DD/MM/AAAA ou DD-MM-AAAA | `01/01/2024`, `01-01-2024` |
| `data da ultima calibracao` | Data | ❌ Não | DD/MM/AAAA ou DD-MM-AAAA | `15/12/2024`, `15-12-2024` |
| `data da ultima checagem` | Data | ❌ Não | DD/MM/AAAA ou DD-MM-AAAA | `10/01/2025`, `10-01-2025` |

### Frequências

| Nome da Coluna | Tipo | Obrigatório | Descrição | Exemplo |
|----------------|------|-------------|-----------|---------|
| `frequencia calibracao quantidade` | Número | ❌ Não | Quantidade da frequência de calibração | `12`, `6`, `24` |
| `frequencia calibracao periodo` | Texto | ❌ Não | Período da frequência de calibração | **dia**, **mes**, **ano** |
| `frequencia checagem quantidade` | Número | ❌ Não | Quantidade da frequência de checagem | `3`, `6` |
| `frequencia checagem periodo` | Texto | ❌ Não | Período da frequência de checagem | **dia**, **mes**, **ano** |

> 💡 **Dica:** As frequências são combinadas automaticamente. Exemplo: `quantidade = 12` + `periodo = mes` = "12 mes".
> 
> ⚠️ **Importante:** Use sempre o singular e minúsculo: **dia**, **mes**, **ano** (não "dias", "meses", "anos").

### Calibração

| Nome da Coluna | Tipo | Obrigatório | Descrição | Exemplo |
|----------------|------|-------------|-----------|---------|
| `ordem de servico (calibracao)` | Texto | ❌ Não | Número da ordem de serviço | `OS-2025-001`, `12345` |
| `checagem` | Texto | ❌ Não | Indica se é uma checagem | `sim`, `não`, `s`, `n` |
| `resultado` | Texto | ❌ Não | Resultado da calibração | **A** (Aprovado) ou **R** (Reprovado) |
| `erro` | Decimal | ❌ Não | Maior erro encontrado | `0.5`, `1.2`, `-0.3` |
| `criterio de aceitacao` | Decimal | ❌ Não | Critério de aceitação (valor único) | `2.0`, `1.5` |
| `referencia do criterio de aceitacao` | Texto | ❌ Não | Referência do critério de aceitação | `Norma XYZ`, `Especificação do fabricante` |

### Outros

| Nome da Coluna | Tipo | Obrigatório | Descrição | Exemplo |
|----------------|------|-------------|-----------|---------|
| `procedimento relacionado` | Texto | ❌ Não | Código do procedimento relacionado | `PROC-001`, `XYZ-123` |
| `observacoes adicionais` | Texto | ❌ Não | Observações gerais sobre o instrumento | `Instrumento em bom estado`, `Necessita manutenção` |

---

## 🔧 Campos Especiais - Critérios de Aceitação

O sistema suporta **múltiplos critérios de aceitação** para o mesmo instrumento. Para isso, use colunas com o seguinte padrão:

### Formato das Colunas

Para cada tipo de critério, você pode criar colunas específicas:

| Nome da Coluna | Descrição | Exemplo |
|----------------|-----------|---------|
| `criterio de aceitacao [TIPO]` | Critério de aceitação para um tipo específico | `criterio de aceitacao [Temperatura]` |
| `unidade [TIPO]` | Unidade do critério | `unidade [Temperatura]` |
| `referencia [TIPO]` | Referência do critério | `referencia [Temperatura]` |
| `observacao [TIPO]` | Observação sobre o critério | `observacao [Temperatura]` |
| `erro [TIPO]` | Erro encontrado para esse tipo | `erro [Temperatura]` |
| `incerteza [TIPO]` | Incerteza para esse tipo | `incerteza [Temperatura]` |

### Exemplo Prático

Suponha que você tenha um instrumento com critérios diferentes para **Temperatura** e **Pressão**:

```
criterio de aceitacao [Temperatura] | unidade [Temperatura] | erro [Temperatura] | incerteza [Temperatura]
2.0                                  | °C                    | 0.5               | 0.3

criterio de aceitacao [Pressão]     | unidade [Pressão]     | erro [Pressão]    | incerteza [Pressão]
1.5                                  | bar                   | 0.2               | 0.1
```

### Campo Especial: `criterio calibracao`

Esta coluna indica qual critério foi usado na calibração atual. Deve corresponder ao `[TIPO]` de um dos critérios de aceitação:

| Nome da Coluna | Descrição | Exemplo |
|----------------|-----------|---------|
| `criterio calibracao` | Tipo do critério usado na calibração | `Temperatura`, `Pressão` |

> 💡 **Importante:** O sistema calcula automaticamente o status (Aprovado/Reprovado) baseado na fórmula: `|erro| + |incerteza| <= criterio_de_aceitacao`

---

## 📅 Formato de Datas

As datas podem ser informadas nos seguintes formatos:

- **DD/MM/AAAA** - Exemplo: `15/01/2025`
- **DD-MM-AAAA** - Exemplo: `15-01-2025`

> ⚠️ **Atenção:** Não use barras invertidas (`\`) ou pontos (`.`) como separadores. Use apenas `/` ou `-`.

### Exemplos Válidos:
- ✅ `15/01/2025`
- ✅ `01-12-2024`
- ✅ `31/12/2024`
- ❌ `15.01.2025` (não aceito)
- ❌ `15\01\2025` (não aceito)
- ❌ `2025-01-15` (formato ISO não aceito)

---

## 💡 Exemplos Práticos

### Exemplo 1: Instrumento Básico

```
identificacao (tag): INC-01
descricao: MEDIDOR DE INCLINAÇÃO
fabricante: Digimess
modelo: DM-100
resolucao: 0.01
unidade: °
faixa nominal maxima: 180
faixa nominal minima: 0
status: U
setor: Produção
sinal: D
```

### Exemplo 2: Instrumento Completo com Calibração

```
identificacao (tag): TERM-001
descricao: TERMÔMETRO DIGITAL
fabricante: Fluke
modelo: 51-II
resolucao: 0.1
unidade: °C
faixa nominal maxima: 100
faixa nominal minima: -50
status: U
setor: Laboratório
data da ultima calibracao: 15/12/2024
frequencia calibracao quantidade: 12
frequencia calibracao periodo: mes
sinal: D
ordem de servico (calibracao): OS-2024-123
local: Instalação permanente
laboratorio de referencia: B&F Laboratório
resultado: A
erro: 0.5
criterio de aceitacao: 2.0
referencia do criterio de aceitacao: Norma NBR 15758
```

### Exemplo 3: Instrumento com Múltiplos Critérios

```
identificacao (tag): MULTI-001
descricao: MULTÍMETRO
fabricante: Fluke
modelo: 87V
resolucao: 0.001
unidade: V
faixa nominal maxima: 1000
faixa nominal minima: 0
status: U

# Critério para Tensão
criterio de aceitacao [Tensão]: 1.0
unidade [Tensão]: V
erro [Tensão]: 0.2
incerteza [Tensão]: 0.1
referencia [Tensão]: Especificação do fabricante

# Critério para Corrente
criterio de aceitacao [Corrente]: 0.5
unidade [Corrente]: A
erro [Corrente]: 0.1
incerteza [Corrente]: 0.05
referencia [Corrente]: Norma IEC 61010

# Critério usado na calibração atual
criterio calibracao: Tensão
```

---

## 🔍 Troubleshooting

### Erro: "Número da linha: X - 'NoneType' object has no attribute 'strip'"

**Causa:** Alguma coluna da planilha tem o cabeçalho vazio ou nulo.

**Solução:** 
- Verifique se todas as colunas têm um nome no cabeçalho
- Remova colunas completamente vazias
- Certifique-se de que não há colunas sem nome antes de importar

### Erro: "Campo obrigatório não preenchido"

**Causa:** O campo obrigatório está vazio.

**Solução:**
- Verifique se o campo obrigatório está preenchido:
  - `descricao` (único campo obrigatório)

### Erro: "Valor inválido para campo status"

**Causa:** O campo `status` contém um valor que não está na legenda.

**Solução:**
- Use apenas: **U**, **E**, **I**, **F** ou **C**
- Não use texto completo como "Em uso"

### Erro: "Valor inválido para campo sinal"

**Causa:** O campo `sinal` contém um valor que não está na legenda.

**Solução:**
- Use apenas: **A** (Analógico) ou **D** (Digital)
- Não use texto completo como "Analógico" ou "Digital"

### Erro: "Valor inválido para campo periodo"

**Causa:** O campo `frequencia calibracao periodo` ou `frequencia checagem periodo` contém um valor inválido.

**Solução:**
- Use apenas: **dia**, **mes** ou **ano** (singular, minúsculo)
- Não use: "dias", "meses", "anos", "Dia", "Mês", "Ano", etc.

### Erro: "Data inválida"

**Causa:** A data está em formato incorreto.

**Solução:**
- Use o formato **DD/MM/AAAA** ou **DD-MM-AAAA**
- Exemplo: `15/01/2025` ou `15-01-2025`
- Não use pontos ou barras invertidas

### Erro: "Tag já existe"

**Causa:** Já existe um instrumento com a mesma tag cadastrado.

**Solução:**
- Use uma tag única para cada instrumento
- Se quiser atualizar um instrumento existente, use a mesma tag (o sistema atualizará automaticamente)

### Valores sendo convertidos para None

**Causa:** O sistema converte automaticamente os seguintes valores para `None` (vazio):
- Células vazias
- O caractere `-` (hífen)
- Strings vazias `""`

**Solução:** Isso é comportamento esperado. Se você não quiser que um campo fique vazio, não use `-` ou deixe a célula em branco.

---

## 📌 Dicas Importantes

1. **Use a planilha de exemplo:** Sempre use `planilha_base_importacao_instrumento_do_cliente.xlsx` como base para garantir que os nomes das colunas estejam corretos.

2. **Mantenha os nomes das colunas exatos:** Os nomes das colunas são case-sensitive e devem corresponder exatamente ao que está documentado aqui.

3. **Valores numéricos:** Use ponto (`.`) como separador decimal. Exemplo: `150.50`, não `150,50`.

4. **Campos opcionais:** Se um campo opcional não se aplicar ao seu instrumento, deixe-o em branco ou use `-`.

5. **Múltiplos critérios:** Para instrumentos com múltiplos critérios de aceitação, use o formato `[TIPO]` nas colunas.

6. **Atualização de instrumentos:** Se você importar um instrumento com a mesma tag de um já existente, o sistema atualizará os dados existentes.

---

## 📞 Suporte

Se você encontrar problemas que não estão listados aqui, entre em contato com a equipe de desenvolvimento ou consulte a documentação técnica completa em `DOCUMENTACAO_TECNICA.md`.

---

**Última atualização:** Janeiro 2025

