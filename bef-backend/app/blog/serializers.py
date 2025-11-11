from rest_framework import serializers
from .models import Post, Categoria, ImagemExtra


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ["id", "nome", "posts"]


class ImagemExtraSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImagemExtra
        fields = ["id", "imagem"]


class PostSerializer(serializers.ModelSerializer):
    categoria = CategoriaSerializer(read_only=True)
    categoria_id = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.all(), source="categoria", write_only=True
    )
    imagens_adicionais = ImagemExtraSerializer(many=True, read_only=True)
    midia = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id",
            "titulo",
            "imagem_destaque",
            "imagem_destaque_url",
            "categoria",
            "categoria_id",
            "publicado_em",
            "visivel",
            "imagens_adicionais",
            "resumo",
            "destaque",
            "midia",
            "texto",
        ]
        read_only_fields = ["id", "publicado_em"]

    def get_midia(self, obj):
        result = []
      
        for video in obj.videos_url.all():
            result.append({"tipo": "url", "src": video.url})
        return result
