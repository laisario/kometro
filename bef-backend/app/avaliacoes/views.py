from rest_framework import viewsets
from .models import Avaliacao
from .serializers import AvaliacaoSerializer


class AvaliacaoViewSet(viewsets.ModelViewSet):
    queryset = Avaliacao.objects.all().order_by("-criado_em")
    serializer_class = AvaliacaoSerializer
    pagination_class = None
