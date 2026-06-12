# Arquivos para download nos posts do blog

## Objetivo

Permitir que posts do blog tenham um ou mais arquivos anexados para download ou abertura pelo visitante na landing page Next.js, mantendo o padrão atual do backend Django/DRF e do visual da landing.

Este documento é apenas um plano técnico. Nenhuma implementação foi feita.

## Estado atual do blog no backend

O módulo de blog fica em `bef-backend/app/blog`.

Modelos atuais:

- `Categoria`: possui apenas `nome` único.
- `Post`: possui `titulo`, `texto` com `RichTextField`, `imagem_destaque` com `ImageField(upload_to="blog/posts/")`, `imagem_destaque_url`, `categoria`, `publicado_em`, `visivel`, `resumo` e `destaque`.
- `ImagemExtra`: ligada a `Post` por `ForeignKey` com `related_name="imagens_adicionais"` e guarda uma URL de imagem em `imagem`.
- `Video`: ligada a `Post` por `ForeignKey` com `related_name="videos_url"` e guarda uma URL em `url`.

Serialização atual:

- `PostSerializer` retorna categoria aninhada, `categoria_id` para escrita, `imagens_adicionais`, `midia` calculado a partir de `videos_url`, e os campos principais do post.
- `midia` hoje retorna objetos no formato `{ "tipo": "url", "src": video.url }`.
- Não há serializer específico para arquivos/documentos do post.

Views atuais:

- `PostViewSet` é um `ModelViewSet`.
- `get_queryset()` retorna somente `Post.objects.filter(visivel=True).order_by("-publicado_em")`.
- Aceita filtro por `categoria` via query string, exceto quando o valor é `todas`.
- A action `featured` retorna posts visíveis e marcados como `destaque=True`, também filtráveis por categoria.
- A paginação usada no blog é `blog.pagination.CustomPagination`, com `page_size = 6`.

Admin atual:

- `PostAdmin` exibe `titulo`, `categoria`, `publicado_em` e `visivel`.
- Possui inlines para `ImagemExtra` e `Video`.
- A feature deve seguir esse padrão adicionando um inline simples para os arquivos do post.

Rebuild da landing:

- `blog.signals` dispara `trigger_frontend_rebuild()` em `post_save` e `post_delete` de `Post` e `Categoria`.
- Como a landing usa páginas estáticas/ISR, alterações em arquivos anexados também precisam disparar rebuild ou salvar o `Post` relacionado para que a página pública seja atualizada.
- Ponto em aberto: definir se o novo model de arquivo terá signals próprios ou se o admin/view vai salvar o `Post` após alterações nos anexos.

## Consumo dos posts na landing Next.js

A landing fica em `bef-landing-page`.

Página de listagem:

- `pages/conhecimento/page/[id].js` monta a página "Área de conhecimento".
- Busca posts no cliente via `fetch(`${NEXT_PUBLIC_API_URL}/posts/`)`, com `page` e `categoria`.
- Busca destaques via `fetch(`${NEXT_PUBLIC_API_URL}/posts/featured/`)`.
- Renderiza `FeaturedPost` e `PostGrid`.
- `PostGrid` renderiza cards com `PostCard`.

Página individual:

- `pages/conhecimento/[single].js` usa `getStaticPaths` para listar todos os posts de `/posts/`.
- Usa `getStaticProps` para buscar `/posts/:id/`.
- A página recebe o objeto completo em `post`.
- Renderiza:
  - título;
  - `CarouselVideo` quando `post.midia` tiver itens;
  - conteúdo HTML sanitizado com `xss(post.texto)`;
  - carrossel de `post.imagens_adicionais` quando houver imagens.

Impacto da feature:

- Como a página individual já recebe o payload completo do post, o frontend pode consumir um novo campo aninhado, por exemplo `arquivos`, sem alterar rotas.
- A listagem não precisa exibir arquivos neste escopo, a menos que seja decidido mostrar um indicador nos cards.
- A área de arquivos deve ser adicionada na página individual, preferencialmente após o conteúdo do post e antes das imagens adicionais, ou ao final do conteúdo antes do carrossel.

## Uploads, S3 e DigitalOcean Spaces no projeto

O projeto já usa `django-storages` com backend S3 compatível.

Configuração principal:

- Arquivo: `bef-backend/app/rkp_platform/settings.py`.
- `MEDIA_URL = "/media/"` e `MEDIA_ROOT = "./media/"`.
- Quando `USE_MINIO=true`, `DEFAULT_FILE_STORAGE = "rkp_platform.storage_backends.MinIOMediaStorage"`.
- Caso contrário, `DEFAULT_FILE_STORAGE = "rkp_platform.storage_backends.MediaStorage"`.
- O ambiente padrão usa DigitalOcean Spaces:
  - bucket `kometro`;
  - região `nyc3`;
  - endpoint `https://kometro.nyc3.digitaloceanspaces.com`;
  - ACL padrão `public-read`.

