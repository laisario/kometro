from rest_framework import serializers
from clientes.serializers import ClienteSerializer, UserSerializer
from procedimentos.serializer import ReadProcedimentoSerializer
from .models import (
    Calibracao,
    CapacidadeMedicao,
    Instrumento,
    InstrumentoDoCliente,
    InstrumentoBaseCliente,
    TipoInstrumento,
    PontoDeCalibracao,
    Certificado,
    Anexo,
    Setor,
    TipoServico,
    TipoSinal,
    Frequencia,
    Normativo,
    MovimentacaoInstrumento,
    CriterioAceitacao,
    ResultadoCalibracao,
    MovimentacaoSetorInstrumento,
    CalibracaoStatus
)
from procedimentos.models import Procedimento
from decimal import Decimal
from rest_framework.validators import UniqueTogetherValidator


PERIODOS_RELATIVEDELTA = {
    "dia": "days",
    "dias": "days",
    "mes": "months",
    "meses": "months",
    "ano": "years",
    "anos": "years",
}


class TipoInstrumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoInstrumento
        fields = "__all__"


class CapacidadeMedicaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CapacidadeMedicao
        fields = "__all__"


class PontoDeCalibracaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PontoDeCalibracao
        fields = ["nome"]


class AnexoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Anexo
        fields = ("anexo", "certificado", "id")


class CertificadoSerializer(serializers.ModelSerializer):
    anexos = AnexoSerializer(many=True)

    class Meta:
        model = Certificado
        fields = ("numero", "arquivo", "anexos", "id")


class InstrumentoWriteSerializer(serializers.ModelSerializer):
    descricao = serializers.CharField(write_only=True)
    modelo = serializers.CharField(required=False, allow_blank=True, write_only=True)
    fabricante = serializers.CharField(required=False, allow_blank=True, write_only=True)
    resolucao = serializers.FloatField(required=False, allow_null=True, write_only=True)

    capacidade_medicao = serializers.FloatField(required=False, allow_null=True, write_only=True)
    unidade_capacidade = serializers.CharField(required=False, allow_blank=True, write_only=True)

    procedimento_relacionado = serializers.CharField(required=False, allow_blank=True, write_only=True)

    tipo_de_servico = serializers.ChoiceField(choices=TipoServico.choices)
    tipo_sinal = serializers.ChoiceField(choices=TipoSinal.choices)      

    maximo = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    minimo = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    unidade = serializers.CharField(required=False, allow_blank=True, write_only=True)                                 

    class Meta:
        model = Instrumento
        fields = [
            "descricao", 
            "modelo", 
            "fabricante", 
            "resolucao",
            "capacidade_medicao", 
            "unidade_capacidade",
            "procedimento_relacionado", 
            "tipo_de_servico", 
            "tipo_sinal",
            "minimo", 
            "maximo", 
            "unidade",
            "preco_calibracao_no_cliente",
            "preco_calibracao_no_laboratorio",
        ]

    def create(self, validated_data):
        descricao = validated_data.pop("descricao")
        modelo = validated_data.pop("modelo", "")
        fabricante = validated_data.pop("fabricante", "")
        resolucao = validated_data.pop("resolucao", None)

        tipo_de_instrumento, _ = TipoInstrumento.objects.get_or_create(
            descricao=descricao,
            modelo=modelo,
            fabricante=fabricante,
            defaults={"resolucao": resolucao}
        )

        if tipo_de_instrumento.resolucao is None and resolucao is not None:
            tipo_de_instrumento.resolucao = resolucao
            tipo_de_instrumento.save()

        capacidade_medicao = None
        valor_cap = validated_data.pop("capacidade_medicao", None)
        unidade_cap = validated_data.pop("unidade_capacidade", None)

        if valor_cap is not None and unidade_cap:
            capacidade_medicao, _ = CapacidadeMedicao.objects.get_or_create(
                valor=valor_cap,
                unidade=unidade_cap
            )

        procedimento_relacionado = None
        proc_codigo = validated_data.pop("procedimento_relacionado", "").strip()

        if proc_codigo:
            procedimento_relacionado, _ = Procedimento.objects.get_or_create(
                codigo=proc_codigo,
            )

        instrumento = Instrumento.objects.create(
            tipo_de_instrumento=tipo_de_instrumento,
            capacidade_de_medicao=capacidade_medicao,
            procedimento_relacionado=procedimento_relacionado,
            **validated_data
        )

        return instrumento

    def update(self, instance, validated_data):
        descricao = validated_data.pop("descricao", None)
        modelo = validated_data.pop("modelo", None)
        fabricante = validated_data.pop("fabricante", None)
        resolucao = validated_data.pop("resolucao", None)

        if descricao is not None:
            tipo_de_instrumento, _ = TipoInstrumento.objects.get_or_create(
                descricao=descricao,
                modelo=modelo or "",
                fabricante=fabricante or "",
                defaults={"resolucao": resolucao}
            )

            if tipo_de_instrumento.resolucao is None and resolucao is not None:
                tipo_de_instrumento.resolucao = resolucao
                tipo_de_instrumento.save()

            instance.tipo_de_instrumento = tipo_de_instrumento

        valor_cap = validated_data.pop("capacidade_medicao", None)
        unidade_cap = validated_data.pop("unidade_capacidade", None)

        if valor_cap is not None and unidade_cap:
            capacidade_medicao, _ = CapacidadeMedicao.objects.get_or_create(
                valor=valor_cap,
                unidade=unidade_cap
            )
            instance.capacidade_de_medicao = capacidade_medicao

        proc_codigo = validated_data.pop("procedimento_relacionado", None)
        if proc_codigo is not None:
            if proc_codigo.strip():
                procedimento_relacionado, _ = Procedimento.objects.get_or_create(
                    codigo=proc_codigo.strip(),
                )
                instance.procedimento_relacionado = procedimento_relacionado
            else:
                instance.procedimento_relacionado = None

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


