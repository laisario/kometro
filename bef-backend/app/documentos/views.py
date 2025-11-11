from rest_framework import filters, permissions, viewsets, response, status
from rest_framework.decorators import action
from .models import Documento, Aprovacao, Revisao
from .serializers import (
    ReadDocumentoWithRevisionsSerializer,
    WriteDocumentoSerializer,
    ReadRevisaoSerializer,
    WriteRevisaoSerializer,
    DocumentoAnexoSerializer,
)
from django_filters.rest_framework import DjangoFilterBackend
from .filters import DocumentoFilter
from .admin import DocumentoExportResource
from django.core.files.storage import default_storage
from clientes.permissions import NivelPermission
from clientes.mixins import ClienteScopedQuerysetMixin


class DocumentoViewSet(ClienteScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Documento.objects.all().order_by("analise_critica", "pk")
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ["titulo"]
    filterset_class = DocumentoFilter
    cliente_field = "cliente"
    permission_classes = [NivelPermission, permissions.IsAuthenticated]

    def get_serializer_class(self, *args, **kwargs):
        if self.action in ["list", "retrieve"]:
            return ReadDocumentoWithRevisionsSerializer
        return WriteDocumentoSerializer

    def destroy(self, request, *args, **kwargs):
        documento = self.get_object()
        documento.delete()
        if documento.arquivo:
            default_storage.delete(documento.arquivo.name)
        return response.Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["POST"], permission_classes=[permissions.IsAuthenticated])
    def aprovar(self, request, pk=None):
        documento = self.get_object()
        revisao = documento.revisoes.get(id=request.data["revisao_id"])
        aprovador = request.user
        if not revisao.aprovadores.filter(pk=aprovador.id).exists():
            return response.Response(
                data={"error": "Você não está incluso nos aprovadores desta revisão"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if request.user.pk == revisao.revisor.pk:
            return response.Response(
                data={
                    "error": "Você não pode aprovar uma revisão feita por você mesmo!"
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if request.data["delete"]:
            Aprovacao.objects.get(aprovador=aprovador, revisao=revisao).delete()
            return response.Response(data={"deleted": True}, status=status.HTTP_200_OK)

        aprovacao = Aprovacao.objects.create(aprovador=aprovador, revisao=revisao)

        return response.Response(
            data={"aprovacao_id": aprovacao.id}, status=status.HTTP_200_OK
        )

    @action(
        detail=True, methods=["POST"], permission_classes=[permissions.IsAuthenticated]
    )
    def revisar(self, request, pk=None):
        documento = self.get_object()
        data = request.data.copy()

        serializer = WriteRevisaoSerializer(data=data)
        serializer.is_valid(raise_exception=True)

        revisao = Revisao.objects.create(
            documento=documento,
            revisor=request.user,
            alteracao=serializer.validated_data["alteracao"],
            tipo=serializer.validated_data["tipo"],
        )

        revisao.aprovadores.set(serializer.validated_data["aprovadores"])

        return response.Response(
            data={
                "revisao_id": revisao.id,
                "revisao": WriteRevisaoSerializer(revisao).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True, methods=["patch"], permission_classes=[permissions.IsAuthenticated]
    )
    def alterar_anexo(self, request, pk=None):
        documento = self.get_object()
        default_storage.delete(documento.arquivo.name)
        arquivo = request.data.get("arquivo")
        documento.arquivo = arquivo
        documento.save()
        return response.Response(data={}, status=status.HTTP_200_OK)

    @action(
        detail=True, methods=["patch"], permission_classes=[permissions.IsAuthenticated]
    )
    def anexar(self, request, pk=None):
        documento = self.get_object()
        dados = request.data
        serializer = DocumentoAnexoSerializer(
            instance=documento, data=dados, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return response.Response(serializer.data, status=status.HTTP_200_OK)
        else:
            documento.delete()
            return response.Response(
                data={"arquivo": "Você não fez upload de nenhum arquivo."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=False, methods=["post"])
    def exportar(self, request, pk=None):
        dados_selecionados = request.data
        documentos_selecionados = dados_selecionados.get("documentos_selecionados", [])
        documentos_exportados = Documento.objects.filter(id__in=documentos_selecionados)
        resource = DocumentoExportResource()
        dataset = resource.export(queryset=documentos_exportados)
        csv_content = dataset.csv
        csv_response = response.Response(csv_content, content_type="text/csv")
        csv_response[
            "Content-Disposition"
        ] = 'attachment; filename="documentos_exportados.csv"'
        return csv_response


class RevisaoViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self, *args, **kwargs):
        if self.action in ["list", "retrieve"]:
            return ReadRevisaoSerializer
        return WriteRevisaoSerializer

    def get_queryset(self):
        if self.request.user.is_staff:
            revisions_to_make = (
                Revisao.objects.exclude(aprovacoes__aprovador__in=[self.request.user])
                .filter(aprovadores__in=[self.request.user])
                .order_by("documento__analise_critica", "documento")
            )
            return revisions_to_make
        return Revisao.objects.none()
