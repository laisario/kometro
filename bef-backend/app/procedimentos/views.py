from rest_framework import viewsets
from .serializer import WriteProcedimentoSerializer, ReadProcedimentoSerializer
from .models import Procedimento
from clientes.permissions import NivelPermission

class ProcedimentoViewSet(viewsets.ModelViewSet):
    cliente_field = "cliente"
    permission_classes = [NivelPermission]

    def get_serializer_class(self, *args, **kwargs):
        if self.action in ["list", "retrieve"]:
            return ReadProcedimentoSerializer
        return WriteProcedimentoSerializer

    def get_queryset(self):
        return Procedimento.objects.all().order_by()