class InstrumentoReadSerializer(serializers.ModelSerializer):
    capacidade_de_medicao = CapacidadeMedicaoSerializer()
    procedimento_relacionado = ReadProcedimentoSerializer()
    tipo_de_instrumento = TipoInstrumentoSerializer()

    class Meta:
        model = Instrumento
        fields = [
            "tipo_de_instrumento",
            "capacidade_de_medicao",
            "procedimento_relacionado",
            "maximo",
            "minimo",
            "unidade",
            "preco_calibracao_no_cliente",
            "preco_calibracao_no_laboratorio",
            "tipo_de_servico",
            "tipo_sinal",
            "id",
        ]


class SetorCalibracaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Setor
        fields = [
            "id", "nome", "setor_pai"
        ]
    


class CriterioAceitacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CriterioAceitacao
        fields = [
            'tipo', 
            'criterio_de_aceitacao', 
            'referencia_do_criterio', 
            'observacao_criterio_aceitacao', 
            'unidade', 
            'id'
        ]


class ResultadoCalibracaoSerializer(serializers.ModelSerializer):
    criterio = CriterioAceitacaoSerializer()
    class Meta:
        model = ResultadoCalibracao
        fields = [
            'id',
            'status',
            'maior_erro',
            'incerteza',
            'criterio'
        ]


