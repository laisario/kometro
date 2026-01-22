from rest_framework import serializers
from .models import OrdemServico
from instrumentos.serializers import InstrumentoDoClienteListReadSerializer


class OrdemServicoSerializer(serializers.ModelSerializer):
    proposta_numero = serializers.CharField(source='proposta.numero', read_only=True)
    cliente_nome = serializers.SerializerMethodField()
    responsavel_nome = serializers.SerializerMethodField()
    instrumentos_count = serializers.IntegerField(source='instrumentos.count', read_only=True)
    
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


class OrdemServicoDetailSerializer(OrdemServicoSerializer):
    instrumentos = InstrumentoDoClienteListReadSerializer(many=True, read_only=True)
    
    class Meta(OrdemServicoSerializer.Meta):
        fields = OrdemServicoSerializer.Meta.fields + ['instrumentos']


class OrdemServicoUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrdemServico
        fields = ['responsavel', 'data_expiracao']
