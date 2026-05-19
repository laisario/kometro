import logging

from celery import current_app
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.db import transaction
from django.db.models import Max

from .models import OrdemServico, InstrumentoOS, TipoOS, StatusOS
from .serializers import (
    OrdemServicoSerializer, 
    OrdemServicoDetailSerializer,
    OrdemServicoUpdateSerializer,
    OrdemServicoStatusUpdateSerializer,
    OrdemServicoTechnicalVisitCreateSerializer,
)

logger = logging.getLogger(__name__)


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
    search_fields = [
        'numero',
        'proposta__numero',
        'proposta__cliente__empresa__razao_social',
        'cliente__empresa__razao_social',
    ]
    ordering_fields = ['data_criacao', 'data_expiracao', 'numero']
    ordering = ['-data_criacao']
    
    def get_queryset(self):
        queryset = OrdemServico.objects.select_related(
            'proposta__cliente__empresa', 
            'cliente__empresa',
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
        if self.action == 'create':
            return OrdemServicoTechnicalVisitCreateSerializer
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
        """Create a Technical Visit OS manually."""
        if not request.user.groups.filter(name__in=['gerente', 'registrador']).exists():
            return Response(
                {"detail": "Apenas gestores e executores podem criar visita técnica."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Delete OS - only gerente can delete."""
        if not request.user.groups.filter(name='gerente').exists():
            return Response(
                {"detail": "Apenas gerentes podem excluir ordens de serviço."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['PATCH'], url_path='atualizar-status', permission_classes=[IsAuthenticated])
    def atualizar_status(self, request, pk=None):
        """
        Update only the status of an OS, allowing any status value (AR, EA, RE, CA).
        This endpoint is used by the frontend status chip/select and intentionally
        bypasses the automatic 'EM_ANDAMENTO' enforcement from OrdemServicoUpdateSerializer.
        """
        if not request.user.groups.filter(name='gerente').exists():
            return Response(
                {"detail": "Apenas gerentes podem editar o status das ordens de serviço."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        os = self.get_object()
        serializer = OrdemServicoStatusUpdateSerializer(os, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {
                "message": "Status da ordem de serviço atualizado com sucesso.",
                "status": os.status,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['POST'], url_path='gerar-proposta', permission_classes=[IsAuthenticated])
    def gerar_proposta(self, request, pk=None):
        """Queue proposal generation from a completed Technical Visit OS."""
        if not request.user.groups.filter(name__in=['gerente', 'registrador']).exists():
            return Response(
                {"detail": "Apenas gestores e executores podem gerar proposta a partir de visita técnica."},
                status=status.HTTP_403_FORBIDDEN
            )

        os = self.get_object()
        if os.tipo_os != TipoOS.VISITA_TECNICA.value:
            return Response(
                {"detail": "Esta ação está disponível apenas para OS de visita técnica."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if os.status != StatusOS.REALIZADO:
            return Response(
                {"detail": "A proposta só pode ser gerada quando a visita técnica estiver realizada."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not os.resolved_cliente:
            return Response(
                {"detail": "A visita técnica precisa ter um cliente."},
                status=status.HTTP_400_BAD_REQUEST
            )

        instrumento_ids = request.data.get('instrumento_ids') or []
        if not isinstance(instrumento_ids, list) or not instrumento_ids:
            return Response(
                {"detail": "Selecione pelo menos um instrumento para gerar a proposta."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            instrumento_ids = [int(instrumento_id) for instrumento_id in instrumento_ids]
        except (TypeError, ValueError):
            return Response(
                {"detail": "instrumento_ids deve conter apenas números."},
                status=status.HTTP_400_BAD_REQUEST
            )

        from .tasks import criar_proposta_visita_tecnica

        task_name = criar_proposta_visita_tecnica.name
        if task_name not in current_app.tasks:
            logger.error("Celery task %s is not registered in the web process.", task_name)
            return Response(
                {"detail": "A tarefa de geração de proposta não está registrada no Celery."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            task = criar_proposta_visita_tecnica.delay(
                os.id,
                instrumento_ids,
                request.data.get('informacoes_adicionais'),
            )
        except Exception as exc:
            logger.exception("Failed to queue Technical Visit proposal generation task: %s", exc)
            return Response(
                {"detail": "Não foi possível iniciar a geração da proposta em segundo plano."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {
                "message": "Geração de proposta iniciada em segundo plano.",
                "task_id": task.id,
            },
            status=status.HTTP_202_ACCEPTED,
        )

    
    @action(detail=True, methods=['POST'], permission_classes=[IsAuthenticated])
    def reallocar(self, request, pk=None):
        """
        Move one or more instruments from this OS to a newly created OS.
        
        Request body:
        {
            "instrumento_ids": [17, 27, 35],
            "tipo_os": "CAL"  // Required: CAL, BAL, MAN, or EXT
        }
        
        Business Rules:
        - BR-SEL-1: Only instruments from origin OS can be moved
        - BR-CTX-1: New OS belongs to same proposal as origin OS
        - BR-TYPE-NEW-1: User must provide valid tipo_os
        - BR-STATUS-1: Origin OS cannot be REALIZADO or CANCELADO
        """
        if not request.user.groups.filter(name='gerente').exists():
            return Response(
                {"detail": "Apenas gerentes podem realocar instrumentos."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        os = self.get_object()
        
        # Validate origin OS status (BR-STATUS-1)
        if os.status in [StatusOS.REALIZADO, StatusOS.CANCELADO]:
            return Response(
                {"detail": "Não é possível mover instrumentos de uma OS finalizada ou cancelada."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get instrument IDs
        instrumento_ids = request.data.get('instrumento_ids')
        
        if not instrumento_ids:
            return Response(
                {"detail": "instrumento_ids é obrigatório."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Normalize to list
        if isinstance(instrumento_ids, str):
            # Handle comma-separated string
            try:
                instrumento_ids = [int(id.strip()) for id in instrumento_ids.split(',')]
            except ValueError:
                return Response(
                    {"detail": "instrumento_ids deve ser uma lista de números."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif not isinstance(instrumento_ids, list):
            return Response(
                {"detail": "instrumento_ids deve ser uma lista."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not instrumento_ids:
            return Response(
                {"detail": "Pelo menos um instrumento deve ser fornecido."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate and get tipo_os
        tipo_os = request.data.get('tipo_os')
        if not tipo_os:
            return Response(
                {
                    "detail": "tipo_os é obrigatório.",
                    "valid_types": [choice[0] for choice in TipoOS.choices]
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate tipo_os is a valid choice
        valid_types = [choice[0] for choice in TipoOS.choices]
        if tipo_os not in valid_types:
            return Response(
                {
                    "detail": f"tipo_os inválido: {tipo_os}. Tipos válidos: {valid_types}",
                    "valid_types": valid_types
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate all instruments belong to origin OS (BR-SEL-1, BR-VAL-1)
        # First check without select_for_update (outside transaction)
        found_instrumentos_os = InstrumentoOS.objects.filter(
            ordem_servico=os,
            instrumento_id__in=instrumento_ids
        )
        
        found_ids = set(found_instrumentos_os.values_list('instrumento_id', flat=True))
        missing_ids = set(instrumento_ids) - found_ids
        
        if missing_ids:
            return Response(
                {
                    "detail": f"Instrumentos não encontrados nesta OS: {list(missing_ids)}",
                    "invalid_instrumento_ids": list(missing_ids)
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Now get with select_for_update inside transaction
            instrumentos_os = InstrumentoOS.objects.select_for_update().filter(
                ordem_servico=os,
                instrumento_id__in=instrumento_ids
            )
            
            # Create new OS (BR-TYPE-NEW-1)
            proposta = os.proposta
            
            # Generate OS number using same pattern as auto-generation
            # Count OSs of the same type in this proposal
            os_count = proposta.ordens_servico.filter(tipo_os=tipo_os).count() + 1
            numero = f"{proposta.numero}-OS-{tipo_os}-{os_count:03d}"
            
            # Check if number already exists (shouldn't happen, but be safe)
            if OrdemServico.objects.filter(numero=numero).exists():
                # Try next number
                os_count += 1
                numero = f"{proposta.numero}-OS-{tipo_os}-{os_count:03d}"
            
            nova_os = OrdemServico.objects.create(
                proposta=proposta,
                tipo_os=tipo_os,  # User-selected type
                status=StatusOS.A_REALIZAR,
                numero=numero
            )
            
            # Move all instruments to new OS
            moved_ids = []
            for idx, inst_os in enumerate(instrumentos_os, start=1):
                inst_os.ordem_servico = nova_os
                inst_os.item = idx
                inst_os.save(update_fields=['ordem_servico', 'item'])
                moved_ids.append(inst_os.instrumento_id)
            
            # Resequence origin OS items
            for idx, origin_inst_os in enumerate(
                InstrumentoOS.objects.filter(ordem_servico=os).order_by('item'),
                start=1
            ):
                if origin_inst_os.item != idx:
                    origin_inst_os.item = idx
                    origin_inst_os.save(update_fields=['item'])
            
            return Response({
                "message": "Instrumentos realocados com sucesso.",
                "origin_os_id": os.id,
                "destination_os_id": nova_os.id,
                "destination_os_numero": nova_os.numero,
                "destination_os_tipo": nova_os.tipo_os,
                "moved_instrumento_ids": moved_ids,
                "origin_items_resequenced": True
            })
    
    @action(detail=True, methods=['GET'], permission_classes=[IsAuthenticated])
    def preview_certificado(self, request, pk=None):
        """
        Get preview of the next certificate number for an instrument without persisting it.
        
        Query params:
        - instrumento_id: ID of the instrument
        
        Returns the certificate number that would be assigned if confirmed.
        This is a read-only operation that does not modify the database.
        """
        os = self.get_object()
        instrumento_id = request.query_params.get('instrumento_id')
        
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
        
        # Generate certificate number using same logic as automatic generation
        numero_certificado = f"{os.numero}-{instrumento_os.item:03d}"
        
        # Check if this number is already taken
        from instrumentos.models import InstrumentoDoCliente
        is_available = not InstrumentoDoCliente.objects.filter(
            numero_certificado=numero_certificado
        ).exclude(id=instrumento_os.instrumento_id).exists()
        
        return Response({
            "numero_certificado": numero_certificado,
            "instrumento_id": int(instrumento_id),
            "disponivel": is_available,
            "ja_atribuido": instrumento_os.instrumento.numero_certificado == numero_certificado
        })
    
    @action(detail=True, methods=['POST'], permission_classes=[IsAuthenticated])
    def gerar_certificado(self, request, pk=None):
        """
        Generate and persist certificate number for an instrument in this OS.
        
        Request body:
        {
            "instrumento_id": 123
        }
        
        Business Rules:
        - For CALIBRACAO OS: certificate is auto-generated on OS creation (this endpoint is for manual override if needed)
        - For other OS types: certificate must be generated manually via this endpoint
        - Uses same sequential numbering logic as automatic generation: {os.numero}-{item:03d}
        - Ensures sequence consistency and uniqueness
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
        
        # Check uniqueness with transaction to prevent race conditions
        from instrumentos.models import InstrumentoDoCliente
        with transaction.atomic():
            try:
                # Use select_for_update inside transaction to lock the row
                instrumento_os = InstrumentoOS.objects.select_for_update().get(
                    ordem_servico=os,
                    instrumento_id=instrumento_id
                )
            except InstrumentoOS.DoesNotExist:
                return Response(
                    {"detail": "Instrumento não encontrado nesta ordem de serviço."},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Generate certificate number using same logic as automatic generation
            # Format: {os.numero}-{item:03d} - ensures sequence consistency
            numero_certificado = f"{os.numero}-{instrumento_os.item:03d}"
            
            # Use select_for_update to lock the row and prevent concurrent modifications
            existing = InstrumentoDoCliente.objects.select_for_update().filter(
                numero_certificado=numero_certificado
            ).exclude(id=instrumento_os.instrumento_id).first()
            
            if existing:
                return Response(
                    {
                        "detail": f"Número de certificado {numero_certificado} já está em uso pelo instrumento {existing.tag or existing.id}.",
                        "numero_certificado": numero_certificado,
                        "instrumento_conflito": existing.id
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if instrument already has this certificate number
            if instrumento_os.instrumento.numero_certificado == numero_certificado:
                return Response({
                    "numero_certificado": numero_certificado,
                    "instrumento_id": instrumento_id,
                    "message": "Número de certificado já atribuído a este instrumento."
                })
            
            # Persist the certificate number
            instrumento_os.instrumento.numero_certificado = numero_certificado
            instrumento_os.instrumento.save(update_fields=['numero_certificado'])
        
        return Response({
            "numero_certificado": numero_certificado,
            "instrumento_id": instrumento_id,
            "message": "Número de certificado gerado e atribuído com sucesso."
        })
    
    @action(detail=True, methods=['PATCH'], permission_classes=[IsAuthenticated])
    def atualizar_certificado(self, request, pk=None):
        """
        Update certificate number for an instrument in this OS.
        
        Request body:
        {
            "instrumento_id": 123,
            "numero_certificado": "2024-001-OS-CAL-001-001"
        }
        
        This endpoint allows updating the certificate number to a custom value.
        Useful for editing certificate numbers after they've been generated.
        """
        if not request.user.is_staff:
            return Response(
                {"detail": "Acesso negado."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        os = self.get_object()
        instrumento_id = request.data.get('instrumento_id')
        numero_certificado = request.data.get('numero_certificado')
        
        if not instrumento_id:
            return Response(
                {"detail": "instrumento_id é obrigatório."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not numero_certificado:
            return Response(
                {"detail": "numero_certificado é obrigatório."},
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
        
        # Validate and update certificate number
        from instrumentos.models import InstrumentoDoCliente
        numero_certificado = numero_certificado.strip()
        
        with transaction.atomic():
            # Check if number is already in use by another instrument
            existing = InstrumentoDoCliente.objects.select_for_update().filter(
                numero_certificado=numero_certificado
            ).exclude(id=instrumento_os.instrumento_id).first()
            
            if existing:
                return Response(
                    {
                        "detail": f"Número de certificado {numero_certificado} já está em uso pelo instrumento {existing.tag or existing.id}.",
                        "numero_certificado": numero_certificado,
                        "instrumento_conflito": existing.id
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update the certificate number
            instrumento_os.instrumento.numero_certificado = numero_certificado
            instrumento_os.instrumento.save(update_fields=['numero_certificado'])
        
        return Response({
            "numero_certificado": numero_certificado,
            "instrumento_id": instrumento_id,
            "message": "Número de certificado atualizado com sucesso."
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

        if not os.proposta:
            return Response({
                "message": "Ordem de serviço finalizada com sucesso.",
                "todas_os_finalizadas": False,
                "pode_liberar_faturamento": False
            })
        
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
