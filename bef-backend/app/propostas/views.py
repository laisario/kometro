from datetime import date
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend

from rest_framework import mixins, response, status, viewsets, filters, permissions
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from .task import enviar_proposta_cliente_email, gerar_pdf_proposta
from .models import Proposta, Revisao, Anexo, PropostaInstrumento
from .services import recompute_total
from .serializers import (
    PropostaAdminSerializer,
    PropostaFaturamentoSerializer,
    ReadPropostaAdminSerializer,
    ReadPropostaSerializer,
    WritePropostaSerializer,
    AnexoSerializer,
)
from .filters import PropostaFilter
from instrumentos.models import InstrumentoDoCliente
from django.core.files.base import ContentFile
from .admin import PropostaExportResource
from clientes.mixins import ClienteScopedQuerysetMixin
from clientes.permissions import NivelPermission
from django.db import transaction

class PropostaViewSet(ClienteScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Proposta.objects.all().order_by("-pk")
    permission_classes = [permissions.IsAuthenticated, NivelPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ["numero", "cliente__empresa__razao_social"]
    filterset_class = PropostaFilter
    cliente_field = "cliente"

    def get_serializer_class(self, *args, **kwargs):
        if self.request.user.is_staff:
            if self.action == "list" or self.action == "retrieve":
                return ReadPropostaAdminSerializer
            return PropostaAdminSerializer
        if self.action == "list" or self.action == "retrieve":
            return ReadPropostaSerializer
        return WritePropostaSerializer

    @action(detail=True, methods=["patch"], permission_classes=[IsAdminUser])
    def elaborar(self, request, pk=None):
        proposta = self.get_object()
        dados = request.data
        serializer = PropostaAdminSerializer(
            instance=proposta, data=dados, partial=True, context={"request": request}
        )

        if not serializer.is_valid():
            return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                serializer.save()

                proposta.status = "AA"
                proposta.save()

                proposta.cliente.propostas_aguardando_aprovacao += 1
                proposta.cliente.save()

                # Criar revisão sem PDF inicialmente
                rev = Revisao.objects.create(proposta=proposta)

                # Gerar PDF de forma síncrona (espera a conclusão)
                total_com_desconto = serializer.data.get("total_com_desconto", 0)

                # Decidir aplicação do selo com base no tipo de serviço efetivo da proposta
                aplicar_selo = proposta.should_apply_seal()

                # Chamar a task diretamente para execução síncrona
                gerar_pdf_proposta(proposta.id, rev.id, total_com_desconto, aplicar_selo)

            return response.Response(
                {"message": "Proposta elaborada com sucesso!"},
                status=status.HTTP_200_OK,
            )

        except ValidationError as e:
            return response.Response({"message": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], permission_classes=[IsAdminUser])
    def enviar_email(self, request, pk=None):
        proposta = self.get_object()
        emails = request.data.get("emails", [])
        try:
            enviar_proposta_cliente_email.apply_async(args=[proposta.id, emails])
            return response.Response(
                {"message": "Email enviado com sucesso!"}, status=status.HTTP_200_OK
            )
        except ValidationError as e:
            return response.Response(
                {"message": str(e)}, status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=["patch"], permission_classes=[IsAdminUser])
    def anexar(self, request, pk=None):
        proposta = self.get_object()
        anexo = request.data.get("anexo", None)
        if anexo:
            anexo_instance = Anexo.objects.filter(anexo=anexo, proposta=proposta)
            if not anexo_instance.exists():
                anexo = Anexo.objects.create(anexo=anexo, proposta=proposta)
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

    @action(detail=True, methods=["patch"], permission_classes=[IsAdminUser])
    def desanexar(self, request, pk=None):
        anexo = request.data.get("anexo", None)
        if anexo:
            anexo_instance = Anexo.objects.filter(id=anexo)
            if not anexo_instance.exists():
                return response.Response(
                    {"message": "Anexo não existe"}, status=status.HTTP_400_BAD_REQUEST
                )
            anexo_instance.delete()
            return response.Response(
                {"message": "Anexo removido!"}, status=status.HTTP_200_OK
            )
        else:
            return response.Response(
                {"message": "Faltou o arquivo para desanexar"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=["POST"], permission_classes=[IsAuthenticated])
    def aprovar(self, request, pk=None):
        from ordem_servico.tasks import criar_ordens_servico_proposta
        
        proposta = self.get_object()
        proposta.status = "A"
        proposta.data_aprovacao = date.today()
        proposta.save()
        if proposta.cliente.propostas_aguardando_aprovacao != 0:
            proposta.cliente.propostas_aguardando_aprovacao -= 1
        proposta.cliente.save()
        
        # Trigger OS generation task
        criar_ordens_servico_proposta.delay(proposta.id)
        
        return response.Response(
            {"message": "Proposta aprovada com sucesso! Ordens de serviço sendo geradas..."}, 
            status=status.HTTP_200_OK
        )
    

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def reprovar(self, request, pk=None):
        proposta = self.get_object()
        proposta.status = "R"
        proposta.data_aprovacao = date.today()
        proposta.save()
        if proposta.cliente.propostas_aguardando_aprovacao != 0:
            proposta.cliente.propostas_aguardando_aprovacao -= 1
        proposta.cliente.save()
        return response.Response(
            {"message": "Proposta recusada com sucesso!"}, status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def remover_instrumento(self, request, pk=None):
        proposta = self.get_object()
        instrumento_id = request.data.get("instrumento_id")
        instrumento = InstrumentoDoCliente.objects.get(id=instrumento_id)
        proposta.instrumentos.remove(instrumento)
        PropostaInstrumento.objects.filter(proposta=proposta, instrumento=instrumento).delete()
        recompute_total(proposta)
        proposta.status = "AA"
        proposta.save()
        return response.Response(
            {"message": "Instrumento removido com sucesso!"}, status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def adicionar_instrumento(self, request, pk=None):
        proposta = self.get_object()
        instrumentos_data = request.data.get("instrumentos", [])
        
        if not instrumentos_data:
            return response.Response(
                {"detail": "Lista de instrumentos não pode estar vazia."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        with transaction.atomic():
            instruments_to_add = []
            proposta_instrumentos_to_create = []
            
            # First pass: validate all instruments
            for item in instrumentos_data:
                # Support both formats: dict with id/service_kind/local or just id
                if isinstance(item, dict):
                    instrumento_id = item.get('id') or item.get('pk')
                    service_kind = item.get('service_kind', 'calibracao')
                    local = item.get('local', proposta.local or 'P')
                    tipo_de_servico = item.get('tipo_de_servico')
                else:
                    # Backward compatibility: just an ID
                    instrumento_id = item
                    service_kind = 'calibracao'
                    local = proposta.local or 'P'
                    tipo_de_servico = None
                
                if instrumento_id is None:
                    continue
                
                try:
                    instrumento = InstrumentoDoCliente.objects.get(id=instrumento_id)
                    
                    # Validate instrument belongs to proposal's client
                    if instrumento.cliente != proposta.cliente:
                        return response.Response(
                            {"detail": f"Instrumento {instrumento_id} não pertence ao cliente da proposta."},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    
                    # Validate service_kind
                    if service_kind not in ['calibracao', 'manutencao']:
                        return response.Response(
                            {"detail": f"service_kind deve ser 'calibracao' ou 'manutencao', recebeu: {service_kind}"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    
                    # Validate local
                    if local not in ['P', 'C', 'T']:
                        return response.Response(
                            {"detail": f"local deve ser 'P', 'C' ou 'T', recebeu: {local}"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    
                    preco = item.get('preco') if isinstance(item, dict) else None
                    if preco is None:
                        preco = Decimal("0")
                    instruments_to_add.append(instrumento)
                    proposta_instrumentos_to_create.append({
                        'instrumento': instrumento,
                        'service_kind': service_kind,
                        'local': local,
                        'preco': preco,
                        'tipo_de_servico': tipo_de_servico,
                    })
                    
                except InstrumentoDoCliente.DoesNotExist:
                    return response.Response(
                        {"detail": f"Instrumento com ID {instrumento_id} não existe."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            
            # Add all instruments to many-to-many relationship at once
            if instruments_to_add:
                proposta.instrumentos.add(*instruments_to_add)
            
            # Create or update PropostaInstrumento records
            for item_data in proposta_instrumentos_to_create:
                PropostaInstrumento.objects.update_or_create(
                    proposta=proposta,
                    instrumento=item_data['instrumento'],
                    defaults={
                        'service_kind': item_data['service_kind'],
                        'local': item_data['local'],
                        'preco': item_data['preco'],
                    }
                )
                if item_data.get('tipo_de_servico') is not None:
                    item_data['instrumento'].tipo_de_servico = item_data['tipo_de_servico']
                    item_data['instrumento'].save(update_fields=['tipo_de_servico'])
            
            recompute_total(proposta)
            proposta.status = "AA"
            proposta.save()
        
        return response.Response(
            {"message": "Instrumentos adicionados com sucesso!"},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"])
    def exportar(self, request, pk=None):
        dados_selecionados = request.data
        propostas_selecionadas = dados_selecionados.get("propostas_selecionadas", [])
        propostas_exportadas = Proposta.objects.filter(id__in=propostas_selecionadas)
        resource = PropostaExportResource()
        dataset = resource.export(queryset=propostas_exportadas)
        csv_content = dataset.csv
        csv_response = response.Response(csv_content, content_type="text/csv")
        csv_response[
            "Content-Disposition"
        ] = 'attachment; filename="propostas_exportadas.csv"'
        return csv_response

    @action(detail=True, methods=["patch"])
    def liberar_para_faturamento(self, request, pk=None):
        proposta = self.get_object()
        serializer = PropostaFaturamentoSerializer(
            proposta, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return response.Response({"status": "faturamento atualizado com sucesso"})
        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PropostaFileViewSet(viewsets.GenericViewSet, mixins.RetrieveModelMixin):
    queryset = Proposta.objects.all()

    def retrieve(self, request, *args, **kwargs):
        proposta = self.get_object()

        ultima_revisao = proposta.revisoes.last()

        if ultima_revisao:
            file = ultima_revisao.pdf.open()
            response = HttpResponse(file.read(), content_type="application/pdf")
            response[
                "Content-Disposition"
            ] = f'attachment; filename="proposta{proposta.id}.pdf"'
            file.close()
            return response
        else:
            return HttpResponse(
                {"error": "file not existent"}, status=status.HTTP_404_NOT_FOUND
            )