class CalibracaoWriteSerializer(serializers.ModelSerializer):
    maior_erro = serializers.CharField(write_only=True, required=False, allow_null=True)
    incerteza = serializers.CharField(write_only=True, required=False, allow_null=True)
    criterio = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Calibracao
        fields = (
            "instrumento",
            "ordem_de_servico",
            "local",
            "data",
            "observacoes",
            "analise_critica",
            "restricao_analise_critica",
            "id",
            "laboratorio",
            "observacao_fornecedor",
            "preco",
            'checagem',
            'maior_erro',
            'incerteza',
            'criterio',
        )

    def create(self, validated_data):
        criterio_data = validated_data.pop('criterio', [])
        maior_erro = validated_data.pop('maior_erro', []) or Decimal("0")
        incerteza = validated_data.pop('incerteza', []) or Decimal("0")
        calibracao = Calibracao.objects.create(**validated_data)
        if criterio_data:
            criterio = CriterioAceitacao.objects.get(id=criterio_data)
            criterio_aceitacao = criterio.criterio_de_aceitacao
        else: 
            criterio = None
            
        if maior_erro or incerteza and criterio is not None:
            status = (
                CalibracaoStatus.APROVADO
                if criterio is not None
                and abs(Decimal(maior_erro)) + abs(Decimal(incerteza)) <= criterio_aceitacao
                else CalibracaoStatus.REPROVADO
            )

            ResultadoCalibracao.objects.create(
                calibracao=calibracao,
                criterio=criterio,
                maior_erro=maior_erro,
                incerteza=incerteza,
                status=status
            )

        return calibracao
    
    def update(self, instance, validated_data):
        criterio_data = validated_data.pop('criterio', None)
        maior_erro = validated_data.pop('maior_erro', None) or Decimal("0")
        incerteza = validated_data.pop('incerteza', None) or Decimal("0")

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        criterio = None
        criterio_aceitacao = None
        if criterio_data:
            criterio = CriterioAceitacao.objects.get(id=criterio_data)
            criterio_aceitacao = criterio.criterio_de_aceitacao

        if (maior_erro or incerteza) and criterio is not None:
            status = (
                CalibracaoStatus.APROVADO
                if abs(Decimal(maior_erro)) + abs(Decimal(incerteza)) <= criterio_aceitacao
                else CalibracaoStatus.REPROVADO
            )

            resultado, created = ResultadoCalibracao.objects.update_or_create(
                calibracao=instance,
                defaults={
                    "criterio": criterio,
                    "maior_erro": maior_erro,
                    "incerteza": incerteza,
                    "status": status,
                },
            )
        return instance


class ChecagemWriteSerializer(serializers.ModelSerializer):
    maior_erro = serializers.CharField(write_only=True)
    criterio = serializers.IntegerField(write_only=True)
    class Meta:
        model = Calibracao
        fields = (
            "instrumento",
            "ordem_de_servico",
            "local",
            "data",
            "status",
            "maior_erro",
            "criterio",
            "observacoes",
            "analise_critica",
            "restricao_analise_critica",
            "checagem",
        )

    def create(self, validated_data):
        criterio_data = validated_data.pop('criterio', [])
        maior_erro = validated_data.pop('maior_erro', []) or Decimal("0")
        checagem = Calibracao.objects.create(**validated_data)

        if criterio_data:
            criterio = CriterioAceitacao.objects.get(id=criterio_data).criterio_de_aceitacao
            criterio_aceitacao = criterio.criterio_de_aceitacao
        else: 
            criterio = None
            
        if maior_erro is not None and criterio is not None:
            status = (
                CalibracaoStatus.APROVADO
                if criterio is not None
                and abs(Decimal(maior_erro)) <= criterio_aceitacao
                else CalibracaoStatus.REPROVADO
            )

            ResultadoCalibracao.objects.create(
                calibracao=checagem,
                criterio=criterio,
                maior_erro=maior_erro,
                status=status
            )

        return checagem
    

    def update(self, instance, validated_data):
        criterio_data = validated_data.pop('criterio', None)
        maior_erro = validated_data.pop('maior_erro', None) or Decimal("0")

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        criterio = None
        criterio_aceitacao = None
        if criterio_data:
            criterio = CriterioAceitacao.objects.get(id=criterio_data)
            criterio_aceitacao = criterio.criterio_de_aceitacao

        if maior_erro and criterio is not None:
            status = (
                CalibracaoStatus.APROVADO
                if abs(Decimal(maior_erro)) <= criterio_aceitacao
                else CalibracaoStatus.REPROVADO
            )

            resultado, created = ResultadoCalibracao.objects.update_or_create(
                calibracao=instance,
                defaults={
                    "criterio": criterio,
                    "maior_erro": maior_erro,
                    "status": status,
                },
            )
        return instance
    

class FrequenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Frequencia
        fields = ['quantidade', 'periodo']


class NormativoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Normativo
        fields = ['id', 'nome']


class MovimentacaoInstrumentoSerializer(serializers.ModelSerializer):
    usuario_alteracao = UserSerializer()

    class Meta:
        model = MovimentacaoInstrumento
        fields = ['id', 'nova_posicao', 'data_alteracao', 'usuario_alteracao', 'antiga_posicao']


class MovimentacaoSetorInstrumentoSerializer(serializers.ModelSerializer):
    usuario_alteracao = UserSerializer()

    class Meta:
        model = MovimentacaoSetorInstrumento
        fields = ['id', 'novo_setor', 'data_alteracao', 'usuario_alteracao', 'antigo_setor']

class SetorInstrumentoAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Setor
        fields = [
            "id", "nome", "setor_pai"
        ]

class InstrumentoDoClienteReadSerializer(serializers.ModelSerializer):
    cliente = ClienteSerializer()
    instrumento = InstrumentoReadSerializer()
    pontos_de_calibracao = PontoDeCalibracaoSerializer(many=True)
    frequencia_calibracao = FrequenciaSerializer()
    frequencia_checagem = FrequenciaSerializer()
    normativos = NormativoSerializer(many=True)
    setor = SetorCalibracaoSerializer()
    historico_posicoes = MovimentacaoInstrumentoSerializer(many=True, read_only=True)
    criterios_aceitacao = CriterioAceitacaoSerializer(many=True)
    historico_setores = MovimentacaoSetorInstrumentoSerializer(many=True)
    checagens = serializers.SerializerMethodField()
    calibracoes = serializers.SerializerMethodField()

    class Meta:
        model = InstrumentoDoCliente
        fields = (
            "cliente",
            "instrumento",
            "tag",
            "numero_de_serie",
            "posicao",
            "data_proxima_calibracao",
            "data_ultima_calibracao",
            "id",
            "pontos_de_calibracao",
            "expirado",
            "calibracoes",
            "setor",
            "criterios_aceitacao",
            "classe",
            "frequencia_checagem",
            "frequencia_calibracao",
            "normativos",
            "historico_posicoes",
            "data_proxima_checagem",
            "data_ultima_checagem",
            "criterios_aceitacao",
            "observacao",
            "historico_setores",
            "data_criacao",
            "preco_alternativo_calibracao",
            "criterio_frequencia",
            "checagens"
        )

    def get_checagens(self, obj):
        return list(obj.calibracoes.filter(checagem=True).values_list("id", flat=True))
    
    def get_calibracoes(self, obj):
        return list(obj.calibracoes.filter(checagem=False).values_list("id", flat=True))

class CalibracaoReadSerializer(serializers.ModelSerializer):
    certificados = CertificadoSerializer(many=True)
    setor = SetorCalibracaoSerializer()
    instrumento = InstrumentoDoClienteReadSerializer()
    resultados = ResultadoCalibracaoSerializer(many=True)

    class Meta:
        model = Calibracao
        fields = (
            "instrumento",
            "ordem_de_servico",
            "local",
            "data",
            "resultados",
            "observacoes",
            "analise_critica",
            "restricao_analise_critica",
            "certificados",
            "setor",
            "id",
            "laboratorio",
            "observacao_fornecedor",
            "preco",
        )

class ChecagemReadSerializer(serializers.ModelSerializer):
    certificados = CertificadoSerializer(many=True)
    setor = SetorCalibracaoSerializer()
    instrumento = InstrumentoDoClienteReadSerializer()
    certificados = CertificadoSerializer(many=True)
    resultados = ResultadoCalibracaoSerializer(many=True)

    class Meta:
        model = Calibracao
        fields = (
            "instrumento",
            "ordem_de_servico",
            "local",
            "data",
            "resultados",
            "observacoes",
            "analise_critica",
            "restricao_analise_critica",
            "setor",
            "certificados",
            "checagem",
            "id",
        )

