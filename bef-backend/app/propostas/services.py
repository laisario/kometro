from decimal import Decimal
from django.db.models import F, Sum, Value
from django.db.models.functions import Coalesce
from .models import PropostaInstrumento


def get_resolved_preco(instrumento_do_cliente, local):
    """
    Resolve the effective price for a proposal item when manual preco is not set.

    Precedence:
    1. InstrumentoDoCliente.preco_alternativo_calibracao if set
    2. catalog by local: P -> preco_calibracao_no_laboratorio, C -> preco_calibracao_no_cliente
    3. T (Terceirizado): no catalog price -> 0
    4. If catalog is null -> 0

    Returns Decimal for use in sum.
    """
    if local == "T":
        return Decimal("0")
    if instrumento_do_cliente.preco_alternativo_calibracao is not None:
        return instrumento_do_cliente.preco_alternativo_calibracao
    inst = instrumento_do_cliente.instrumento
    if not inst:
        return Decimal("0")
    if local == "C":
        p = inst.preco_calibracao_no_cliente
    else:
        p = inst.preco_calibracao_no_laboratorio
    return p if p is not None else Decimal("0")


def recompute_total(proposta):
    """
    Recompute Proposta.total from the sum of PropostaInstrumento.preco.

    Treats null preco as 0. Sets proposta.total and saves.
    """
    result = (
        PropostaInstrumento.objects.filter(proposta=proposta)
        .aggregate(total=Sum(Coalesce(F("preco"), Value(Decimal("0")))))
    )
    total = result.get("total")
    if total is None:
        total = Decimal("0")
    proposta.total = total
    proposta.save(update_fields=["total"])