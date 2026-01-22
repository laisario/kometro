from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models import OrdemServico
from .serializers import (
    OrdemServicoSerializer, 
    OrdemServicoDetailSerializer,
    OrdemServicoUpdateSerializer
)


class OrdemServicoViewSet(viewsets.ModelViewSet):
    """
    Endpoints:
    - GET /ordens-servico/ - List all OS (staff only)
    - GET /ordens-servico/?responsavel={id} - Filter OS by responsavel
    - GET /ordens-servico/{id}/ - Get OS detail with instruments
    - GET /ordens-servico/minhas/ - Get current user's OS
    - GET /ordens-servico/minhas/?limit=5 - Get last 5 OS for user
    - PATCH /ordens-servico/{id}/ - Update OS (gerente only)
    """
    queryset = OrdemServico.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['numero', 'proposta__numero', 'proposta__cliente__empresa__razao_social']
    ordering_fields = ['data_criacao', 'data_expiracao', 'numero']
    ordering = ['-data_criacao']
    
    def get_queryset(self):
        queryset = OrdemServico.objects.select_related(
            'proposta__cliente__empresa', 
            'responsavel'
        ).prefetch_related('instrumentos')
        
        responsavel_id = self.request.query_params.get('responsavel')
        if responsavel_id:
            queryset = queryset.filter(responsavel_id=responsavel_id)
        
        return queryset.order_by('-data_criacao')
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return OrdemServicoDetailSerializer
        if self.action in ['update', 'partial_update']:
            return OrdemServicoUpdateSerializer
        return OrdemServicoSerializer
    
    def list(self, request, *args, **kwargs):
        """List OS - requires staff permission"""
        if not request.user.is_staff:
            return Response(
                {"detail": "Acesso negado. Apenas funcionários podem visualizar ordens de serviço."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().list(request, *args, **kwargs)
    
    def retrieve(self, request, *args, **kwargs):
        """Get OS detail - requires staff permission"""
        if not request.user.is_staff:
            return Response(
                {"detail": "Acesso negado. Apenas funcionários podem visualizar ordens de serviço."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().retrieve(request, *args, **kwargs)
    
    @action(detail=False, methods=['GET'])
    def minhas(self, request):
        """
        Query params:
        - limit: Optional, limit the number of results (e.g., ?limit=5)
        """
        if not request.user.is_staff:
            return Response(
                {"detail": "Acesso negado. Apenas funcionários podem visualizar ordens de serviço."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = self.get_queryset().filter(responsavel=request.user)
        
        limit = request.query_params.get('limit')
        if limit:
            try:
                limit = int(limit)
                queryset = queryset[:limit]
            except ValueError:
                pass
        
        serializer = OrdemServicoSerializer(queryset, many=True)
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        """Update OS - only gerente can update"""
        if not request.user.groups.filter(name='gerente').exists():
            return Response(
                {"detail": "Apenas gerentes podem editar ordens de serviço."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        """Partial update OS - only gerente can update"""
        if not request.user.groups.filter(name='gerente').exists():
            return Response(
                {"detail": "Apenas gerentes podem editar ordens de serviço."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().partial_update(request, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        """Disable manual creation - OS is created automatically on proposal approval"""
        return Response(
            {"detail": "Ordens de serviço são criadas automaticamente ao aprovar uma proposta."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    def destroy(self, request, *args, **kwargs):
        """Disable deletion - OS should not be deleted manually"""
        return Response(
            {"detail": "Ordens de serviço não podem ser excluídas."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