def is_frequencia_vazia(data):
    return not data or data.get('quantidade') in (None, '', 0)

class InstrumentoDoClienteWriteSerializer(serializers.ModelSerializer):
    procedimento_relacionado = serializers.CharField(
        required=False, allow_null=True, allow_blank=True
    )
    pontos_de_calibracao = serializers.ListField(
        child=serializers.CharField(), required=False, write_only=True
    )
    frequencia_checagem = FrequenciaSerializer(required=False, allow_null=True)
    frequencia_calibracao = FrequenciaSerializer(required=False, allow_null=True)
    normativos = serializers.ListField(child=serializers.DictField(
        child=serializers.CharField()), required=False, write_only=True
    )
    criterios_aceitacao = CriterioAceitacaoSerializer(many=True)
    criterio_frequencia = serializers.CharField(
        required=False, allow_null=True, allow_blank=True
    )

    class Meta:
        model = InstrumentoDoCliente
        fields = (
            "instrumento",
            "tag",
            "numero_de_serie",
            "posicao",
            "pontos_de_calibracao",
            "cliente",
            "procedimento_relacionado",
            "setor",
            "classe",
            "frequencia_checagem",
            "frequencia_calibracao",
            "normativos",
            "data_ultima_calibracao",
            "data_ultima_checagem",
            "criterios_aceitacao",
            "observacao",
            "criterio_frequencia",
        )
        validators = [
            UniqueTogetherValidator(
                queryset=InstrumentoDoCliente.objects.all(),
                fields=['cliente', 'tag'],
                message="Você já possui um intrumento com essa Tag. Escolha outra."
            )
        ]


    def create(self, validated_data):
        freq_checagem_data = validated_data.pop('frequencia_checagem', None)
        freq_calibracao_data = validated_data.pop('frequencia_calibracao', None)
        normativos_nomes = validated_data.pop('normativos', [])
        pontos_data = validated_data.pop('pontos_de_calibracao', [])
        criterios_data = validated_data.pop('criterios_aceitacao', [])

        if freq_checagem_data and not is_frequencia_vazia(freq_checagem_data):
            validated_data['frequencia_checagem'] = Frequencia.objects.create(**freq_checagem_data)

        if  freq_calibracao_data and not is_frequencia_vazia(freq_calibracao_data):
            validated_data['frequencia_calibracao'] = Frequencia.objects.create(**freq_calibracao_data)

        instrumento = InstrumentoDoCliente.objects.create(**validated_data)

        MovimentacaoInstrumento.objects.create(
            instrumento=instrumento,
            nova_posicao=validated_data.pop('posicao', None),
            usuario_alteracao=self.context.get('request').user,
        )

        for criterio in criterios_data:
            CriterioAceitacao.objects.create(instrumento=instrumento, **criterio)


        for ponto in pontos_data:
            PontoDeCalibracao.objects.create(
                instrumento=instrumento,
                nome=ponto,
            )

        for normativo_dict in normativos_nomes:
            nome = normativo_dict.get('nome')
            if nome:
                normativo, _ = Normativo.objects.get_or_create(
                    nome=nome,
                    cliente=instrumento.cliente
                )
                instrumento.normativos.add(normativo)
        return instrumento


    def update(self, instance, validated_data):
        freq_checagem_data = validated_data.pop('frequencia_checagem', None)
        freq_calibracao_data = validated_data.pop('frequencia_calibracao', None)
        normativos_nomes = validated_data.pop('normativos', [])
        pontos_data = validated_data.pop('pontos_de_calibracao', None)
        criterios_data = validated_data.pop('criterios_aceitacao', None)
        setor = validated_data.pop('setor', None)

        user = None
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            user = request.user

        old_posicao = instance.posicao
        new_posicao = validated_data.get('posicao', None)

        if setor:
            if setor.id != instance.setor.id:
                MovimentacaoSetorInstrumento.objects.create(
                    instrumento=instance,
                    antigo_setor=instance.setor.nome if instance.setor else '',
                    novo_setor=setor,
                    usuario_alteracao=user
                )

            instance.setor_id = setor

        if freq_checagem_data:
            if instance.frequencia_checagem:
                for attr, value in freq_checagem_data.items():
                    setattr(instance.frequencia_checagem, attr, value)
                instance.frequencia_checagem.save()
            else:
                instance.frequencia_checagem = Frequencia.objects.create(**freq_checagem_data)

        if freq_calibracao_data:
            if instance.frequencia_calibracao:
                for attr, value in freq_calibracao_data.items():
                    setattr(instance.frequencia_calibracao, attr, value)
                instance.frequencia_calibracao.save()
            else:
                instance.frequencia_calibracao = Frequencia.objects.create(**freq_calibracao_data)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
    
        if new_posicao and new_posicao != old_posicao:
            MovimentacaoInstrumento.objects.create(
                instrumento=instance,
                nova_posicao=new_posicao,
                antiga_posicao=old_posicao,
                usuario_alteracao=user,
            )

        instance.save()

        normativos_objs = []
        for nome in normativos_nomes:
            if isinstance(nome, dict):
                nome = nome.get('nome')
            if nome:
                normativo, _ = Normativo.objects.get_or_create(nome=nome, cliente=instance.cliente)
                normativos_objs.append(normativo)
        instance.normativos.set(normativos_objs)

        if pontos_data is not None:
            instance.pontos_de_calibracao.all().delete()
            for ponto in pontos_data:
                PontoDeCalibracao.objects.create(
                    instrumento=instance,
                    nome=ponto
                )

        if criterios_data is not None:
            instance.criterios_aceitacao.all().delete()
            for criterio in criterios_data:
                CriterioAceitacao.objects.create(instrumento=instance, **criterio)

        return instance

