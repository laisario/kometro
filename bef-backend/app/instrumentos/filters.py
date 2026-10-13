from django_filters import rest_framework as filters
from .models import Calibracao, InstrumentoDoCliente, Normativo, TipoInstrumento
from datetime import timedelta
from django.utils import timezone
from datetime import datetime
from django.db.models import Q
from django.utils.dateparse import parse_date


def _parse_filter_date(value):
    if not value:
        return None
    if hasattr(value, "year") and not isinstance(value, str):
        return value

    parsed = parse_date(str(value))
    if parsed:
        return parsed

    try:
        return datetime.strptime(
            str(value), "%a, %d %b %Y %H:%M:%S %Z"
        ).date()
    except ValueError:
        return None


def apply_instrument_export_filters(queryset, validated_filters):
    """Apply the explicit export filter allowlist to an authorized queryset."""
    status = validated_filters.get("status", "all")
    date_start = validated_filters.get("date_start")
    date_stop = validated_filters.get("date_stop")
    today = timezone.now().date()

    if status == "expired":
        queryset = queryset.filter(data_proxima_calibracao__lt=today)
    elif status == "expiringSoon":
        queryset = queryset.filter(
            data_proxima_calibracao__gte=today,
            data_proxima_calibracao__lte=today + timedelta(days=30),
        )

    if date_start:
        queryset = queryset.filter(data_proxima_calibracao__gte=date_start)
    if date_stop:
        queryset = queryset.filter(data_proxima_calibracao__lte=date_stop)

    norma = validated_filters.get("norma")
    if norma:
        queryset = queryset.filter(normativos__nome__icontains=norma)

    expiration_status = validated_filters.get("expiration_status", "all")
    if expiration_status == "expired":
        queryset = queryset.filter(expirado=True)
    elif expiration_status == "up_to_date":
        queryset = queryset.filter(expirado=False)

    expirado = validated_filters.get("expirado")
    if expirado is not None:
        queryset = queryset.filter(expirado=expirado)

    tipo_instrumento = validated_filters.get("tipo_instrumento")
    if tipo_instrumento:
        queryset = queryset.filter(
            instrumento__tipo_de_instrumento_id=tipo_instrumento
        )

    search = validated_filters.get("search")
    if search:
        queryset = queryset.filter(
            Q(tag__icontains=search)
            | Q(instrumento__tipo_de_instrumento__descricao__icontains=search)
            | Q(instrumento__tipo_de_instrumento__modelo__icontains=search)
            | Q(instrumento__tipo_de_instrumento__fabricante__icontains=search)
            | Q(normativos__nome__icontains=search)
            | Q(calibracoes__certificados__numero__icontains=search)
        )

    return queryset.distinct()


class CalibracaoFilter(filters.FilterSet):
    ordem_de_servico = filters.CharFilter(
        field_name="ordem_de_servico",
    )

    class Meta:
        model = Calibracao
        fields = ["ordem_de_servico"]


class InstrumentoDoClienteFilter(filters.FilterSet):
    expiration_status = filters.ChoiceFilter(
        choices=(
            ("all", "All"),
            ("expired", "Expired"),
            ("up_to_date", "Up to date"),
        ),
        method="filter_by_expiration_status",
    )
    status = filters.CharFilter(method='filter_by_status')
    norma = filters.CharFilter(method="filter_by_norma")
    expirado = filters.BooleanFilter(field_name='expirado')
    tipo_instrumento = filters.NumberFilter(
        field_name='instrumento__tipo_de_instrumento__id'
    )

    def filter_by_status(self, queryset, name, value):
        today = timezone.now().date()
        date_start = self.data.get('dateStart')
        date_stop = self.data.get('dateStop')

        date_start = _parse_filter_date(date_start)
        date_stop = _parse_filter_date(date_stop)

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

    def filter_by_expiration_status(self, queryset, name, value):
        if value == "expired":
            return queryset.filter(expirado=True)
        if value == "up_to_date":
            return queryset.filter(expirado=False)
        return queryset

    class Meta:
        model = InstrumentoDoCliente
        fields = ['expiration_status', 'expirado', 'tipo_instrumento']
