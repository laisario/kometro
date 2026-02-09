from rest_framework import serializers
from .models import OrdemServico, InstrumentoOS
from instrumentos.serializers import InstrumentoDoClienteListReadSerializer


class InstrumentoOSSerializer(serializers.ModelSerializer):
    instrumento = InstrumentoDoClienteListReadSerializer(read_only=True)
    fabricante = serializers.CharField(source='fabricante', read_only=True)
    numero_serie = serializers.CharField(source='numero_serie', read_only=True)
    
    class Meta:
        model = InstrumentoOS
        fields = [
            'id',
            'item',
            'instrumento',
            'observacao',
            'local',
            'tipo_servico',
            'carga_maxima',
            'marca_reparo',
            'marca_selagem_nova',
            'servico_executado',
            'descricao_anomalia',
            'quantidade',
            'fabricante',
            'numero_serie',
        ]
        read_only_fields = ['id', 'item']


class OrdemServicoSerializer(serializers.ModelSerializer):
    proposta_numero = serializers.CharField(source='proposta.numero', read_only=True)
    cliente_nome = serializers.SerializerMethodField()
    responsavel_nome = serializers.SerializerMethodField()
    instrumentos_count = serializers.SerializerMethodField()
    
    class Meta:
        model = OrdemServico
        fields = [
            'id', 
            'numero', 
            'proposta', 
            'proposta_numero', 
            'cliente_nome',
            'responsavel', 
            'responsavel_nome', 
            'data_expiracao', 
            'data_criacao',
            'instrumentos_count',
            'tipo_os',
            'status',
            'data_recebimento_instrumentos',
            'data_liberacao_instrumentos',
            'data_calibracao_instrumentos',
            'data_liberacao_calibracao',
        ]
        read_only_fields = ['id', 'numero', 'proposta', 'data_criacao']
    
    def get_cliente_nome(self, obj):
        if obj.proposta and obj.proposta.cliente and obj.proposta.cliente.empresa:
            return obj.proposta.cliente.empresa.razao_social
        return None
    
    def get_responsavel_nome(self, obj):
        if obj.responsavel:
            full_name = f"{obj.responsavel.first_name} {obj.responsavel.last_name}".strip()
            return full_name if full_name else obj.responsavel.username
        return None
    
    def get_instrumentos_count(self, obj):
        return obj.instrumentos.count()


class OrdemServicoDetailSerializer(OrdemServicoSerializer):
    instrumentos_os = InstrumentoOSSerializer(many=True, read_only=True, source='instrumentos_os.all')
    instrumentos = InstrumentoDoClienteListReadSerializer(many=True, read_only=True)
    
    class Meta(OrdemServicoSerializer.Meta):
        fields = OrdemServicoSerializer.Meta.fields + ['instrumentos', 'instrumentos_os']


class OrdemServicoUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrdemServico
        fields = [
            'responsavel',
            'data_expiracao',
            'status',
            'data_recebimento_instrumentos',
            'data_liberacao_instrumentos',
            'data_calibracao_instrumentos',
            'data_liberacao_calibracao',
        ]
    
    def validate_status(self, value):
        instance = self.instance
        if instance and not instance.pode_transicionar_status(value):
            raise serializers.ValidationError(
                f"Cannot transition from {instance.get_status_display()} to {instance.StatusOS(value).label}"
            )
        return value