class InstrumentoDoClienteWriteAdminSerializer(serializers.ModelSerializer):
    procedimento_relacionado = serializers.CharField(
        required=False, allow_null=True, allow_blank=True
    )
    pontos_de_calibracao = serializers.ListField(
        child=serializers.CharField(), required=False, write_only=True
    )
    frequencia_checagem = FrequenciaSerializer(required=False, allow_null=True)
    frequencia_calibracao = FrequenciaSerializer(required=False, allow_null=True)
    normativos = serializers.ListField(child=serializers.DictField(
        child=serializers.CharField()), required=False, write_only=True
    )
    criterios_aceitacao = CriterioAceitacaoSerializer(many=True)
    criterio_frequencia = serializers.CharField(
        required=False, allow_null=True, allow_blank=True
    )
    setor = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = InstrumentoDoCliente
        fields = (
            "instrumento",
            "tag",
            "numero_de_serie",
            "posicao",
            "data_ultima_calibracao",
            "data_ultima_checagem",
            "id",
            "preco_alternativo_calibracao",
            "dias_uteis",
            "pontos_de_calibracao",
            "cliente",
            "procedimento_relacionado",
            "setor",
            "classe",
            "frequencia_checagem",
            "frequencia_calibracao",
            "normativos",
            "criterios_aceitacao",
            "observacao",
            "criterio_frequencia"
        )
        validators = [
            UniqueTogetherValidator(
                queryset=InstrumentoDoCliente.objects.all(),
                fields=['cliente', 'tag'],
                message="Você já possui um intrumento com essa Tag. Escolha outra."
            )
        ]

    def _get_or_create_setor_from_path(self, caminho, cliente):
        """
        Parse a setor hierarchy path and create/get sectors as needed.
        Returns the final (deepest) sector in the hierarchy.
        """
        if not caminho:
            return None
        
        sector_names = caminho.strip().split('/')
        setor_pai = None
        
        for nome in sector_names:
            nome = nome.strip()
            if not nome:  # Skip empty names
                continue
                
            setor, created = Setor.objects.get_or_create(
                nome=nome,
                setor_pai=setor_pai,
                cliente=cliente,
            )
            setor_pai = setor
        
        return setor_pai  # Returns the final sector in the hierarchy

    def create(self, validated_data):
        freq_checagem_data = validated_data.pop('frequencia_checagem', None)
        freq_calibracao_data = validated_data.pop('frequencia_calibracao', None)
        normativos_nomes = validated_data.pop('normativos', [])
        pontos_data = validated_data.pop('pontos_de_calibracao', [])
        criterios_data = validated_data.pop('criterios_aceitacao', [])
        setor_path = validated_data.pop('setor', None)

        if freq_checagem_data and not is_frequencia_vazia(freq_checagem_data):
            validated_data['frequencia_checagem'] = Frequencia.objects.create(**freq_checagem_data)

        if  freq_calibracao_data and not is_frequencia_vazia(freq_calibracao_data):
            validated_data['frequencia_calibracao'] = Frequencia.objects.create(**freq_calibracao_data)

        # Handle setor hierarchy path
        if setor_path:
            validated_data['setor'] = self._get_or_create_setor_from_path(setor_path, validated_data['cliente'])

        instrumento = InstrumentoDoCliente.objects.create(**validated_data)

        MovimentacaoInstrumento.objects.create(
            instrumento=instrumento,
            nova_posicao=validated_data.pop('posicao', None),
            usuario_alteracao=self.context.get('request').user,
        )

        for criterio in criterios_data:
            CriterioAceitacao.objects.create(instrumento=instrumento, **criterio)


        for ponto in pontos_data:
            PontoDeCalibracao.objects.create(
                instrumento=instrumento,
                nome=ponto,
            )

        for normativo_dict in normativos_nomes:
            nome = normativo_dict.get('nome')
            if nome:
                normativo, _ = Normativo.objects.get_or_create(
                    nome=nome,
                    cliente=instrumento.cliente
                )
                instrumento.normativos.add(normativo)
        return instrumento


    def update(self, instance, validated_data):
        freq_checagem_data = validated_data.pop('frequencia_checagem', None)
        freq_calibracao_data = validated_data.pop('frequencia_calibracao', None)
        normativos_nomes = validated_data.pop('normativos', [])
        pontos_data = validated_data.pop('pontos_de_calibracao', None)
        criterios_data = validated_data.pop('criterios_aceitacao', None)
        setor = validated_data.pop('setor', None)

        user = None
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            user = request.user

        old_posicao = instance.posicao
        new_posicao = validated_data.get('posicao', None)

        if setor:
            if isinstance(setor, str):
                setor = self._get_or_create_setor_from_path(setor, instance.cliente)
            
            if setor and (not instance.setor or setor.id != instance.setor.id):
                MovimentacaoSetorInstrumento.objects.create(
                    instrumento=instance,
                    novo_setor=setor,
                    antigo_setor=instance.setor.nome if instance.setor else '',
                    usuario_alteracao=user,
                )
                instance.setor = setor


        if freq_checagem_data:
            if instance.frequencia_checagem:
                for attr, value in freq_checagem_data.items():
                    setattr(instance.frequencia_checagem, attr, value)
                instance.frequencia_checagem.save()
            else:
                instance.frequencia_checagem = Frequencia.objects.create(**freq_checagem_data)

        if freq_calibracao_data:
            if instance.frequencia_calibracao:
                for attr, value in freq_calibracao_data.items():
                    setattr(instance.frequencia_calibracao, attr, value)
                instance.frequencia_calibracao.save()
            else:
                instance.frequencia_calibracao = Frequencia.objects.create(**freq_calibracao_data)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
    
        if new_posicao and new_posicao != old_posicao:
            MovimentacaoInstrumento.objects.create(
                instrumento=instance,
                nova_posicao=new_posicao,
                antiga_posicao=old_posicao,
                usuario_alteracao=user,
            )

        instance.save()

        normativos_objs = []
        for nome in normativos_nomes:
            if isinstance(nome, dict):
                nome = nome.get('nome')
            if nome:
                normativo, _ = Normativo.objects.get_or_create(nome=nome, cliente=instance.cliente)
                normativos_objs.append(normativo)
        instance.normativos.set(normativos_objs)

        if pontos_data is not None:
            instance.pontos_de_calibracao.all().delete()
            for ponto in pontos_data:
                PontoDeCalibracao.objects.create(
                    instrumento=instance,
                    nome=ponto
                )

        if criterios_data is not None:
            instance.criterios_aceitacao.all().delete()
            for criterio in criterios_data:
                CriterioAceitacao.objects.create(instrumento=instance, **criterio)

        return instance

