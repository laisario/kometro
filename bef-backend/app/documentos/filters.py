from django_filters import rest_framework as filters
from .models import Documento


class DocumentoFilter(filters.FilterSet):
    status = filters.ChoiceFilter(
        choices=[("V", "Vigente"), ("O", "Obsoleto"), ("C", "Cancelado")]
    )
    vencido = filters.BooleanFilter()

    class Meta:
        model = Documento
        fields = ["status", "vencido"]
