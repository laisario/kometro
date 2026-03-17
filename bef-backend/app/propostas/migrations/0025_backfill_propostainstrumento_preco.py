from decimal import Decimal

from django.db import migrations


def get_suggested_preco(instrumento, local):
    """Suggested price: alternative first, then catalog by local. T -> None."""
    if local == "T":
        return None
    if instrumento.preco_alternativo_calibracao is not None:
        return instrumento.preco_alternativo_calibracao
    inst = instrumento.instrumento
    if local == "C":
        p = inst.preco_calibracao_no_cliente
    else:
        p = inst.preco_calibracao_no_laboratorio
    return p if p is not None else Decimal("0")


def backfill_preco(apps, schema_editor):
    Proposta = apps.get_model("propostas", "Proposta")
    PropostaInstrumento = apps.get_model("propostas", "PropostaInstrumento")
    InstrumentoDoCliente = apps.get_model("instrumentos", "InstrumentoDoCliente")

    # 1. Backfill preco for existing PropostaInstrumento where preco is null
    for pi in PropostaInstrumento.objects.select_related("instrumento", "instrumento__instrumento").filter(preco__isnull=True):
        suggested = get_suggested_preco(pi.instrumento, pi.local)
        pi.preco = suggested if suggested is not None else Decimal("0")
        pi.save(update_fields=["preco"])

    # 2. Create PropostaInstrumento for instruments in M2M that don't have one
    for proposta in Proposta.objects.prefetch_related("instrumentos", "instrumentos_selecoes"):
        existing_ids = set(pi.instrumento_id for pi in proposta.instrumentos_selecoes.all())
        local_default = proposta.local or "P"
        for instrumento in proposta.instrumentos.all():
            if instrumento.id not in existing_ids:
                suggested = get_suggested_preco(instrumento, local_default)
                PropostaInstrumento.objects.create(
                    proposta=proposta,
                    instrumento=instrumento,
                    service_kind="calibracao",
                    local=local_default,
                    preco=suggested if suggested is not None else Decimal("0"),
                )

    # 3. Recompute total for all proposals
    from django.db.models import Sum, F, Value
    from django.db.models.functions import Coalesce

    for proposta in Proposta.objects.all():
        result = PropostaInstrumento.objects.filter(proposta=proposta).aggregate(
            total=Sum(Coalesce(F("preco"), Value(Decimal("0"))))
        )
        total = result.get("total") or Decimal("0")
        proposta.total = total
        proposta.save(update_fields=["total"])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("propostas", "0024_propostainstrumento_preco"),
    ]

    operations = [
        migrations.RunPython(backfill_preco, noop),
    ]
