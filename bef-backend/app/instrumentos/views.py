from rest_framework import filters, permissions, viewsets, status
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from rest_framework.decorators import action
from .models import (
    Setor, 
    Instrumento, 
    InstrumentoDoCliente, 
    InstrumentoBaseCliente,
    Calibracao, 
    Anexo, 
    Certificado, 
    Normativo, 
    MovimentacaoInstrumento,
    PontoDeCalibracao,
    CriterioAceitacao,
)
from .serializers import (
    InstrumentoDoClienteWriteSerializer,
    InstrumentoReadSerializer,
    InstrumentoWriteSerializer,
    InstrumentoBaseClienteSerializer,
    CalibracaoReadSerializer,
    CalibracaoWriteSerializer,
    InstrumentoDoClienteReadSerializer,
    AnexoSerializer,
    CertificadoSerializer,
    SetorSerializer,
    InstrumentoDoClienteReadAdminSerializer,
    InstrumentoDoClienteWriteAdminSerializer,
    NormativoSerializer,
    ChecagemReadSerializer,
    ChecagemWriteSerializer,
    InstrumentoDoClienteListReadSerializer,
)
from .admin import InstrumentoExportResource, RelatorioMovimentacoesResource
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import response
from .filters import CalibracaoFilter, InstrumentoDoClienteFilter
from rest_framework.pagination import PageNumberPagination
from openpyxl import Workbook
from django.http import HttpResponse
import re
from django.db.models import Q
from django.db import transaction, IntegrityError
from clientes.permissions import NivelPermission
from rkp_platform.pagination import CustomPagination
from django.db.models import Count
from rest_framework.decorators import action
from rest_framework import response, status
from django.core.cache import cache
from django.db.models import Prefetch
from rest_framework import pagination
from clientes.models import Cliente

class InstrumentoDoClienteViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    filterset_class = InstrumentoDoClienteFilter
    search_fields = [
        "tag",
        "instrumento__tipo_de_instrumento__descricao",
        "instrumento__tipo_de_instrumento__modelo",
        "instrumento__tipo_de_instrumento__fabricante",
        "normativos__nome",
    ]
    cliente_field = "cliente"
    permission_classes = [NivelPermission]
    pagination_class = CustomPagination

    def get_serializer_class(self, *args, **kwargs):
        user = self.request.user

        if self.action == 'list':
            return (
                InstrumentoDoClienteReadAdminSerializer
                if user.is_staff
                else InstrumentoDoClienteListReadSerializer
            )

        if self.action == 'retrieve':
            return (
                InstrumentoDoClienteReadAdminSerializer
                if user.is_staff
                else InstrumentoDoClienteReadSerializer
            )

        return (
            InstrumentoDoClienteWriteAdminSerializer
            if user.is_staff
            else InstrumentoDoClienteWriteSerializer
        )

    def get_queryset(self):
        # Optimize with select_related and prefetch_related for search fields
        queryset = InstrumentoDoCliente.objects.select_related(
            'instrumento__tipo_de_instrumento',
            'cliente'
        ).prefetch_related('normativos')
        
        if self.request.method == 'DELETE':
            return queryset

        if self.request.user.is_staff:
            client = self.request.query_params.get("client")
            if client:
                return queryset.filter(cliente_id=client)
            return queryset

        queryset = queryset.filter(cliente__usuarios=self.request.user)
        
        # Ensure consistent ordering for search results
        return queryset.order_by('tag', 'id')
    

    def update(self, request, *args, **kwargs):
        partial = False
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return response.Response(status=status.HTTP_204_NO_CONTENT)

    def partial_update(self, request, *args, **kwargs):
        partial = True
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return response.Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["post"])
    def exportar(self, request, pk=None):
        dados_selecionados = request.data
        instrumentos_selecionados = dados_selecionados.get(
            "instrumentos_selecionados", []
        )
        campos_selecionados = dados_selecionados.get("campos_selecionados", [])
        ids = [item["id"] for item in instrumentos_selecionados]
        instrumentos_exportados = (
            InstrumentoDoCliente.objects.filter(id__in=ids)
        )
        resource = InstrumentoExportResource(campos_selecionados=campos_selecionados)
        dataset = resource.export(queryset=instrumentos_exportados)
        csv_content = dataset.csv
        csv_response = response.Response(csv_content, content_type="text/csv")
        csv_response[
            "Content-Disposition"
        ] = 'attachment; filename="instrumentos_exportados.csv"'
        return csv_response
    
    @action(detail=True, methods=["get"])
    def exportar_movimentacoes(self, request, pk=None):
        resource = RelatorioMovimentacoesResource()
        dataset = resource.export(instrumento_id=pk)

        resp = HttpResponse(
            dataset.export("csv"),
            content_type="text/csv"
        )
        resp["Content-Disposition"] = f'attachment; filename="relatorio_movimentacoes_{pk}.csv"'
        return resp
       
    @action(detail=True, methods=["patch"])
    def mudar_posicao(self, request, pk=None):
        instrumento = self.get_object()
        nova_posicao = request.data.get("nova_posicao")
        antiga_posicao = instrumento.posicao

        if nova_posicao not in dict(InstrumentoDoCliente.Posicao.choices):
            return response.Response({"erro": "Posição inválida"}, status=status.HTTP_400_BAD_REQUEST)

        if antiga_posicao != nova_posicao:
            MovimentacaoInstrumento.objects.create(
                instrumento=instrumento,
                nova_posicao=nova_posicao,
                usuario_alteracao=request.user,
                antiga_posicao=antiga_posicao,
            )

        instrumento.posicao = nova_posicao
        instrumento.save()

        return response.Response({
            "mensagem": "Posição atualizada com sucesso",
            "nova_posicao": nova_posicao,
            "instrumento_id": instrumento.id,
        })
    
    def _next_version_tag(self, tag: str) -> str:
        base = re.sub(r"-v\d+$", "", tag, flags=re.IGNORECASE)

        existing = set(
            InstrumentoDoCliente.objects.filter(
                Q(tag=base) | Q(tag__istartswith=f"{base}-v")
            ).values_list("tag", flat=True)
        )

        max_v = 1 if base in existing else 0
        pat = re.compile(rf"^{re.escape(base)}-v(\d+)$", re.IGNORECASE)
        for t in existing:
            m = pat.match(t)
            if m:
                max_v = max(max_v, int(m.group(1)))

        return f"{base}-v{max_v + 1}"

    @action(detail=True, methods=["post"])
    def duplicar(self, request, pk=None):
        original = self.get_object()

        new_tag = self._next_version_tag(original.tag or "")

        normativos_qs = original.normativos.all()
        pontos_qs = list(PontoDeCalibracao.objects.filter(instrumento=original))
        criterios_qs = list(CriterioAceitacao.objects.filter(instrumento=original))

        try:
            with transaction.atomic():
                new_inst = InstrumentoDoCliente()
                for field in original._meta.fields:
                    if field.primary_key or getattr(field, "auto_created", False):
                        continue
                    if field.unique and field.name != "tag":
                        continue
                    setattr(new_inst, field.name, getattr(original, field.name))

                new_inst.tag = new_tag
                new_inst.save()

                new_inst.normativos.set(normativos_qs)

                for ponto in pontos_qs:
                    ponto.pk = None
                    ponto.instrumento = new_inst
                    ponto.save()

                for criterio in criterios_qs:
                    criterio.pk = None
                    criterio.instrumento = new_inst
                    criterio.save()
                
                cache.delete(f"hierarquia:{original.cliente_id}")

            ser = self.get_serializer(new_inst)
            return response.Response(ser.data, status=status.HTTP_201_CREATED)

        except IntegrityError as e:
            return response.Response(
                {"error": "IntegrityError ao duplicar: " + str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return response.Response(
                {"error": "Erro ao duplicar: " + str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class InstrumentoViewSet(viewsets.ModelViewSet):
    filter_backends = [filters.SearchFilter]
    search_fields = [
        "maximo",
        "minimo",
        "unidade",
        "tipo_de_instrumento__descricao",
        "tipo_de_instrumento__modelo",
        "tipo_de_instrumento__fabricante",
    ]
    cliente_field = "cliente"
    permission_classes = [NivelPermission]
    pagination_class = CustomPagination

    def get_queryset(self):
        # Optimize with select_related for tipo_de_instrumento (used in search_fields)
        queryset = Instrumento.objects.select_related('tipo_de_instrumento')
        cliente_id = self.request.query_params.get('cliente_id')

        # Optimize cliente filtering with join instead of subquery
        if not self.request.user.is_staff:
            try:
                cliente = self.request.user.clientes.first()
                if cliente:
                    # Use join instead of values_list + filter(id__in=...)
                    queryset = queryset.filter(
                        clientes_acesso__cliente=cliente,
                        clientes_acesso__ativo=True
                    ).distinct()
                else:
                    queryset = queryset.none()
            except Exception as e:
                print(e, 'error')
                queryset = queryset.none()
        else:
            if cliente_id:
                try:
                    # Use join instead of values_list + filter(id__in=...)
                    queryset = queryset.filter(
                        clientes_acesso__cliente_id=cliente_id,
                        clientes_acesso__ativo=True
                    ).distinct()
                except Exception as e:
                    print(f"Error filtering by cliente_id: {e}")
                    queryset = queryset.none()

        # Always return ordered queryset - SearchFilter will handle the search
        return queryset.order_by('tipo_de_instrumento__descricao', 'id')

    def get_object(self):
        obj = super().get_object()
        
        if not self.request.user.is_staff:
            try:
                cliente = self.request.user.clientes.first()
                if cliente:
                    has_access = InstrumentoBaseCliente.objects.filter(
                        instrumento=obj,
                        cliente=cliente,
                        ativo=True
                    ).exists()
                    
                    if not has_access:
                        from rest_framework.exceptions import PermissionDenied
                        raise PermissionDenied("Você não tem acesso a este instrumento")
            except Exception as e:
                print(f"Error checking instrument access: {e}")
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Erro ao verificar acesso ao instrumento")
        else:
            cliente_id = self.request.query_params.get('cliente_id')
            if cliente_id:
                try:
                    from clientes.models import Cliente
                    cliente = Cliente.objects.get(id=cliente_id)
                    instrumento_base_cliente = InstrumentoBaseCliente.objects.filter(
                        instrumento=obj,
                        cliente=cliente,
                        ativo=True
                    ).first()
                    
                    if instrumento_base_cliente:
                        return instrumento_base_cliente
                    else:
                        from rest_framework.exceptions import NotFound
                        raise NotFound("Instrumento não encontrado para este cliente")
                except Cliente.DoesNotExist:
                    from rest_framework.exceptions import NotFound
                    raise NotFound("Cliente não encontrado")
                except Exception as e:
                    print(f"Error getting InstrumentoBaseCliente for staff: {e}")
                    from rest_framework.exceptions import NotFound
                    raise NotFound("Erro ao buscar instrumento do cliente")
        
        return obj

    def get_serializer_class(self, *args, **kwargs):
        if self.action in ['list', 'retrieve']:
            if hasattr(self, 'get_object'):
                try:
                    obj = self.get_object()
                    if isinstance(obj, InstrumentoBaseCliente):
                        return InstrumentoBaseClienteSerializer
                except:
                    pass
            return InstrumentoReadSerializer
        return InstrumentoWriteSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        try:
            if request.user.is_staff:
                cliente_id = request.data.get('cliente')
                cliente = Cliente.objects.get(id=cliente_id) if cliente_id else None
            else:
                cliente = request.user.clientes.first()
            if cliente:
                InstrumentoBaseCliente.objects.get_or_create(
                    instrumento=serializer.instance,
                    cliente=cliente,
                    defaults={'ativo': True}
                )
        except Exception as e:
            print(f"Error creating InstrumentoBaseCliente relationship: {e}")

        read_serializer = InstrumentoReadSerializer(serializer.instance, context={'request': request})
        return response.Response(read_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if not request.user.is_staff:
            try:
                cliente = request.user.clientes.first()
                if cliente:
                    InstrumentoBaseCliente.objects.get_or_create(
                        instrumento=serializer.instance,
                        cliente=cliente,
                        defaults={'ativo': True}
                    )
            except Exception as e:
                print(f"Error updating InstrumentoBaseCliente relationship: {e}")

        read_serializer = InstrumentoReadSerializer(serializer.instance, context={'request': request})
        return response.Response(read_serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        if not request.user.is_staff:
            try:
                cliente = request.user.clientes.first()
                if cliente:
                    deleted_count, _ = InstrumentoBaseCliente.objects.filter(
                        instrumento=instance,
                        cliente=cliente
                    ).delete()
                    
                    if deleted_count > 0:
                        return response.Response(status=status.HTTP_204_NO_CONTENT)
                    else:
                        return response.Response(status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                print(f"Error removing InstrumentoBaseCliente relationship: {e}")
                return response.Response(
                    {'detail': 'Erro ao remover instrumento'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        self.perform_destroy(instance)
        return response.Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def assign_to_client(self, request, pk=None):
        """
        Assign this instrument to a client (staff only)
        """
        if not request.user.is_staff:
            return response.Response(
                {'detail': 'Only staff can assign instruments to clients'},
                status=status.HTTP_403_FORBIDDEN
            )
        instrument = self.get_object()
        cliente_id = request.data.get('cliente_id')
        
        if not cliente_id:
            return response.Response(
                {'detail': 'cliente_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from clientes.models import Cliente
            cliente = Cliente.objects.get(id=cliente_id)
            
            instrumento_base_cliente, created = InstrumentoBaseCliente.objects.get_or_create(
                instrumento=instrument,
                cliente=cliente,
                defaults={'ativo': True}
            )
            
            if created:
                return response.Response(
                    {'detail': f'Instrument assigned to {cliente.empresa.razao_social}'},
                    status=status.HTTP_201_CREATED
                )
            else:
                return response.Response(
                    {'detail': f'Instrument already assigned to {cliente.empresa.razao_social}'},
                    status=status.HTTP_200_OK
                )
                
        except Cliente.DoesNotExist:
            return response.Response(
                {'detail': 'Client not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return response.Response(
                {'detail': f'Error assigning instrument: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['delete'], permission_classes=[permissions.IsAuthenticated])
    def unassign_from_client(self, request, pk=None):
        """
        Remove this instrument from a client (staff only)
        """
        if not request.user.is_staff:
            return response.Response(
                {'detail': 'Only staff can unassign instruments from clients'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        instrument = self.get_object()
        cliente_id = request.data.get('cliente_id')
        
        if not cliente_id:
            return response.Response(
                {'detail': 'cliente_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            deleted_count, _ = InstrumentoBaseCliente.objects.filter(
                instrumento=instrument,
                cliente_id=cliente_id
            ).delete()
            
            if deleted_count > 0:
                return response.Response(
                    {'detail': 'Instrument unassigned from client'},
                    status=status.HTTP_200_OK
                )
            else:
                return response.Response(
                    {'detail': 'No assignment found'},
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Exception as e:
                return response.Response(
                {'detail': f'Error unassigning instrument: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def assigned_clients(self, request, pk=None):
        """
        Get all clients assigned to this instrument (staff only)
        """
        if not request.user.is_staff:
            return response.Response(
                {'detail': 'Only staff can view assigned clients'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        instrument = self.get_object()
        assigned_clients = InstrumentoBaseCliente.objects.filter(
            instrumento=instrument
        ).select_related('cliente__empresa')
        
        clients_data = []
        for assignment in assigned_clients:
            clients_data.append({
                'id': assignment.cliente.id,
                'empresa': assignment.cliente.empresa.razao_social,
                'ativo': assignment.ativo,
                'data_criacao': assignment.data_criacao
            })
        
        return response.Response({
            'instrumento_id': instrument.id,
            'assigned_clients': clients_data
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def remove_from_client(self, request, pk=None):
        instrument = self.get_object()
        
        try:
            if request.user.is_staff:
                cliente_id = request.data.get('cliente')
                print(f"Staff user - cliente_id from request: {cliente_id}")
                cliente = Cliente.objects.get(id=cliente_id) if cliente_id else None
                print(f"Cliente found: {cliente}")
            else:
                cliente = request.user.clientes.first()
            
            if not cliente:
                return response.Response(
                    {'detail': 'Cliente não encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            deleted_count, _ = InstrumentoBaseCliente.objects.filter(
                instrumento=instrument,
                cliente=cliente
            ).delete()
            
            if deleted_count > 0:
                return response.Response(status=status.HTTP_204_NO_CONTENT)
            else:
                return response.Response(status=status.HTTP_404_NOT_FOUND)
                
        except Exception as e:
            print(f"Error removing instrument from client: {e}")
            return response.Response(
                {'detail': 'Erro ao remover instrumento'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CalibracaoViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend]
    filterset_class = CalibracaoFilter
    cliente_field = "cliente"
    permission_classes = [NivelPermission]

    def get_serializer_class(self, *args, **kwargs):
        checagem = self.request.query_params.get("checagem")
        is_read = self.action in ["list", "retrieve"]
        if checagem == "true":
            return ChecagemReadSerializer if is_read else ChecagemWriteSerializer

        return CalibracaoReadSerializer if is_read else CalibracaoWriteSerializer

    def get_queryset(self):
        qs = Calibracao.objects.all()

        if self.request.method == "GET" and not self.kwargs.get("pk"):
            instrumento = self.request.query_params.get("instrumento")
            checagem = self.request.query_params.get("checagem")
            if instrumento:
                qs = qs.filter(instrumento_id=instrumento, checagem=True if checagem == "true" else False)
            else:
                qs = Calibracao.objects.none()
        return qs
    
    def create(self, request, *args, **kwargs):
        data = request.data.copy()

        checagem = data.get("checagem")
        if isinstance(checagem, str):
            data["checagem"] = checagem.lower() == "true"

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return response.Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=["post"])
    def adicionar_certificado(self, request, pk=None):
        calibracao = self.get_object()
        numero_certificado = request.data.get("numero", None)
        arquivo = request.data.get("arquivo", None)

        certificado_instance = Certificado.objects.filter(
            numero=numero_certificado, calibracao=calibracao
        )
        if not certificado_instance.exists():
            certificado = Certificado.objects.create(
                numero=numero_certificado,
                calibracao_id=calibracao.id,
                arquivo=arquivo,
            )
            return response.Response(
                CertificadoSerializer(certificado).data,
                status=status.HTTP_201_CREATED,
            )
        return response.Response(
            {"message": "Certificado já existe."}, status=status.HTTP_200_OK
        )
       

    @action(detail=False, methods=["patch"])
    def anexar(self, request, pk=None):
        certificado_id = request.data.get("certificado", None)
        anexo = request.data.get("anexo", None)
        if anexo:
            anexo_instance = Anexo.objects.filter(
                anexo=anexo, certificado_id=certificado_id
            )
            if not anexo_instance.exists():
                anexo = Anexo.objects.create(anexo=anexo, certificado_id=certificado_id)
                return response.Response(
                    AnexoSerializer(anexo).data, status=status.HTTP_201_CREATED
                )
            return response.Response(
                {"message": "Arquivo ja anexado"}, status=status.HTTP_200_OK
            )
        else:
            return response.Response(
                {"message": "Faltou o arquivo para anexar"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=["post"])
    def apagar_certificado(self, request, pk=None):
        id_certificado = request.data.get("id", None)
        if id_certificado:
            certificado_instance = Certificado.objects.filter(id=id_certificado)
            if not certificado_instance.exists():
                return response.Response(
                    {"message": "Certificado não existe"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            certificado_instance.delete()
            return response.Response(
                {"message": "Certificado removido!"}, status=status.HTTP_200_OK
            )
        else:
            return response.Response(
                {"message": "Faltou o id."}, status=status.HTTP_400_BAD_REQUEST
            )
        
    def perform_create(self, serializer):
        instance = serializer.save()
        is_checagem = self.request.query_params.get("checagem") in ["1", "true", "True"]
        if is_checagem:
            instance.instrumento.data_ultima_checagem = instance.data or None
        else:
            instance.instrumento.data_ultima_calibracao = instance.data or None


class SetorViewSet(viewsets.ModelViewSet):
    queryset = Setor.objects.all()
    serializer_class = SetorSerializer
    pagination_class = CustomPagination
    cliente_field = "cliente"
    permission_classes = [NivelPermission]

    def get_queryset(self):
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            return Setor.objects.all()
        cliente_id = self.request.query_params.get("cliente_id")
        return Setor.objects.filter(cliente=cliente_id)
    
    def perform_create(self, serializer):
        obj = serializer.save()
        cache.delete(f"hierarquia:{obj.cliente_id}")

    def perform_update(self, serializer):
        old = self.get_object()
        old_cliente_id = old.cliente_id
        obj = serializer.save()
        cache.delete(f"hierarquia:{obj.cliente_id}")
        if old_cliente_id != obj.cliente_id:
            cache.delete(f"hierarquia:{old_cliente_id}")

    def perform_destroy(self, instance):
        cliente_id = instance.cliente_id
        super().perform_destroy(instance)
        cache.delete(f"hierarquia:{cliente_id}")

    @action(detail=False, methods=["get"])
    def hierarquia(self, request):
        cliente_id = request.query_params.get("cliente_id")
        if not cliente_id:
            return response.Response(
                {"detail": "cliente_id é obrigatório"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cache_key = f"hierarquia:{cliente_id}"
        cached = cache.get(cache_key)
        if cached is not None:
            return response.Response(cached)

        qs = (Setor.objects
              .filter(cliente_id=cliente_id)
              .only("id", "nome", "setor_pai_id")
              .order_by("nome"))
        
        nodes = {}
        roots = []
        for s in qs:
            nodes[s.id] = {
                "id": s.id,
                "nome": s.nome,
                "subsetores": [],
            }

        for s in qs:
            node = nodes[s.id]
            if s.setor_pai_id:
                parent = nodes.get(s.setor_pai_id)
                if parent:
                    parent["subsetores"].append(node)
            else:
                roots.append(node)

        instrumentos_qs = (InstrumentoDoCliente.objects
                            .filter(cliente_id=cliente_id))
        
        setores_com_inst = (Setor.objects
                            .filter(cliente_id=cliente_id)
                            .prefetch_related(Prefetch("instrumentos", queryset=instrumentos_qs))
                            .only("id"))
        
        inst_by_setor = {}
        for s in setores_com_inst:
            inst_by_setor[s.id] = [
                {"id": i.id, "tag": getattr(i, "tag", None)}
                for i in s.instrumentos.all()
            ]

        for sid, payload in inst_by_setor.items():
            if sid in nodes:
                nodes[sid]["instrumentos"] = payload
        
        cache.set(cache_key, roots, 300)
        return response.Response(roots)


class NormativoViewSet(viewsets.ModelViewSet):
    serializer_class = NormativoSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        cliente_id = self.request.query_params.get('cliente')
        if cliente_id:
            return Normativo.objects.filter(cliente=cliente_id).order_by('nome')
        return Normativo.objects.all().order_by('nome')

    