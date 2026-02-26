# Correção: MultipleObjectsReturned em TipoInstrumento

## 📋 Problema Resolvido

**Erro:** `MultipleObjectsReturned: get() returned more than one TipoInstrumento -- it returned 3!`

**Causa:** O método `get_or_create()` estava usando apenas `descricao`, `modelo` e `fabricante` como critérios de busca, mas não incluía `resolucao` no filtro. Quando existiam múltiplos registros com a mesma combinação desses três campos (mas com `resolucao` diferente ou NULL), o `.get()` interno falhava.

**Solução:** Substituído `get_or_create()` por uma função determinística que:
- Usa `.filter().order_by('id').first()` em vez de `.get()`
- Normaliza strings e trata NULL vs "" consistentemente
- Escolhe determinísticamente o menor `id` em caso de duplicatas perfeitas
- Loga warnings para monitoramento

---

## ✅ O que foi implementado

### 1. Função Helper `_find_tipo_instrumento_deterministico()`

Localização: `bef-backend/app/instrumentos/serializers.py`

**Características:**
- ✅ Normaliza strings (trim, case-insensitive)
- ✅ Trata NULL e "" como equivalentes para campos opcionais
- ✅ Busca determinística (sempre escolhe menor `id` em caso de múltiplos)
- ✅ Loga warnings quando encontra duplicatas perfeitas
- ✅ Nunca quebra o endpoint (sempre retorna um resultado)

**Regras de matching:**
- `descricao`: obrigatório, comparação case-insensitive
- `modelo`/`fabricante`: se vazio/None, aceita NULL ou "" no banco
- `resolucao`: 
  - Se fornecida: tenta match exato → se não achar, tenta reaproveitar um com NULL
  - Se não fornecida: não filtra por resolucao, aceita qualquer um existente

### 2. Atualização dos Serializers

- ✅ `InstrumentoWriteSerializer.create()` - atualizado
- ✅ `InstrumentoWriteSerializer.update()` - atualizado

### 3. Script de Limpeza de Duplicatas

Localização: `bef-backend/app/instrumentos/management/commands/cleanup_tipo_instrumento_duplicates.py`

**Funcionalidades:**
- Identifica duplicatas perfeitas de `TipoInstrumento`
- Escolhe registro canônico (menor `id`)
- Reaponta todas as referências de `Instrumento` para o canônico
- Deleta duplicados
- Modo `--dry-run` para testar antes de executar
- Modo `--verbose` para ver detalhes

---

## 🚀 Como usar

### Deploy da Correção

A correção já está implementada no código. Basta fazer deploy:

```bash
# No ambiente de produção
git pull
# Reiniciar aplicação (Django/Gunicorn/etc)
```

**Importante:** A correção **não requer** limpeza prévia do banco. Ela funciona mesmo com duplicatas existentes, apenas escolhendo determinísticamente qual usar.

### Limpeza de Duplicatas (Opcional mas Recomendado)

#### Passo 1: Verificar duplicatas (dry-run)

```bash
cd bef-backend/app
python manage.py cleanup_tipo_instrumento_duplicates --dry-run --verbose
```

Isso mostra:
- Quantos grupos de duplicatas existem
- Quais registros serão mantidos (canônicos)
- Quais serão deletados
- Quantos `Instrumento` serão atualizados

#### Passo 2: Executar limpeza

```bash
python manage.py cleanup_tipo_instrumento_duplicates --verbose
```

O comando irá:
1. Mostrar estatísticas
2. Pedir confirmação (digite `sim` para confirmar)
3. Executar em transação (rollback automático em caso de erro)
4. Mostrar resultado final

**⚠️ IMPORTANTE:**
- Faça **backup do banco** antes de executar
- Teste primeiro em ambiente de desenvolvimento/staging
- Use `--dry-run` primeiro para ver o que será feito

---

## 🔍 Verificação Pós-Deploy

### 1. Verificar logs

Após o deploy, monitore os logs do Django. Se houver duplicatas sendo detectadas, você verá warnings como:

