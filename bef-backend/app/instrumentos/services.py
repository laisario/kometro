from .models import CriterioAceitacao, Normativo, PontoDeCalibracao, Setor


def normalizar_nome_normativo(nome):
    if nome is None:
        return ""
    return " ".join(str(nome).strip().split())


def chave_normativo(nome):
    return normalizar_nome_normativo(nome).casefold()


def get_or_create_normativo_cliente(nome, cliente):
    nome_normalizado = normalizar_nome_normativo(nome)
    if not nome_normalizado:
        return None

    chave = chave_normativo(nome_normalizado)
    for normativo in Normativo.objects.filter(cliente=cliente).order_by("id"):
        if chave_normativo(normativo.nome) == chave:
            return normativo

    return Normativo.objects.create(nome=nome_normalizado, cliente=cliente)


def deduplicar_normativos(normativos):
    normativos_unicos = []
    chaves_vistas = set()

    for normativo in normativos:
        chave = (normativo.cliente_id, chave_normativo(normativo.nome))
        if chave in chaves_vistas:
            continue
        chaves_vistas.add(chave)
        normativos_unicos.append(normativo)

    return normativos_unicos


def get_or_create_setor_from_path(caminho, cliente):
    """
    Resolve um caminho hierarquico de setor sem quebrar com duplicados antigos.

    Quando ja existem setores duplicados para o mesmo cliente/pai/nome, usa o
    menor id. Isso evita erro 500 por MultipleObjectsReturned e nao cria outro
    duplicado.
    """
    if not caminho:
        return None

    sector_names = caminho.strip().split("/")
    setor_pai = None

    for nome in sector_names:
        nome = nome.strip()
        if not nome:
            continue

        setor = (
            Setor.objects.filter(
                nome=nome,
                setor_pai=setor_pai,
                cliente=cliente,
            )
            .order_by("id")
            .first()
        )

        if not setor:
            setor = Setor.objects.create(
                nome=nome,
                setor_pai=setor_pai,
                cliente=cliente,
            )

        setor_pai = setor

    return setor_pai


def _nome_ponto(ponto):
    if isinstance(ponto, dict):
        ponto = ponto.get("nome")
    if ponto is None:
        return None
    nome = str(ponto).strip()
    return nome or None


def _criterio_equivalente_queryset(instance, criterio_data):
    return instance.criterios_aceitacao.filter(
        tipo=criterio_data.get("tipo"),
        criterio_de_aceitacao=criterio_data.get("criterio_de_aceitacao"),
        referencia_do_criterio=criterio_data.get("referencia_do_criterio"),
        observacao_criterio_aceitacao=criterio_data.get("observacao_criterio_aceitacao"),
        unidade=criterio_data.get("unidade"),
    )


def atualizar_relacionamentos_instrumento(
    instance,
    normativos_nomes=None,
    pontos_data=None,
    criterios_data=None,
):
    """
    Atualiza relacionamentos do instrumento sem apagar registros históricos.

    Normativos continuam sendo substituídos pelo conjunto enviado. Pontos de
    calibração e critérios de aceitação são preservados e atualizados/criados de
    forma incremental.
    """
    if normativos_nomes is not None:
        normativos_objs = []
        normativos_ids_vistos = set()
        for nome in normativos_nomes:
            if isinstance(nome, dict):
                nome = nome.get("nome")
            normativo = get_or_create_normativo_cliente(nome, instance.cliente)
            if normativo and normativo.id not in normativos_ids_vistos:
                normativos_ids_vistos.add(normativo.id)
                normativos_objs.append(normativo)
        instance.normativos.set(normativos_objs)

    if pontos_data is not None:
        nomes_vistos = set()
        for ponto in pontos_data:
            nome = _nome_ponto(ponto)
            if not nome or nome in nomes_vistos:
                continue
            nomes_vistos.add(nome)
            PontoDeCalibracao.objects.get_or_create(
                instrumento=instance,
                nome=nome,
            )

    if criterios_data is not None:
        equivalentes_vistos = set()
        for criterio in criterios_data:
            criterio_data = dict(criterio)
            criterio_id = criterio_data.pop("id", None)

            if criterio_id:
                criterio_obj = instance.criterios_aceitacao.filter(id=criterio_id).first()
                if criterio_obj:
                    for attr, value in criterio_data.items():
                        setattr(criterio_obj, attr, value)
                    criterio_obj.save()
                    continue

            chave_equivalente = tuple(
                criterio_data.get(campo)
                for campo in (
                    "tipo",
                    "criterio_de_aceitacao",
                    "referencia_do_criterio",
                    "observacao_criterio_aceitacao",
                    "unidade",
                )
            )
            if chave_equivalente in equivalentes_vistos:
                continue
            equivalentes_vistos.add(chave_equivalente)

            if _criterio_equivalente_queryset(instance, criterio_data).exists():
                continue

            CriterioAceitacao.objects.create(
                instrumento=instance,
                **criterio_data,
            )