Storage customizado:

- Arquivo: `bef-backend/app/rkp_platform/storage_backends.py`.
- `MediaStorage(S3Boto3Storage)` usa `location = "media"` e `file_overwrite = False`.
- `MinIOMediaStorage` também usa `location = "media"` e `file_overwrite = False`, sobrescrevendo `url()` para montar URL pública local.

Padrões existentes de arquivo:

- `blog.Post.imagem_destaque`: `ImageField(upload_to="blog/posts/")`.
- `documentos.Documento.arquivo`: `FileField(upload_to="documentos/")`.
- `propostas.Anexo.anexo`: `FileField(upload_to="anexos/")`.
- `instrumentos.Certificado.arquivo`: `FileField(upload_to="certificados/")`.
- `instrumentos.Anexo.anexo`: `FileField(upload_to="certificados/anexos/")`.

Conclusão:

- A feature deve usar `FileField` com `upload_to` específico, aproveitando o `DEFAULT_FILE_STORAGE`.
- Não é necessário implementar upload manual para Spaces neste escopo.
- A URL pública pode ser serializada a partir de `arquivo.url`, como os demais `FileField` do DRF já fazem.

## Plano técnico para backend

### Model

Criar um novo model em `bef-backend/app/blog/models.py`, por exemplo `ArquivoPost`:

Campos sugeridos:

- `post`: `ForeignKey(Post, on_delete=models.CASCADE, related_name="arquivos")`.
- `arquivo`: `FileField(upload_to="blog/posts/arquivos/")`.
- `nome_original`: `CharField(max_length=255)`.
- `titulo`: `CharField(max_length=255)`.
- `tipo`: `CharField(max_length=100, blank=True, null=True)`.
- `tamanho`: `PositiveIntegerField(blank=True, null=True)`, opcional mas recomendado.
- `criado_em`: `DateTimeField(auto_now_add=True)`, opcional.

Observações:

- `nome_original` deve ser preenchido no upload usando `arquivo.name` antes do storage renomear ou prefixar o path.
- `tipo` pode guardar MIME type (`application/pdf`) ou formato/extensão (`pdf`). O objetivo da feature fala "tipo/formato"; o contrato deve padronizar um dos dois. Recomendação: guardar MIME em `tipo` e expor também `extensao` calculada se o frontend precisar.
- `titulo` deve ser editável pelo admin/API; se vier vazio, pode assumir o nome original sem extensão.
- `arquivo.url` será a URL de acesso/download. Não é necessário duplicar a URL em banco, pois ela é derivada do storage. Se houver requisito explícito de armazenar URL imutável, adicionar campo `url` preenchido no save, mas isso cria risco de URL obsoleta ao mudar storage.

Delete:

- Implementar remoção do objeto no storage quando `ArquivoPost` for excluído, seguindo o padrão já usado em `Post.delete()` e `DocumentoViewSet.destroy()`.
- Para exclusão em cascata do `Post`, garantir que os arquivos físicos também sejam removidos. Pode ser via override de `ArquivoPost.delete()` e/ou signal `post_delete`.

Migration:

- Criar migration para o novo model.
- Não é necessário backfill para posts antigos; eles simplesmente terão `arquivos=[]`.

### Admin

Adicionar `ArquivoPostInline(admin.TabularInline)` em `blog/admin.py`.

Campos sugeridos no inline:

- `arquivo`;
- `titulo`;
- `nome_original` como somente leitura, se preenchido automaticamente;
- `tipo` como somente leitura, se preenchido automaticamente;
- `tamanho` como somente leitura, se existir.

Ponto em aberto:

- Definir se o upload será feito apenas pelo Django Admin ou também por endpoints DRF. Pelo padrão atual do blog, o admin é o caminho mais simples.

### Serializers

Criar `ArquivoPostSerializer` em `blog/serializers.py`.

Campos sugeridos para leitura:

- `id`;
- `titulo`;
- `nome_original`;
- `tipo`;
- `url`;
- `tamanho`;
- `criado_em`.

Implementação sugerida:

- `url = serializers.SerializerMethodField()`.
- `get_url(obj)` deve retornar `request.build_absolute_uri(obj.arquivo.url)` quando necessário, ou `obj.arquivo.url` quando o storage já retorna URL absoluta. Como Spaces/MinIO já retornam URL absoluta no storage, `obj.arquivo.url` tende a ser suficiente.
- Adicionar `arquivos = ArquivoPostSerializer(many=True, read_only=True)` no `PostSerializer`.
- Incluir `"arquivos"` em `PostSerializer.Meta.fields`.

