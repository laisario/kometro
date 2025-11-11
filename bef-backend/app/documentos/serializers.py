from rest_framework import serializers
from documentos.models import DocumentoExterno, Documento, Aprovacao, Revisao
from procedimentos.serializer import ReadProcedimentoSerializer
from clientes.serializers import UserSerializer
from django.contrib.auth import get_user_model
from clientes.serializers import UserSerializer

User = get_user_model()


class WriteDocumentoExternoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentoExterno
        fields = "__all__"


class ReadDocumentoExternoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentoExterno
        fields = "__all__"


class WriteDocumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Documento
        exclude = ["arquivo"]


class ReadAprovacaoSerializer(serializers.ModelSerializer):
    aprovador = UserSerializer()

    class Meta:
        model = Aprovacao
        fields = (
            "aprovador",
            "data_aprovacao",
            "revisao",
        )


class ReadDocumentoSerializer(serializers.ModelSerializer):
    codigo = ReadProcedimentoSerializer()
    criador = UserSerializer()

    class Meta:
        model = Documento
        fields = (
            "id",
            "codigo",
            "identificador",
            "titulo",
            "status",
            "data_validade",
            "analise_critica",
            "criador",
            "arquivo",
            "frequencia",
            "revisoes",
        )


class ReadRevisaoSerializer(serializers.ModelSerializer):
    revisor = UserSerializer()
    aprovacoes = ReadAprovacaoSerializer(many=True)
    documento = ReadDocumentoSerializer()
    aprovadores = UserSerializer(many=True)

    class Meta:
        model = Revisao
        fields = (
            "id",
            "revisor",
            "data_revisao",
            "alteracao",
            "documento",
            "aprovacoes",
            "aprovadores",
            "tipo",
        )


class WriteRevisaoSerializer(serializers.ModelSerializer):
    aprovadores = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), many=True, required=True
    )
    alteracao = serializers.CharField(required=True)

    class Meta:
        model = Revisao
        fields = ("aprovadores", "alteracao", "tipo")

    def validate_aprovadores(self, value):
        if not value:
            raise serializers.ValidationError("É necessário pelo menos um aprovador.")
        return value


class ReadDocumentoWithRevisionsSerializer(serializers.ModelSerializer):
    codigo = ReadProcedimentoSerializer()
    revisoes = ReadRevisaoSerializer(many=True)
    criador = UserSerializer()

    class Meta:
        model = Documento
        fields = (
            "id",
            "codigo",
            "identificador",
            "titulo",
            "status",
            "data_validade",
            "analise_critica",
            "criador",
            "arquivo",
            "frequencia",
            "revisoes",
        )


class DocumentoAnexoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Documento
        fields = ["arquivo"]


class WriteAprovacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Aprovacao
        fields = "__all__"
