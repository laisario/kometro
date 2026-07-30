from django.shortcuts import get_object_or_404
from rest_framework import response, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.views import APIView

from .models import ArquivoPost, Categoria, Post, SolicitacaoAcessoArquivoPost
from .serializers import (
    CategoriaSerializer,
    PostSerializer,
    SolicitacaoAcessoArquivoPostAdminSerializer,
    SolicitacaoAcessoArquivoPostSerializer,
)
from .pagination import CustomPagination

class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    pagination_class = CustomPagination
    
    def get_queryset(self):
        queryset = (
            Post.objects.filter(visivel=True)
            .prefetch_related("imagens_adicionais", "videos_url", "arquivos")
            .order_by("-publicado_em")
        )
        categoria_id = self.request.query_params.get("categoria")
        
        if categoria_id and categoria_id != "todas":
            queryset = queryset.filter(categoria_id=categoria_id)

        return queryset
    

    @action(detail=False, methods=["get"], pagination_class=None)
    def featured(self, request):
        categoria_id = request.query_params.get("categoria")
        queryset = (
            Post.objects.filter(visivel=True, destaque=True)
            .prefetch_related("imagens_adicionais", "videos_url", "arquivos")
            .order_by("-publicado_em")
        )

        if categoria_id and categoria_id != "todas":
            queryset = queryset.filter(categoria_id=categoria_id)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return response.Response(serializer.data)


class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    pagination_class = None


class ArquivoPostAccessView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, arquivo_id):
        arquivo = get_object_or_404(
            ArquivoPost.objects.select_related("post"),
            id=arquivo_id,
            post__visivel=True,
        )
        serializer = SolicitacaoAcessoArquivoPostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(arquivo=arquivo)

        return response.Response(
            {
                "arquivo": arquivo.id,
                "download_url": arquivo.arquivo.url,
            },
            status=status.HTTP_201_CREATED,
        )


class SolicitacaoAcessoArquivoPostViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        SolicitacaoAcessoArquivoPost.objects.select_related(
            "arquivo",
            "arquivo__post",
        )
        .all()
        .order_by("-criado_em", "-id")
    )
    serializer_class = SolicitacaoAcessoArquivoPostAdminSerializer
    permission_classes = [IsAdminUser]
    pagination_class = CustomPagination