Para escrita via API, se necessário:

- Criar serializer separado para upload, validando `arquivo` e aceitando `titulo`.
- Usar `MultiPartParser`/`FormParser` na view/action.
- Como o escopo não exige gerenciamento avançado, pode-se limitar a criação pelo admin inicialmente.

### Views e querysets

Atualizar `PostViewSet` para otimizar consultas:

- Usar `prefetch_related("imagens_adicionais", "videos_url", "arquivos")`.
- Manter filtro `visivel=True`.
- Manter action `featured` com o mesmo prefetch.

Se upload via API for incluído:

- Criar action simples, por exemplo `@action(detail=True, methods=["post"]) def anexar_arquivo(...)`.
- Receber `multipart/form-data` com `arquivo` e `titulo`.
- Criar `ArquivoPost` vinculado ao post.
- Retornar `ArquivoPostSerializer`.
- Restringir permissão a admin/staff, porque endpoints públicos de posts hoje não devem aceitar upload anônimo.

### Validações

Validar ao menos:

- extensão permitida;
- MIME type quando disponível;
- tamanho máximo;
- arquivo obrigatório.

Formatos citados no objetivo:

- PDF: `.pdf`, `application/pdf`;
- Excel: `.xls`, `.xlsx`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`;
- PowerPoint: `.ppt`, `.pptx`, `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation`;
- Word: `.doc`, `.docx`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`;
- imagens: `.jpg`, `.jpeg`, `.png`, `image/jpeg`, `image/png`.

Pontos em aberto:

- O projeto não possui hoje uma lista centralizada de formatos permitidos para uploads.
- Definir se "outros definidos no projeto" significa criar uma nova configuração global, por exemplo `BLOG_POST_FILE_ALLOWED_EXTENSIONS`, ou reaproveitar uma lista que ainda não existe.
- Definir tamanho máximo. Recomendação inicial: configurar por setting, por exemplo `BLOG_POST_FILE_MAX_SIZE_MB`, evitando valor hardcoded.

### Retorno da API

O endpoint `/posts/:id/` deve retornar os arquivos junto com o post no campo `arquivos`.

Para posts sem arquivos:

- Retornar `arquivos: []`.
- Isso mantém compatibilidade com posts antigos e simplifica o frontend.

## Plano técnico para frontend

### Onde exibir

Arquivo principal: `bef-landing-page/pages/conhecimento/[single].js`.

Adicionar a área de arquivos na página individual do post:

- Após o bloco de texto (`post.texto`) e antes do carrossel de imagens adicionais; ou
- Após imagens adicionais, se a intenção visual for tratar downloads como complemento final.

Recomendação:

- Exibir após o conteúdo textual, porque o visitante termina a leitura e encontra os materiais relacionados antes de conteúdos visuais extras.

### Componente sugerido

Criar componente em `bef-landing-page/layouts/components/PostFiles.js` ou similar.

Props:

- `files`: array vindo de `post.arquivos`.

Comportamento:

- Se `files` for vazio, `null`, `undefined` ou não-array, renderizar `null`.
- Se houver arquivos, renderizar uma seção com título curto, por exemplo "Arquivos para download".
- Cada arquivo deve exibir:
  - título do documento;
  - nome original ou formato;
  - tamanho formatado, se disponível;
  - botão/link "Abrir" ou "Baixar".

Link:

- Usar `<a href={file.url} target="_blank" rel="noopener noreferrer">`.
- Para forçar download, pode-se usar `download`, mas em URLs de outro domínio/S3 o comportamento depende do navegador e dos headers do objeto. Por isso, o texto "Abrir ou baixar" é mais honesto tecnicamente.

Visual:

- Manter o estilo com Tailwind usado na página:
  - container dentro da largura `max-w-4xl`;
  - bordas claras como `border border-gray-200`;
  - `rounded-lg` ou `rounded-xl`, acompanhando cards existentes;
  - cor primária já usada em links/botões (`text-primary`);
  - sem preview interno.

### Quando não houver arquivos

Não renderizar a seção.

Não exibir mensagem de vazio na página pública, porque posts antigos e posts sem anexos são casos normais.

## Exemplo de JSON esperado

Exemplo para `/posts/12/`:

