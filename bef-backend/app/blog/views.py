from rest_framework import viewsets, response
from .models import Post, Categoria
from .serializers import PostSerializer, CategoriaSerializer
from .pagination import CustomPagination
from rest_framework.decorators import action

class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    pagination_class = CustomPagination
    
    def get_queryset(self):
        queryset = Post.objects.filter(visivel=True).order_by("-publicado_em")
        categoria_id = self.request.query_params.get("categoria")
        
        if categoria_id and categoria_id != "todas":
            queryset = queryset.filter(categoria_id=categoria_id)

        return queryset
    

    @action(detail=False, methods=["get"], pagination_class=None)
    def featured(self, request):
        categoria_id = request.query_params.get("categoria")
        queryset = Post.objects.filter(visivel=True, destaque=True).order_by("-publicado_em")

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
