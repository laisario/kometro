from django.core.files import File
from rest_framework import serializers
from django.contrib.auth import get_user_model
from clientes.models import Cliente
from clientes.serializers import ClienteSerializer, UserSerializer
from enderecos.models import Endereco
from enderecos.serializers import ReadEnderecoSerializer, WriteEnderecoSerializer
from instrumentos.models import InstrumentoDoCliente
from instrumentos.serializers import InstrumentoDoClienteReadSerializer
from .models import Proposta, Revisao, Anexo
from decimal import Decimal, InvalidOperation


class RevisaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Revisao
        fields = "__all__"


class AnexoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Anexo
        fields = "__all__"


class WritePropostaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proposta
        fields = ("instrumentos", "informacoes_adicionais")
        extra_kwargs = {"instrumentos": {"required": True}}

    def validate(self, data):
        user = self.context["request"].user
        cliente = Cliente.objects.get(usuarios=user)
        data["cliente"] = cliente
        return data


class ReadPropostaSerializer(serializers.ModelSerializer):
    instrumentos = InstrumentoDoClienteReadSerializer(many=True)
    endereco_de_entrega = ReadEnderecoSerializer()
    cliente = ClienteSerializer()
    responsavel = UserSerializer()
    revisoes = RevisaoSerializer(many=True)
    anexos = AnexoSerializer(many=True)
    total_com_desconto = serializers.SerializerMethodField()

    class Meta:
        model = Proposta
        fields = (
            "instrumentos",
            "cliente",
            "informacoes_adicionais",
            "total",
            "condicao_de_pagamento",
            "transporte",
            "endereco_de_entrega",
            "validade",
            "data_aprovacao",
            "data_criacao",
            "data_atualizacao",
            "status",
            "id",
            "numero",
            "responsavel",
            "dias_uteis",
            "revisoes",
            "anexos",
            "total_com_desconto",
            "local"
        )

    def get_total_com_desconto(self, proposta):
        try:
            total = proposta.total
            if total is None:
                return Decimal("0")

            desconto = proposta.desconto_percentual or Decimal("0")
            total_com_desconto = Decimal(total) * (Decimal("1") - desconto / Decimal("100"))
            return round(total_com_desconto, 2)
        except (InvalidOperation, ZeroDivisionError):
            return total


class PropostaAnexoAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proposta
        fields = ["anexo"]


class PropostaAdminSerializer(serializers.ModelSerializer):
    endereco_de_entrega_add = WriteEnderecoSerializer(required=False)
    endereco_de_entrega = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=Endereco.objects.all(),
    )
    total_com_desconto = serializers.SerializerMethodField()

    class Meta:
        model = Proposta
        fields = (
            "instrumentos",
            "informacoes_adicionais",
            "cliente",
            "endereco_de_entrega_add",
            "endereco_de_entrega",
            "transporte",
            "condicao_de_pagamento",
            "validade",
            "responsavel",
            "dias_uteis",
            "numero",
            "total",
            "desconto_percentual",
            "total_com_desconto",
            "local"
        )

        extra_kwargs = {
            "instrumentos": {"required": True},
            "cliente": {"required": True},
        }

    def update(self, instance, validated_data):
        endereco_de_entrega_add = validated_data.pop("endereco_de_entrega_add", None)

        if endereco_de_entrega_add is not None:
            validated_data["endereco_de_entrega"] = Endereco.objects.create(
                **endereco_de_entrega_add
            )

        return super().update(instance=instance, validated_data=validated_data)

    def get_total_com_desconto(self, proposta):
        try:
            total = proposta.total
            if total is None:
                return Decimal("0")
            
            desconto = proposta.desconto_percentual
            if not desconto:
                return Decimal(total)

           
            total_com_desconto = Decimal(total) * (Decimal("1") - Decimal(desconto) / Decimal("100"))
            return round(total_com_desconto, 2)
        except (InvalidOperation, ZeroDivisionError):
            return total


class ReadPropostaAdminSerializer(serializers.ModelSerializer):
    cliente = ClienteSerializer()
    instrumentos = InstrumentoDoClienteReadSerializer(many=True)
    endereco_de_entrega = ReadEnderecoSerializer()
    responsavel = UserSerializer()
    instruments_available = serializers.SerializerMethodField()
    revisoes = RevisaoSerializer(many=True)
    anexos = AnexoSerializer(many=True)
    total_com_desconto = serializers.SerializerMethodField()

    class Meta:
        model = Proposta
        fields = (
            "instrumentos",
            "cliente",
            "informacoes_adicionais",
            "total",
            "condicao_de_pagamento",
            "transporte",
            "endereco_de_entrega",
            "validade",
            "data_aprovacao",
            "data_criacao",
            "data_atualizacao",
            "status",
            "id",
            "numero",
            "responsavel",
            "dias_uteis",
            "instruments_available",
            "revisoes",
            "anexos",
            "desconto_percentual",
            "total_com_desconto",
            "realizado",
            "data_liberacao_faturamento",
            "usuario_liberou_faturamento",
            "nf_entrada",
            "nf",
            "observacao",
            "local"
        )

    def get_instruments_available(self, proposal):
        cliente = self.context["request"].query_params.get("cliente")
        instrumentos = InstrumentoDoCliente.objects.filter(cliente_id=cliente)
        if not cliente:
            return InstrumentoDoCliente.objects.none()

        instrumentos = instrumentos.exclude(
            id__in=proposal.instrumentos.values_list("id", flat=True)
        )

        return InstrumentoDoClienteReadSerializer(instrumentos, many=True).data

    def get_total_com_desconto(self, proposta):
        try:
            total = proposta.total
            if total is None:
                return Decimal("0")

            desconto = proposta.desconto_percentual or Decimal("0")
            total_com_desconto = Decimal(total) * (Decimal("1") - desconto / Decimal("100"))
            return round(total_com_desconto, 2)
        except (InvalidOperation, ZeroDivisionError):
            return total


class PropostaFaturamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proposta
        fields = [
            "realizado",
            "data_liberacao_faturamento",
            "usuario_liberou_faturamento",
            "nf_entrada",
            "nf",
            "observacao",
        ]