```json
{
  "id": 12,
  "titulo": "Guia de calibração de instrumentos",
  "imagem_destaque": "https://kometro.nyc3.digitaloceanspaces.com/media/blog/posts/capa.jpg",
  "imagem_destaque_url": null,
  "categoria": {
    "id": 3,
    "nome": "Metrologia"
  },
  "publicado_em": "2026-06-12T10:00:00-03:00",
  "visivel": true,
  "imagens_adicionais": [],
  "resumo": "Materiais de apoio para calibração.",
  "destaque": false,
  "midia": [],
  "texto": "<p>Conteúdo do post...</p>",
  "arquivos": [
    {
      "id": 1,
      "titulo": "Checklist de calibração",
      "nome_original": "checklist-calibracao.pdf",
      "tipo": "application/pdf",
      "url": "https://kometro.nyc3.digitaloceanspaces.com/media/blog/posts/arquivos/checklist-calibracao.pdf",
      "tamanho": 245760,
      "criado_em": "2026-06-12T10:05:00-03:00"
    },
    {
      "id": 2,
      "titulo": "Planilha de controle",
      "nome_original": "controle-instrumentos.xlsx",
      "tipo": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "url": "https://kometro.nyc3.digitaloceanspaces.com/media/blog/posts/arquivos/controle-instrumentos.xlsx",
      "tamanho": 98304,
      "criado_em": "2026-06-12T10:08:00-03:00"
    }
  ]
}
```

## Pontos de atenção

Posts antigos:

- Devem continuar funcionando sem migração de dados.
- O serializer deve retornar `arquivos: []`.
- O frontend deve ocultar a seção quando não houver arquivos.

Segurança:

- Upload deve ser restrito a admin/staff ou usuários autenticados autorizados.
- Validar extensão e MIME type; extensão sozinha não é suficiente.
- Considerar sanitização do nome original antes de exibir.
- Não renderizar conteúdo do arquivo no navegador dentro da página.
- Usar `rel="noopener noreferrer"` em links com `target="_blank"`.

Formatos:

- O projeto ainda não tem uma lista central de formatos permitidos.
- Evitar aceitar executáveis, scripts, HTML, SVG e arquivos compactados sem decisão explícita.
- Confirmar se JPEG/PNG devem ser aceitos como documentos anexos além das imagens adicionais já existentes.

Tamanho dos arquivos:

- Não há limite específico identificado para uploads do blog.
- Definir limite por setting para evitar uploads grandes em excesso.
- Considerar limite diferente por tipo, se necessário, mas isso pode ficar fora do escopo inicial.

URLs públicas ou assinadas:

- A configuração atual usa `AWS_DEFAULT_ACL = "public-read"` e não define `AWS_QUERYSTRING_AUTH` no ambiente DigitalOcean Spaces.
- Portanto, a abordagem atual sugere URLs públicas.
- Se o negócio exigir controle de acesso ou expiração, será necessário mudar para URLs assinadas e possivelmente criar endpoint de download. Isso aumenta o escopo.

Cache e rebuild:

- A página individual usa `getStaticProps` com `revalidate: 60`, mas também há rebuild via GitHub Actions nos signals do blog.
- Alterar anexos em um model separado não necessariamente dispara `post_save` de `Post`.
- A implementação deve garantir invalidação/rebuild quando arquivos forem criados, alterados ou removidos.

Compatibilidade da API:

- Adicionar `arquivos` como campo novo é backward-compatible para o frontend atual.
- Se o frontend passar a depender desse campo, deve tratar ausência do campo para tolerar deploys backend/frontend fora de ordem.

Nome original vs path do storage:

- `FileField.name` guarda o path no storage, não necessariamente o nome original do upload.
- A feature pede nome original; esse valor deve ser salvo explicitamente em campo próprio.

## Etapas sugeridas para implementação

1. Definir constantes/settings para formatos permitidos e tamanho máximo.
2. Criar `ArquivoPost` em `blog/models.py` com `FileField`, metadados e relacionamento `related_name="arquivos"`.
3. Criar migration do blog.
4. Adicionar validações de extensão, MIME e tamanho no model, serializer ou helper dedicado.
5. Atualizar admin com inline de arquivos em `PostAdmin`.
6. Criar `ArquivoPostSerializer` e incluir `arquivos` no `PostSerializer`.
7. Otimizar `PostViewSet` com `prefetch_related`.
8. Se necessário, criar action DRF para upload via `multipart/form-data`, restrita a admin/staff.
9. Garantir remoção do arquivo físico ao excluir `ArquivoPost` ou `Post`.
10. Garantir rebuild/invalidação da landing quando anexos forem alterados.
11. Criar componente `PostFiles` na landing.
12. Renderizar o componente em `pages/conhecimento/[single].js` somente quando `post.arquivos` tiver itens.
13. Testar manualmente um post sem arquivos e um post com múltiplos arquivos.
14. Validar URLs geradas em ambiente local/MinIO e em DigitalOcean Spaces.
15. Rodar verificações existentes do backend/frontend aplicáveis antes do deploy.

