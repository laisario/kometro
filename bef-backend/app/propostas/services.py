from decimal import Decimal
from django.db.models import F, Sum, Value
from django.db.models.functions import Coalesce
from .models import PropostaInstrumento


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