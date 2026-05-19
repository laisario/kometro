from rest_framework import serializers
from .models import OrdemServico, InstrumentoOS, StatusOS, TipoOS
from instrumentos.serializers import InstrumentoDoClienteListReadSerializer
from clientes.models import Cliente


class InstrumentoOSSerializer(serializers.ModelSerializer):
    instrumento = InstrumentoDoClienteListReadSerializer(read_only=True)
    fabricante = serializers.CharField(read_only=True)
    numero_serie = serializers.CharField(read_only=True)
    # Computed properties - use SerializerMethodField to explicitly call the property
    carga_maxima = serializers.SerializerMethodField()
    tipo_servico = serializers.SerializerMethodField()
    numero_certificado = serializers.SerializerMethodField()
    
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
            'marca_selagem_retirada',
            'servico_executado',
            'descricao_anomalia',
            'quantidade',
            'fabricante',
            'numero_serie',
            'numero_certificado',
        ]
        read_only_fields = ['id', 'item', 'carga_maxima', 'tipo_servico', 'numero_certificado']
    
    def get_carga_maxima(self, obj):
        """Return computed carga_maxima from instrumento.instrumento.maximo"""
        return obj.carga_maxima
    
    def get_tipo_servico(self, obj):
        """Return computed tipo_servico from InstrumentoDoCliente.tipo_de_servico"""
        return obj.tipo_servico
    
    def get_numero_certificado(self, obj):
        """Return numero_certificado from instrumento.numero_certificado"""
        if obj.instrumento:
            return obj.instrumento.numero_certificado
        return None


class OrdemServicoSerializer(serializers.ModelSerializer):
    proposta_numero = serializers.CharField(source='proposta.numero', read_only=True, allow_null=True)
    cliente = serializers.PrimaryKeyRelatedField(read_only=True, source='resolved_cliente')
    cliente_nome = serializers.SerializerMethodField()
    responsavel_nome = serializers.SerializerMethodField()
    instrumentos_count = serializers.SerializerMethodField()
    cliente_cnpj = serializers.SerializerMethodField()
    class Meta:
        model = OrdemServico
        fields = [
            'id', 
            'numero', 
            'proposta', 
            'proposta_numero', 
            'cliente',
            'cliente_nome',
            'cliente_cnpj',
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
            'os_recebimento_dos_instruementos',
            'descricao',
        ]
        read_only_fields = ['id', 'numero', 'proposta', 'data_criacao']
    
    def get_cliente_nome(self, obj):
        cliente = obj.resolved_cliente
        if cliente and cliente.empresa:
            return cliente.empresa.razao_social
        return None

    def get_cliente_cnpj(self, obj):
        cliente = obj.resolved_cliente
        if cliente and cliente.empresa:
            return cliente.empresa.cnpj
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
    
    class Meta(OrdemServicoSerializer.Meta):
        fields = OrdemServicoSerializer.Meta.fields + ['instrumentos_os']


class OrdemServicoStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrdemServico
        fields = ['status']


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
            'os_recebimento_dos_instruementos',
            'descricao',
        ]
    
    def validate_status(self, value):
        """
        Coerce any incoming status value to EM_ANDAMENTO.
        This ensures that API consumers cannot set a different status via update.
        """
        return StatusOS.EM_ANDAMENTO
    

    def update(self, instance, validated_data):
        """
        On any update (PUT/PATCH), force status to EM_ANDAMENTO regardless
        of the previous status or the payload.
        """
        # Remove status from validated_data to avoid ModelSerializer
        # applying a different value before we enforce EM_ANDAMENTO.
        validated_data.pop('status', None)
        
        instance = super().update(instance, validated_data)
        instance.status = StatusOS.EM_ANDAMENTO
        instance.save(update_fields=['status'])
        return instance


class OrdemServicoTechnicalVisitCreateSerializer(serializers.ModelSerializer):
    cliente = serializers.PrimaryKeyRelatedField(queryset=Cliente.objects.all())

    class Meta:
        model = OrdemServico
        fields = [
            'cliente',
            'responsavel',
            'data_expiracao',
            'descricao',
        ]

    def validate(self, attrs):
        if not attrs.get('cliente'):
            raise serializers.ValidationError({'cliente': ['Cliente é obrigatório.']})
        return attrs

    def create(self, validated_data):
        cliente = validated_data['cliente']
        tipo_os = TipoOS.VISITA_TECNICA.value
        sequence = OrdemServico.objects.filter(
            cliente=cliente,
            tipo_os=tipo_os,
        ).count() + 1
        base = f"{cliente.id:04d}"
        numero = f"{base}-OS-{tipo_os}-{sequence:03d}"

        while OrdemServico.objects.filter(numero=numero).exists():
            sequence += 1
            numero = f"{base}-OS-{tipo_os}-{sequence:03d}"

        return OrdemServico.objects.create(
            **validated_data,
            proposta=None,
            tipo_os=tipo_os,
            status=StatusOS.A_REALIZAR,
            numero=numero,
        )
