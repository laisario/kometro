from rest_framework import viewsets, response
from .models import Categoria, Equipamento
from .serializers import CategoriaSerializer, EquipamentoSerializer
from .pagination import CustomPagination

class CategoriaEquipamentosViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    pagination_class = None


class EquipamentosViewSet(viewsets.ModelViewSet):
    serializer_class = EquipamentoSerializer
    pagination_class = CustomPagination

    def get_queryset(self):
        queryset = Equipamento.objects.filter().order_by()
        categoria_id = self.request.query_params.get("categoria")
        
        if categoria_id and categoria_id != "todas":
            queryset = queryset.filter(categoria_id=categoria_id)

        return queryset