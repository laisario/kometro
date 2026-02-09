from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.db import transaction

from .models import OrdemServico, InstrumentoOS, TipoOS, StatusOS
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
    
    @action(detail=True, methods=['POST'], permission_classes=[IsAuthenticated])
    def reallocar(self, request, pk=None):
        """
        Move an instrument from this OS to another OS (existing or new).
        
        Request body:
        {
            "instrumento_id": 123,
            "nova_os_id": 456,  // null to create new OS
            "nova_os_tipo": "CAL"  // required if nova_os_id is null
        }
        """
        if not request.user.groups.filter(name='gerente').exists():
            return Response(
                {"detail": "Apenas gerentes podem realocar instrumentos."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        os = self.get_object()
        instrumento_id = request.data.get('instrumento_id')
        nova_os_id = request.data.get('nova_os_id')
        nova_os_tipo = request.data.get('nova_os_tipo')
        
        if not instrumento_id:
            return Response(
                {"detail": "instrumento_id é obrigatório."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            instrumento_os = InstrumentoOS.objects.get(
                ordem_servico=os,
                instrumento_id=instrumento_id
            )
        except InstrumentoOS.DoesNotExist:
            return Response(
                {"detail": "Instrumento não encontrado nesta ordem de serviço."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        with transaction.atomic():
            if nova_os_id:
                # Move to existing OS
                try:
                    nova_os = OrdemServico.objects.get(id=nova_os_id)
                except OrdemServico.DoesNotExist:
                    return Response(
                        {"detail": "Ordem de serviço de destino não encontrada."},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Get next item number in new OS
                max_item = InstrumentoOS.objects.filter(
                    ordem_servico=nova_os
                ).aggregate(max_item=models.Max('item'))['max_item'] or 0
                
                instrumento_os.ordem_servico = nova_os
                instrumento_os.item = max_item + 1
                instrumento_os.save()
            else:
                # Create new OS
                if not nova_os_tipo:
                    return Response(
                        {"detail": "nova_os_tipo é obrigatório ao criar nova OS."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Generate OS number
                proposta = os.proposta
                os_count = proposta.ordens_servico.filter(tipo_os=nova_os_tipo).count() + 1
                numero = f"{proposta.numero}-OS-{nova_os_tipo}-{os_count:03d}"
                
                nova_os = OrdemServico.objects.create(
                    proposta=proposta,
                    tipo_os=nova_os_tipo,
                    status=StatusOS.A_REALIZAR,
                    numero=numero
                )
                
                instrumento_os.ordem_servico = nova_os
                instrumento_os.item = 1
                instrumento_os.save()
            
            # Recalculate item numbers in old OS
            for idx, inst_os in enumerate(
                InstrumentoOS.objects.filter(ordem_servico=os).order_by('item'),
                start=1
            ):
                inst_os.item = idx
                inst_os.save(update_fields=['item'])
        
        return Response({
            "message": "Instrumento realocado com sucesso.",
            "nova_os_id": nova_os.id if not nova_os_id else nova_os_id,
            "nova_os_numero": nova_os.numero if not nova_os_id else OrdemServico.objects.get(id=nova_os_id).numero
        })
    
    @action(detail=True, methods=['POST'], permission_classes=[IsAuthenticated])
    def gerar_certificado(self, request, pk=None):
        """
        Generate certificate number for an instrument in this OS.
        
        Request body:
        {
            "instrumento_id": 123
        }
        
        For calibration OS, certificate is auto-generated on OS creation.
        For other OS types, this endpoint generates it manually.
        """
        if not request.user.is_staff:
            return Response(
                {"detail": "Acesso negado."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        os = self.get_object()
        instrumento_id = request.data.get('instrumento_id')
        
        if not instrumento_id:
            return Response(
                {"detail": "instrumento_id é obrigatório."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            instrumento_os = InstrumentoOS.objects.get(
                ordem_servico=os,
                instrumento_id=instrumento_id
            )
        except InstrumentoOS.DoesNotExist:
            return Response(
                {"detail": "Instrumento não encontrado nesta ordem de serviço."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Generate certificate number
        numero_certificado = f"{os.numero}-{instrumento_os.item:03d}"
        
        # Check uniqueness
        from instrumentos.models import InstrumentoDoCliente
        if InstrumentoDoCliente.objects.filter(
            numero_certificado=numero_certificado
        ).exclude(id=instrumento_os.instrumento_id).exists():
            return Response(
                {"detail": f"Número de certificado {numero_certificado} já existe."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        instrumento_os.instrumento.numero_certificado = numero_certificado
        instrumento_os.instrumento.save(update_fields=['numero_certificado'])
        
        return Response({
            "numero_certificado": numero_certificado,
            "instrumento_id": instrumento_id
        })
    
    @action(detail=True, methods=['PATCH'], permission_classes=[IsAuthenticated])
    def finalizar(self, request, pk=None):
        """
        Mark OS as "realizado" (finished).
        This enables billing release for the proposal.
        """
        if not request.user.groups.filter(name='gerente').exists():
            return Response(
                {"detail": "Apenas gerentes podem finalizar ordens de serviço."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        os = self.get_object()
        
        if not os.pode_transicionar_status(StatusOS.REALIZADO):
            return Response(
                {"detail": f"Não é possível finalizar OS com status {os.get_status_display()}."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        os.status = StatusOS.REALIZADO
        os.save(update_fields=['status'])
        
        # Check if all OS for this proposal are finished
        proposta = os.proposta
        todas_finalizadas = proposta.ordens_servico.exclude(
            status=StatusOS.REALIZADO
        ).exclude(
            status=StatusOS.CANCELADO
        ).count() == 0
        
        return Response({
            "message": "Ordem de serviço finalizada com sucesso.",
            "todas_os_finalizadas": todas_finalizadas,
            "pode_liberar_faturamento": todas_finalizadas
        })