from .models import CriterioAceitacao, Normativo, PontoDeCalibracao


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
        for nome in normativos_nomes:
            if isinstance(nome, dict):
                nome = nome.get("nome")
            if nome:
                normativo, _ = Normativo.objects.get_or_create(
                    nome=nome,
                    cliente=instance.cliente,
                )
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
