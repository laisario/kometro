from django.utils import timezone
from rest_framework import serializers

from .models import (
    ArquivoPost,
    Categoria,
    ImagemExtra,
    Post,
    SolicitacaoAcessoArquivoPost,
)


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ["id", "nome", "posts"]


class ImagemExtraSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImagemExtra
        fields = ["id", "imagem"]


class ArquivoPostSerializer(serializers.ModelSerializer):
    extensao = serializers.CharField(read_only=True)

    class Meta:
        model = ArquivoPost
        fields = [
            "id",
            "titulo",
            "nome_original",
            "tipo",
            "extensao",
            "tamanho",
            "criado_em",
        ]

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


class SolicitacaoAcessoArquivoPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = SolicitacaoAcessoArquivoPost
        fields = ["nome", "empresa", "email", "telefone"]
        extra_kwargs = {
            "nome": {"required": True, "allow_blank": False, "trim_whitespace": True},
            "empresa": {
                "required": True,
                "allow_blank": False,
                "trim_whitespace": True,
            },
            "email": {"required": True, "allow_blank": False},
            "telefone": {
                "required": True,
                "allow_blank": False,
                "trim_whitespace": True,
            },
        }


class SolicitacaoAcessoArquivoPostAdminSerializer(serializers.ModelSerializer):
    arquivo = ArquivoPostSerializer(read_only=True)
    data_solicitacao = serializers.SerializerMethodField()
    hora_solicitacao = serializers.SerializerMethodField()

    class Meta:
        model = SolicitacaoAcessoArquivoPost
        fields = [
            "id",
            "nome",
            "empresa",
            "email",
            "telefone",
            "arquivo",
            "criado_em",
            "data_solicitacao",
            "hora_solicitacao",
        ]
        read_only_fields = fields

    @staticmethod
    def _local_criado_em(obj):
        if timezone.is_aware(obj.criado_em):
            return timezone.localtime(obj.criado_em)
        return obj.criado_em

    def get_data_solicitacao(self, obj):
        return self._local_criado_em(obj).strftime("%Y-%m-%d")

    def get_hora_solicitacao(self, obj):
        return self._local_criado_em(obj).strftime("%H:%M:%S")