class SetorInstrumentoAdminSerializer(serializers.ModelSerializer):
    caminho_hierarquia = serializers.SerializerMethodField()
    
    class Meta:
        model = Setor
        fields = [
            "id", "nome", "setor_pai", "caminho_hierarquia"
        ]
    
    def get_caminho_hierarquia(self, obj):
        path_parts = []
        current_sector = obj
        
        while current_sector:
            path_parts.insert(0, current_sector.nome)
            current_sector = current_sector.setor_pai
        
        return "/".join(path_parts)

class InstrumentoDoClienteReadAdminSerializer(serializers.ModelSerializer):
    instrumento = InstrumentoReadSerializer()
    pontos_de_calibracao = PontoDeCalibracaoSerializer(many=True)
    criterios_aceitacao = CriterioAceitacaoSerializer(many=True)
    setor = SetorInstrumentoAdminSerializer()
    frequencia_checagem = FrequenciaSerializer()
    frequencia_calibracao = FrequenciaSerializer()
    normativos = NormativoSerializer(many=True)
    historico_posicoes = MovimentacaoInstrumentoSerializer(many=True, read_only=True)
    historico_setores = MovimentacaoSetorInstrumentoSerializer(many=True)

    class Meta:
        model = InstrumentoDoCliente
        fields = (
            "instrumento",
            "tag",
            "numero_de_serie",
            "posicao",
            "data_proxima_calibracao",
            "data_ultima_calibracao",
            "id",
            "pontos_de_calibracao",
            "expirado",
            "setor",
            "criterios_aceitacao",
            "classe",
            "frequencia_checagem",
            "frequencia_calibracao",
            "normativos",
            "data_proxima_checagem",
            "data_ultima_checagem",
            "criterios_aceitacao",
            "observacao",
            "data_criacao",
            "preco_alternativo_calibracao",
            "criterio_frequencia",
            "historico_setores",
            "historico_posicoes",
        )

