from datetime import date
from django.core.exceptions import ValidationError
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend

from rest_framework import mixins, response, status, viewsets, filters, permissions
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from .task import enviar_proposta_cliente_email, gerar_pdf_proposta
from .models import Proposta, Revisao, Anexo
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
                # Chamar a task diretamente para execução síncrona
                gerar_pdf_proposta(proposta.id, rev.id, total_com_desconto)

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
        proposta.status = "AA"
        proposta.save()
        return response.Response(
            {"message": "Instrumento removido com sucesso!"}, status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def adicionar_instrumento(self, request, pk=None):
        proposta = self.get_object()
        instrumentos = request.data.get("instrumentos")
        new_instruments = []
        for instrumento in instrumentos:
            instrument = InstrumentoDoCliente.objects.get(id=instrumento)
            new_instruments.append(instrument)
        proposta.instrumentos.set(new_instruments)
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
