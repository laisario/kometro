from django.core.files import File
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import models
from clientes.models import Cliente
from clientes.serializers import ClienteSerializer, UserSerializer
from enderecos.models import Endereco
from enderecos.serializers import ReadEnderecoSerializer, WriteEnderecoSerializer
from instrumentos.models import InstrumentoDoCliente, Local
from instrumentos.serializers import InstrumentoDoClienteReadSerializer
from .models import Proposta, Revisao, Anexo, PropostaInstrumento
from decimal import Decimal, InvalidOperation


class RevisaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Revisao
        fields = "__all__"


class AnexoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Anexo
        fields = "__all__"


class PropostaInstrumentoSerializer(serializers.ModelSerializer):
    instrumento_id = serializers.IntegerField(source='instrumento.id', read_only=True)
    
    class Meta:
        model = PropostaInstrumento
        fields = [
            'id',
            'instrumento_id',
            'service_kind',
            'local',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        proposta = self.context.get('proposta')
        instrumento = data.get('instrumento')
        
        if proposta and instrumento:
            if instrumento.cliente != proposta.cliente:
                raise serializers.ValidationError(
                    "Instrumento must belong to proposal client"
                )
        
        if data.get('service_kind') not in ['calibracao', 'manutencao']:
            raise serializers.ValidationError(
                "service_kind must be 'calibracao' or 'manutencao'"
            )
        
        return data


class InstrumentosField(serializers.Field):
    """
    Campo customizado que aceita instrumentos em dois formatos:
    1. Lista de PKs (inteiros): [1, 2, 3] - formato antigo (backward compatible)
    2. Lista de dicts com seleções: [{"id": 1, "service_kind": "calibracao", "local": "P"}, ...] - formato novo
    
    Normaliza ambos os formatos para uma estrutura interna consistente.
    """
    
    def to_internal_value(self, data):
        """
        Normaliza o input para uma estrutura interna consistente.
        
        Aceita:
        - Lista de inteiros (PKs): [1, 2, 3]
        - Lista de dicts: [{"id": 1, ...}, {"id": 2, ...}]
        - None ou lista vazia: []
        
        Retorna lista de dicts normalizados com estrutura:
        [{"id": 1, "service_kind": "calibracao", "local": "P"}, ...]
        """
        if data is None:
            return []
        
        if not isinstance(data, list):
            raise serializers.ValidationError(
                "Esperado uma lista de instrumentos (PKs ou dicts)."
            )
        
        normalized = []
        for item in data:
            if isinstance(item, dict):
                instrumento_id = item.get('id') or item.get('pk')
                if instrumento_id is None:
                    raise serializers.ValidationError(
                        "Dict de instrumento deve conter campo 'id' ou 'pk'."
                    )
                
                try:
                    instrumento_id = int(instrumento_id)
                except (ValueError, TypeError):
                    raise serializers.ValidationError(
                        f"ID do instrumento deve ser um inteiro válido, recebeu: {instrumento_id}"
                    )
                
                service_kind = item.get('service_kind', 'calibracao')
                if service_kind not in ['calibracao', 'manutencao']:
                    raise serializers.ValidationError(
                        f"service_kind deve ser 'calibracao' ou 'manutencao', recebeu: {service_kind}"
                    )
                
                local = item.get('local', 'P')
                if local not in ['P', 'C', 'T']:
                    raise serializers.ValidationError(
                        f"local deve ser 'P', 'C' ou 'T', recebeu: {local}"
                    )
                
                normalized.append({
                    'id': instrumento_id,
                    'service_kind': service_kind,
                    'local': local,
                })
            elif isinstance(item, (int, str)):
                try:
                    instrumento_id = int(item)
                except (ValueError, TypeError):
                    raise serializers.ValidationError(
                        f"PK do instrumento deve ser um inteiro válido, recebeu: {item}"
                    )
                
                normalized.append({
                    'id': instrumento_id,
                    'service_kind': 'calibracao',
                    'local': 'P',
                })
            else:
                raise serializers.ValidationError(
                    f"Item inválido na lista de instrumentos. Esperado int ou dict, recebeu: {type(item).__name__}"
                )
        
        return normalized
    
    def to_representation(self, value):
        """Para escrita, não precisamos representar (campo write-only)."""
        if hasattr(value, 'all'):
            return [inst.id for inst in value.all()]
        if isinstance(value, list):
            return [item.get('id') if isinstance(item, dict) else item for item in value]
        return []


class WritePropostaSerializer(serializers.ModelSerializer):
    """
    Serializer para criação de Proposta.
    
    Aceita instrumentos em dois formatos (backward compatible):
    1. Lista de PKs: [1, 2, 3]
    2. Lista de dicts: [{"id": 1, "service_kind": "calibracao", "local": "P"}, ...]
    """
    instrumentos = InstrumentosField(required=False, allow_null=True, write_only=True)
    
    class Meta:
        model = Proposta
        fields = ("informacoes_adicionais", "instrumentos")

    def validate(self, data):
        user = self.context["request"].user
        cliente = Cliente.objects.get(usuarios=user)
        data["cliente"] = cliente
        return data
    
    def create(self, validated_data):
        instrumentos_data = validated_data.pop('instrumentos', [])
        
        proposta = super().create(validated_data)
        
        if instrumentos_data and len(instrumentos_data) > 0:
            instrument_ids = []
            for inst_data in instrumentos_data:
                instrumento_id = inst_data['id']
                
                try:
                    instrumento = InstrumentoDoCliente.objects.get(id=instrumento_id)
                    if instrumento.cliente != proposta.cliente:
                        raise serializers.ValidationError(
                            f"Instrumento {instrumento_id} não pertence ao cliente da proposta."
                        )
                except InstrumentoDoCliente.DoesNotExist:
                    raise serializers.ValidationError(
                        f"Instrumento com ID {instrumento_id} não existe."
                    )
                
                PropostaInstrumento.objects.create(
                    proposta=proposta,
                    instrumento=instrumento,
                    service_kind=inst_data.get('service_kind', 'calibracao'),
                    local=inst_data.get('local', proposta.local),
                )
                instrument_ids.append(instrumento_id)
            
            proposta.instrumentos.set(instrument_ids)
        
        return proposta

    def update(self, instance, validated_data):
        instrumentos_data = validated_data.pop("instrumentos", None)
        
        instance = super().update(instance=instance, validated_data=validated_data)
        
        if instrumentos_data is not None:
            instance.instrumentos_selecoes.all().delete()
            
            if len(instrumentos_data) > 0:
                instrument_ids = []
                for inst_data in instrumentos_data:
                    instrumento_id = inst_data['id']
                    
                    try:
                        instrumento = InstrumentoDoCliente.objects.get(id=instrumento_id)
                        if instrumento.cliente != instance.cliente:
                            raise serializers.ValidationError(
                                f"Instrumento {instrumento_id} não pertence ao cliente da proposta."
                            )
                    except InstrumentoDoCliente.DoesNotExist:
                        raise serializers.ValidationError(
                            f"Instrumento com ID {instrumento_id} não existe."
                        )
                    
                    PropostaInstrumento.objects.update_or_create(
                        proposta=instance,
                        instrumento=instrumento,
                        defaults={
                            'service_kind': inst_data.get('service_kind', 'calibracao'),
                            'local': inst_data.get('local', instance.local),
                        }
                    )
                    instrument_ids.append(instrumento_id)
                
                instance.instrumentos.set(instrument_ids)
            else:
                instance.instrumentos.clear()
        
        return instance


class ReadPropostaSerializer(serializers.ModelSerializer):
    instrumentos = InstrumentoDoClienteReadSerializer(many=True)
    instrumentos_selecoes = PropostaInstrumentoSerializer(many=True, read_only=True)
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
            "instrumentos_selecoes",
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
    instrumentos = InstrumentosField(required=False, allow_null=True, write_only=True)
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
            "cliente": {"required": True},
        }

    def create(self, validated_data):
        endereco_de_entrega_add = validated_data.pop("endereco_de_entrega_add", None)
        instrumentos_data = validated_data.pop("instrumentos", None)

        if endereco_de_entrega_add is not None:
            validated_data["endereco_de_entrega"] = Endereco.objects.create(
                **endereco_de_entrega_add
            )

        proposta = super().create(validated_data)
        
        if instrumentos_data and len(instrumentos_data) > 0:
            instrument_ids = []
            for inst_data in instrumentos_data:
                instrumento_id = inst_data['id']
                
                try:
                    instrumento = InstrumentoDoCliente.objects.get(id=instrumento_id)
                    if instrumento.cliente != proposta.cliente:
                        raise serializers.ValidationError(
                            f"Instrumento {instrumento_id} não pertence ao cliente da proposta."
                        )
                except InstrumentoDoCliente.DoesNotExist:
                    raise serializers.ValidationError(
                        f"Instrumento com ID {instrumento_id} não existe."
                    )
                
                PropostaInstrumento.objects.create(
                    proposta=proposta,
                    instrumento=instrumento,
                    service_kind=inst_data.get('service_kind', 'calibracao'),
                    local=inst_data.get('local', proposta.local),
                )
                instrument_ids.append(instrumento_id)
            
            proposta.instrumentos.set(instrument_ids)
        
        return proposta

    def update(self, instance, validated_data):
        endereco_de_entrega_add = validated_data.pop("endereco_de_entrega_add", None)
        instrumentos_data = validated_data.pop("instrumentos", None)

        if endereco_de_entrega_add is not None:
            validated_data["endereco_de_entrega"] = Endereco.objects.create(
                **endereco_de_entrega_add
            )

        instance = super().update(instance=instance, validated_data=validated_data)
        
        if instrumentos_data is not None:
            instance.instrumentos_selecoes.all().delete()
            
            if len(instrumentos_data) > 0:
                instrument_ids = []
                for inst_data in instrumentos_data:
                    instrumento_id = inst_data['id']
                    
                    try:
                        instrumento = InstrumentoDoCliente.objects.get(id=instrumento_id)
                        if instrumento.cliente != instance.cliente:
                            raise serializers.ValidationError(
                                f"Instrumento {instrumento_id} não pertence ao cliente da proposta."
                            )
                    except InstrumentoDoCliente.DoesNotExist:
                        raise serializers.ValidationError(
                            f"Instrumento com ID {instrumento_id} não existe."
                        )
                    
                    PropostaInstrumento.objects.update_or_create(
                        proposta=instance,
                        instrumento=instrumento,
                        defaults={
                            'service_kind': inst_data.get('service_kind', 'calibracao'),
                            'local': inst_data.get('local', instance.local),
                        }
                    )
                    instrument_ids.append(instrumento_id)
                
                instance.instrumentos.set(instrument_ids)
            else:
                instance.instrumentos.clear()
        
        # Recalcular o total baseado nos instrumentos e no local da proposta
        if instance.instrumentos.exists():
            local = instance.local or Local.PERMANENTE
            if local == Local.CLIENTE:
                preco_field = "instrumento__preco_calibracao_no_cliente"
            else:
                preco_field = "instrumento__preco_calibracao_no_laboratorio"
            
            total_calculado = (
                instance.instrumentos.aggregate(
                    total=models.Sum(
                        models.Case(
                            models.When(
                                preco_alternativo_calibracao__isnull=False,
                                then=models.F("preco_alternativo_calibracao"),
                            ),
                            default=models.F(preco_field),
                        )
                    )
                )["total"]
                or Decimal("0")
            )
            
            instance.total = total_calculado
            instance.save(update_fields=['total'])

        return instance

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
    instrumentos_selecoes = PropostaInstrumentoSerializer(many=True, read_only=True)
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
            "instrumentos_selecoes",
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
        if not cliente:
            return InstrumentoDoCliente.objects.none()

        instrumentos = InstrumentoDoCliente.objects.filter(cliente_id=cliente).select_related(
            'cliente',
            'instrumento',
            'setor',
            'frequencia_calibracao',
            'frequencia_checagem'
        ).prefetch_related(
            'normativos',
            'criterios_aceitacao',
            'pontos_de_calibracao',
            'historico_posicoes',
            'historico_setores'
        )

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