class SetorSerializer(serializers.ModelSerializer):
    setor_pai_id = serializers.PrimaryKeyRelatedField(
        queryset=Setor.objects.all(), source='setor_pai',
        write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Setor
        fields = [
            "id", "nome", "cliente",
            "setor_pai_id",
        ]

class InstrumentoDoClienteListReadSerializer(serializers.ModelSerializer):
    instrumento = InstrumentoReadSerializer()
    frequencia_calibracao = FrequenciaSerializer()
    frequencia_checagem = FrequenciaSerializer()
    normativos = NormativoSerializer(many=True)
    setor = SetorCalibracaoSerializer()

    class Meta:
        model = InstrumentoDoCliente
        fields = (
            "instrumento",
            "tag",
            "numero_de_serie",
            "posicao",
            "data_proxima_calibracao",
            "data_ultima_calibracao",
            "id",
            "setor",
            "frequencia_checagem",
            "frequencia_calibracao",
            "normativos",
            "data_proxima_checagem",
            "data_ultima_checagem",
        )

class InstrumentoBaseClienteSerializer(serializers.ModelSerializer):
    instrumento = InstrumentoReadSerializer(read_only=True)
    cliente = ClienteSerializer(read_only=True)
    
    class Meta:
        model = InstrumentoBaseCliente
        fields = [
            'id',
            'instrumento',
            'cliente', 
            'ativo',
            'data_criacao'
        ]