```
WARNING: TipoInstrumento duplicado (match-exato). descricao='Paquímetro' modelo='...' fabricante='...' resolucao=0.01 chosen_id=123 ids_sample=[123, 456, 789]
```

Isso indica que existem duplicatas, mas o sistema está funcionando corretamente (escolhendo o menor id).

### 2. Testar endpoint

```bash
# Criar um novo instrumento
curl -X POST http://seu-servidor/api/instrumentos-empresa/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "descricao": "Paquímetro",
    "modelo": "Modelo X",
    "fabricante": "Fabricante Y",
    "resolucao": 0.01,
    ...
  }'
```

O endpoint não deve mais retornar `MultipleObjectsReturned`.

### 3. Verificar duplicatas no banco (SQL)

```sql
-- Ver duplicatas perfeitas (considerando NULL e "" como equivalentes)
SELECT 
    LOWER(TRIM(descricao)) as desc_norm,
    COALESCE(LOWER(TRIM(modelo)), '') as modelo_norm,
    COALESCE(LOWER(TRIM(fabricante)), '') as fab_norm,
    resolucao,
    COUNT(*) as count,
    GROUP_CONCAT(id ORDER BY id) as ids
FROM instrumentos_tipoinstrumento
GROUP BY desc_norm, modelo_norm, fab_norm, resolucao
HAVING count > 1;
```

---

## 📊 Impacto

### Antes da Correção
- ❌ Endpoint quebrava com `MultipleObjectsReturned` quando havia duplicatas
- ❌ Não era possível criar novos instrumentos em alguns casos
- ❌ Erro 500 para o usuário

### Depois da Correção
- ✅ Endpoint nunca quebra (sempre escolhe determinísticamente)
- ✅ Reutiliza tipos existentes quando possível
- ✅ Loga warnings para monitoramento
- ✅ Comportamento determinístico e previsível

---

## 🛠️ Manutenção Futura

### Prevenção de Novas Duplicatas

A correção já previne a criação de novas duplicatas através da normalização de strings e tratamento consistente de NULL/"".

### Monitoramento

Monitore os logs periodicamente para identificar duplicatas perfeitas:

```bash
# Buscar warnings de duplicatas nos logs
grep "TipoInstrumento duplicado" /var/log/django/app.log
```

Se encontrar muitas duplicatas, execute o script de limpeza.

### Constraint de Unicidade (Opcional)

Se quiser garantir unicidade no banco, você pode criar uma constraint única. **CUIDADO:** No MySQL, NULL != NULL em constraints, então precisa de estratégia especial.

**Recomendação:** Por enquanto, a correção no código é suficiente. A constraint pode ser adicionada depois se necessário.

---

## 📝 Notas Técnicas

1. **Normalização:** A função `_norm_str()` trata espaços extras e converte None/"" para consistência
2. **Case-insensitive:** Comparações de strings são case-insensitive (`iexact`)
3. **NULL vs "":** Campos opcionais tratam NULL e "" como equivalentes para evitar duplicatas por inconsistência
4. **Determinismo:** Sempre escolhe o menor `id` em caso de múltiplos resultados
5. **Transações:** O script de limpeza usa transações para garantir atomicidade

---

## ❓ FAQ

**P: Preciso limpar duplicatas antes do deploy?**  
R: Não. A correção funciona mesmo com duplicatas existentes.

**P: O script de limpeza é obrigatório?**  
R: Não, mas é recomendado para manter o banco limpo e consistente.

**P: E se eu tiver duplicatas com resolucao diferente?**  
R: Isso é esperado e correto. Cada combinação única de (descricao, modelo, fabricante, resolucao) é um tipo diferente.

**P: Como saber se a correção está funcionando?**  
R: O endpoint não deve mais retornar `MultipleObjectsReturned`. Monitore os logs para warnings de duplicatas perfeitas.

---

## 📞 Suporte

Em caso de dúvidas ou problemas, verifique:
1. Logs do Django
2. Logs do servidor web
3. Executar `cleanup_tipo_instrumento_duplicates --dry-run` para diagnóstico
