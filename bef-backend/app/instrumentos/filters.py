from django_filters import rest_framework as filters
from .models import Calibracao, InstrumentoDoCliente, Normativo
from datetime import timedelta
from django.utils import timezone
from datetime import datetime


class CalibracaoFilter(filters.FilterSet):
    ordem_de_servico = filters.CharFilter(
        field_name="ordem_de_servico",
    )

    class Meta:
        model = Calibracao
        fields = ["ordem_de_servico"]


class InstrumentoDoClienteFilter(filters.FilterSet):
    status = filters.CharFilter(method='filter_by_status')
    norma = filters.CharFilter(method="filter_by_norma")


    def filter_by_status(self, queryset, name, value):
        today = timezone.now().date()
        date_start = self.data.get('dateStart')
        date_stop = self.data.get('dateStop')

        if date_start:
            date_start = datetime.strptime(date_start, "%a, %d %b %Y %H:%M:%S %Z").date()
        if date_stop:
            date_stop = datetime.strptime(date_stop, "%a, %d %b %Y %H:%M:%S %Z").date()

        field = 'data_proxima_calibracao'

        if value == "expired":
            queryset = queryset.filter(**{f"{field}__lt": today})
        elif value == "expiringSoon":
            one_month = today + timedelta(days=30)
            queryset = queryset.filter(**{
                f"{field}__gte": today,
                f"{field}__lte": one_month
            })

        if date_start:
            queryset = queryset.filter(**{f"{field}__gte": date_start})
        if date_stop:
            queryset = queryset.filter(**{f"{field}__lte": date_stop})

        return queryset
    
    def filter_by_norma(self, queryset, name, value):
        return queryset.filter(normativos__nome__icontains=value).distinct()

    class Meta:
        model = InstrumentoDoCliente
        fields = []