from django_filters import rest_framework as filters
from .models import Proposta


class PropostaFilter(filters.FilterSet):
    status = filters.ChoiceFilter(
        choices=[
            ("E", "Elaboração"),
            ("AA", "Aguardando aprovação"),
            ("A", "Aprovada"),
            ("R", "Reprovada"),
        ]
    )
    data_criacao = filters.DateFromToRangeFilter()

    class Meta:
        model = Proposta
        fields = ["status", "data_criacao"]
