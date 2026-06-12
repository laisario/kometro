from rest_framework import serializers
from .models import Post, Categoria, ImagemExtra, ArquivoPost


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ["id", "nome", "posts"]


class ImagemExtraSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImagemExtra
        fields = ["id", "imagem"]


class ArquivoPostSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    extensao = serializers.CharField(read_only=True)

    class Meta:
        model = ArquivoPost
        fields = [
            "id",
            "titulo",
            "nome_original",
            "tipo",
            "extensao",
            "url",
            "tamanho",
            "criado_em",
        ]

    def get_url(self, obj):
        if not obj.arquivo:
            return None

        url = obj.arquivo.url
        request = self.context.get("request")
        if request and url.startswith("/"):
            return request.build_absolute_uri(url)
        return url


class PostSerializer(serializers.ModelSerializer):
    categoria = CategoriaSerializer(read_only=True)
    categoria_id = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.all(), source="categoria", write_only=True
    )
    imagens_adicionais = ImagemExtraSerializer(many=True, read_only=True)
    arquivos = ArquivoPostSerializer(many=True, read_only=True)
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
            "arquivos",
        ]
        read_only_fields = ["id", "publicado_em"]

    def get_midia(self, obj):
        result = []
      
        for video in obj.videos_url.all():
            result.append({"tipo": "url", "src": video.url})
        return result
