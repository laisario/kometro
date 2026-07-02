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
from decimal import Decimal, InvalidOperation
from django.db import transaction
from rest_framework.validators import UniqueTogetherValidator
from .utils import (
    calcular_data_proxima_calibracao_calendario,
    calcular_data_proxima_calibracao_servico,
    calcular_data_proxima_checagem_calendario,
    calcular_data_proxima_checagem_servico
)
from .services import (
    atualizar_relacionamentos_instrumento,
    get_or_create_setor_from_path,
)
from .models import CriterioFrequencia
import logging
from django.db.models import Q

logger = logging.getLogger(__name__)


PERIODOS_RELATIVEDELTA = {
    "dia": "days",
    "dias": "days",
    "mes": "months",
    "meses": "months",
    "ano": "years",
    "anos": "years",
}


def _norm_str(v, none_if_blank=True):
    """
    Normaliza string: remove espaços e converte None/empty para None ou "".
    
    Args:
        v: valor a normalizar
        none_if_blank: se True, retorna None para strings vazias; se False, retorna ""
    
    Returns:
        str normalizado ou None
    """
    if v is None:
        return None
    s = str(v).strip()
    if none_if_blank and s == "":
        return None
    return s if s else (None if none_if_blank else "")


def _q_blank_or_null(field_name):
    """
    Retorna Q object que filtra por campo NULL ou string vazia.
    Útil para tratar inconsistências entre NULL e "" no banco.
    """
    return Q(**{f"{field_name}__isnull": True}) | Q(**{field_name: ""})


def _find_tipo_instrumento_deterministico(*, descricao, modelo=None, fabricante=None, resolucao=None):
    """
    Busca ou cria um TipoInstrumento de forma determinística e segura.
    
    Esta função resolve o problema de MultipleObjectsReturned que ocorria quando
    existiam múltiplos TipoInstrumento com a mesma descricao/modelo/fabricante/resolucao.
    
    Estratégia:
    1. Normaliza todos os campos de entrada (trim, tratamento de None/"" para campos opcionais)
    2. Busca com filtro completo incluindo todos os campos (descricao, modelo, fabricante, resolucao)
    3. Se encontrar múltiplos (duplicata perfeita), escolhe determinísticamente (menor id)
    4. Se não encontrar, cria novo registro
    5. Loga warning quando encontra duplicatas perfeitas
    
    Regras de matching:
    - descricao: sempre obrigatório, comparação case-insensitive
    - modelo/fabricante/resolucao: tratados de forma consistente
      * Se None/vazio: filtra por NULL no banco
      * Se fornecido: match exato
    
    Args:
        descricao: Descrição do tipo de instrumento (obrigatório)
        modelo: Modelo do instrumento (opcional)
        fabricante: Fabricante do instrumento (opcional)
        resolucao: Resolução do instrumento (opcional, pode ser None)
    
    Returns:
        tuple: (TipoInstrumento instance, created: bool)
    """
    # Normalizar campos de entrada
    descricao_n = _norm_str(descricao, none_if_blank=False)
    modelo_n = _norm_str(modelo, none_if_blank=True)
    fabricante_n = _norm_str(fabricante, none_if_blank=True)
    
    if not descricao_n:
        raise serializers.ValidationError({"descricao": "Campo obrigatório."})
    
    # Construir queryset base com descricao (case-insensitive)
    base = TipoInstrumento.objects.filter(descricao__iexact=descricao_n)
    
    # Filtrar por modelo (tratando NULL e "" como equivalentes)
    if modelo_n is None:
        base = base.filter(_q_blank_or_null("modelo"))
    else:
        base = base.filter(modelo__iexact=modelo_n)
    
    # Filtrar por fabricante (tratando NULL e "" como equivalentes)
    if fabricante_n is None:
        base = base.filter(_q_blank_or_null("fabricante"))
    else:
        base = base.filter(fabricante__iexact=fabricante_n)
    
    # Filtrar por resolucao (tratando de forma consistente como os outros campos)
    if resolucao is None:
        base = base.filter(resolucao__isnull=True)
    else:
        base = base.filter(resolucao=resolucao)
    
    # Ordenar por id para garantir determinismo
    base = base.order_by("id")
    
    # Verificar quantos registros foram encontrados
    count = base.count()
    
    if count == 0:
        # Não encontrou, criar novo
        tipo = TipoInstrumento.objects.create(
            descricao=descricao_n,
            modelo=modelo_n,
            fabricante=fabricante_n,
            resolucao=resolucao,
        )
        return tipo, True
    
    elif count == 1:
        # Encontrou exatamente um, reutilizar
        return base.first(), False
    
    else:
        # Encontrou múltiplos (duplicata perfeita)
        # Escolher determinísticamente o registro com menor id
        tipo = base.first()
        ids = list(base.values_list("id", flat=True)[:10])
        logger.warning(
            "TipoInstrumento duplicado. descricao=%r modelo=%r fabricante=%r resolucao=%r "
            "chosen_id=%s ids_sample=%s",
            descricao_n, modelo_n, fabricante_n, resolucao, tipo.id, ids
        )
        return tipo, False


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
        fields = ["id", "nome"]


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

        tipo_de_instrumento, _ = _find_tipo_instrumento_deterministico(
            descricao=descricao,
            modelo=modelo,
            fabricante=fabricante,
            resolucao=resolucao,
        )

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
            tipo_de_instrumento, _ = _find_tipo_instrumento_deterministico(
                descricao=descricao,
                modelo=modelo,
                fabricante=fabricante,
                resolucao=resolucao,
            )

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
    


class TipoInstrumentoSimpleSerializer(serializers.ModelSerializer):
    """Serializer leve para tipo de instrumento - apenas campos essenciais"""
    class Meta:
        model = TipoInstrumento
        fields = ["id", "descricao", "fabricante", "modelo"]


class InstrumentoDoClienteAvailableSerializer(serializers.ModelSerializer):
    """Serializer leve para lista de instrumentos disponíveis"""
    tipo_instrumento = TipoInstrumentoSimpleSerializer(source="instrumento.tipo_de_instrumento", read_only=True)
    tipo_servico = serializers.CharField(source="instrumento.tipo_de_servico", read_only=True)

    class Meta:
        model = InstrumentoDoCliente
        fields = [
            "id",
            "tag",
            "numero_de_serie",
            "tipo_instrumento",
            "tipo_servico",
            "tipo_de_servico",
        ]


class CriterioAceitacaoSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

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
    maior_erro = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    incerteza = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    criterio = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    resultados = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
    )
    
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
            'resultados',
        )

    def _decimal_from_input(self, value, field_name):
        if value in (None, ""):
            return Decimal("0")

        try:
            return Decimal(str(value).strip())
        except (InvalidOperation, ValueError, AttributeError):
            raise serializers.ValidationError({
                field_name: "Informe um valor decimal válido."
            })

    def _get_criterio(self, criterio_id, instrumento=None, index=None):
        if not criterio_id:
            return None

        criterio = CriterioAceitacao.objects.filter(id=criterio_id).first()
        field = "criterio" if index is None else f"resultados[{index}].criterio"
        if not criterio:
            raise serializers.ValidationError({field: "Critério de aceitação não encontrado."})

        if instrumento and criterio.instrumento_id != instrumento.id:
            raise serializers.ValidationError({
                field: "Critério de aceitação não pertence ao instrumento da calibração."
            })

        return criterio

    def _resultado_status(self, maior_erro, incerteza, criterio_aceitacao):
        return (
            CalibracaoStatus.APROVADO
            if abs(maior_erro) + abs(incerteza) <= criterio_aceitacao
            else CalibracaoStatus.REPROVADO
        )

    def _normalizar_resultados(
        self,
        resultados_data,
        criterio_data,
        maior_erro_data,
        incerteza_data,
        instrumento,
        calibracao=None,
    ):
        legacy_payload = resultados_data is None
        if resultados_data is None:
            if not criterio_data and maior_erro_data in (None, "") and incerteza_data in (None, ""):
                return []
            resultados_data = [{
                "criterio": criterio_data,
                "maior_erro": maior_erro_data,
                "incerteza": incerteza_data,
            }]

        resultados = []
        criterios_vistos = set()

        for index, resultado_data in enumerate(resultados_data):
            resultado_id = resultado_data.get("id")
            criterio_id = resultado_data.get("criterio")
            maior_erro_data = resultado_data.get("maior_erro")
            incerteza_data = resultado_data.get("incerteza")
            criterio_field = "criterio" if legacy_payload else f"resultados[{index}].criterio"
            maior_erro_field = "maior_erro" if legacy_payload else f"resultados[{index}].maior_erro"
            incerteza_field = "incerteza" if legacy_payload else f"resultados[{index}].incerteza"

            if not criterio_id:
                raise serializers.ValidationError({criterio_field: "Informe o critério de aceitação."})
            if maior_erro_data in (None, ""):
                raise serializers.ValidationError({maior_erro_field: "Informe o maior erro."})
            if incerteza_data in (None, ""):
                incerteza_data = "0"

            criterio = self._get_criterio(
                criterio_id,
                instrumento=instrumento,
                index=None if legacy_payload else index,
            )
            if criterio.id in criterios_vistos:
                raise serializers.ValidationError({
                    "resultados": "Não é permitido repetir o mesmo critério na calibração."
                })
            criterios_vistos.add(criterio.id)

            if resultado_id and calibracao:
                resultado_existe = calibracao.resultados.filter(id=resultado_id).exists()
                if not resultado_existe:
                    raise serializers.ValidationError({
                        f"resultados[{index}].id": "Resultado de calibração não pertence a esta calibração."
                    })

            maior_erro = self._decimal_from_input(
                maior_erro_data,
                maior_erro_field,
            )
            incerteza = self._decimal_from_input(
                incerteza_data,
                incerteza_field,
            )
            status = self._resultado_status(
                maior_erro,
                incerteza,
                criterio.criterio_de_aceitacao,
            )
            resultados.append({
                "id": resultado_id,
                "criterio": criterio,
                "maior_erro": maior_erro,
                "incerteza": incerteza,
                "status": status,
            })

        return resultados

    def _criar_resultados(self, calibracao, resultados):
        for resultado in resultados:
            resultado = dict(resultado)
            resultado.pop("id", None)
            ResultadoCalibracao.objects.create(
                calibracao=calibracao,
                **resultado,
            )

    def _atualizar_resultados_incrementalmente(self, calibracao, resultados):
        for resultado_data in resultados:
            resultado_data = dict(resultado_data)
            resultado_id = resultado_data.pop("id", None)

            if resultado_id:
                resultado = calibracao.resultados.get(id=resultado_id)
            else:
                resultado = calibracao.resultados.filter(
                    criterio=resultado_data["criterio"]
                ).first()

            if resultado:
                for attr, value in resultado_data.items():
                    setattr(resultado, attr, value)
                resultado.save()
                continue

            ResultadoCalibracao.objects.create(
                calibracao=calibracao,
                **resultado_data,
            )

    @transaction.atomic
    def create(self, validated_data):
        criterio_data = validated_data.pop('criterio', None)
        maior_erro_data = validated_data.pop('maior_erro', None)
        incerteza_data = validated_data.pop('incerteza', None)
        resultados_data = validated_data.pop('resultados', None)
        instrumento = validated_data.get("instrumento")
        resultados = self._normalizar_resultados(
            resultados_data,
            criterio_data,
            maior_erro_data,
            incerteza_data,
            instrumento,
        )
        calibracao = Calibracao.objects.create(**validated_data)
        self._criar_resultados(calibracao, resultados)
        return calibracao
    
    @transaction.atomic
    def update(self, instance, validated_data):
        criterio_data = validated_data.pop('criterio', None)
        maior_erro_data = validated_data.pop('maior_erro', serializers.empty)
        incerteza_data = validated_data.pop('incerteza', serializers.empty)
        resultados_data = validated_data.pop('resultados', serializers.empty)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if resultados_data is not serializers.empty:
            resultados = self._normalizar_resultados(
                resultados_data,
                None,
                None,
                None,
                instance.instrumento,
                calibracao=instance,
            )
            self._atualizar_resultados_incrementalmente(instance, resultados)
            return instance

        criterio = self._get_criterio(criterio_data, instrumento=instance.instrumento)
        maior_erro_recebido = maior_erro_data is not serializers.empty
        incerteza_recebida = incerteza_data is not serializers.empty
        resultado_atual = instance.resultados.first()
        maior_erro = (
            self._decimal_from_input(maior_erro_data, 'maior_erro')
            if maior_erro_recebido
            else (resultado_atual.maior_erro if resultado_atual and resultado_atual.maior_erro is not None else Decimal("0"))
        )
        incerteza = (
            self._decimal_from_input(incerteza_data, 'incerteza')
            if incerteza_recebida
            else (resultado_atual.incerteza if resultado_atual and resultado_atual.incerteza is not None else Decimal("0"))
        )

        if (maior_erro_recebido or incerteza_recebida) and criterio is not None:
            status = self._resultado_status(
                maior_erro,
                incerteza,
                criterio.criterio_de_aceitacao,
            )

            resultado = instance.resultados.filter(criterio=criterio).first()
            if not resultado:
                resultado = instance.resultados.first()

            if resultado:
                resultado.criterio = criterio
                resultado.maior_erro = maior_erro
                resultado.incerteza = incerteza
                resultado.status = status
                resultado.save()
            else:
                ResultadoCalibracao.objects.create(
                    calibracao=instance,
                    criterio=criterio,
                    maior_erro=maior_erro,
                    incerteza=incerteza,
                    status=status,
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
            "observacao",
            "historico_setores",
            "data_criacao",
            "preco_alternativo_calibracao",
            "criterio_frequencia",
            "checagens",
            "tipo_de_servico",
        )

    def get_checagens(self, obj):
        # Usar list comprehension ao invés de .filter() quando prefetch_related foi usado
        # Isso evita problemas com querysets pré-carregados
        return [cal.id for cal in obj.calibracoes.all() if cal.checagem is True]
    
    def get_calibracoes(self, obj):
        # Usar list comprehension ao invés de .filter() quando prefetch_related foi usado
        # Isso evita problemas com querysets pré-carregados
        return [cal.id for cal in obj.calibracoes.all() if cal.checagem is False]

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
        child=serializers.JSONField(), required=False, write_only=True
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
            "numero_certificado",
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

        atualizar_relacionamentos_instrumento(
            instrumento,
            normativos_nomes=normativos_nomes,
            pontos_data=pontos_data,
            criterios_data=criterios_data,
        )
        return instrumento

    def _preservar_datas_ultimas(self, instance, validated_data, freq_calibracao_data, freq_checagem_data):
        """Preserva as datas da última calibração/checagem se existirem calibrações reais."""
        data_ultima_calibracao_from_front = validated_data.pop('data_ultima_calibracao', None)
        data_ultima_checagem_from_front = validated_data.pop('data_ultima_checagem', None)

        if freq_calibracao_data or freq_checagem_data:
            ultima_calibracao = instance.calibracoes.filter(checagem=False).order_by('-data').first()
            if ultima_calibracao and ultima_calibracao.data:
                validated_data['data_ultima_calibracao'] = ultima_calibracao.data
                instance.data_ultima_calibracao = ultima_calibracao.data
            elif data_ultima_calibracao_from_front is not None:
                validated_data['data_ultima_calibracao'] = data_ultima_calibracao_from_front
            elif instance.data_ultima_calibracao:
                validated_data['data_ultima_calibracao'] = instance.data_ultima_calibracao

            ultima_checagem = instance.calibracoes.filter(checagem=True).order_by('-data').first()
            if ultima_checagem and ultima_checagem.data:
                validated_data['data_ultima_checagem'] = ultima_checagem.data
                instance.data_ultima_checagem = ultima_checagem.data
            elif data_ultima_checagem_from_front is not None:
                validated_data['data_ultima_checagem'] = data_ultima_checagem_from_front
            elif instance.data_ultima_checagem:
                validated_data['data_ultima_checagem'] = instance.data_ultima_checagem
        else:
            if data_ultima_calibracao_from_front is not None:
                validated_data['data_ultima_calibracao'] = data_ultima_calibracao_from_front
            if data_ultima_checagem_from_front is not None:
                validated_data['data_ultima_checagem'] = data_ultima_checagem_from_front

    def _atualizar_frequencia(self, instance, frequencia_atual, frequencia_data, campo_frequencia):
        """Atualiza a frequência e retorna True se mudou."""
        if not frequencia_data:
            return False

        if frequencia_atual:
            for attr, value in frequencia_data.items():
                setattr(frequencia_atual, attr, value)
            frequencia_atual.save()
            frequencia_atual.refresh_from_db()
            return True

        nova_frequencia = Frequencia.objects.create(**frequencia_data)
        setattr(instance, campo_frequencia, nova_frequencia)
        return True

    def _recalcular_data_proxima(self, instance, tipo='calibracao'):
        """Recalcula a data da próxima calibração ou checagem baseado no critério."""
        if tipo == 'calibracao':
            frequencia = instance.frequencia_calibracao
            data_ultima = instance.data_ultima_calibracao
            calcular_servico = calcular_data_proxima_calibracao_servico
            calcular_calendario = calcular_data_proxima_calibracao_calendario
            campo_proxima = 'data_proxima_calibracao'
        else:
            frequencia = instance.frequencia_checagem
            data_ultima = instance.data_ultima_checagem
            calcular_servico = calcular_data_proxima_checagem_servico
            calcular_calendario = calcular_data_proxima_checagem_calendario
            campo_proxima = 'data_proxima_checagem'

        if not frequencia:
            setattr(instance, campo_proxima, None)
            return

        criterio = instance.criterio_frequencia or instance.cliente.criterio_frequencia_padrao
        posicao_uso = instance.Posicao.EM_USO
        criterio_servico = CriterioFrequencia.SERVICO

        if criterio == criterio_servico and instance.posicao == posicao_uso:
            setattr(instance, campo_proxima, calcular_servico(instance, criado=False))
        elif criterio != criterio_servico:
            if data_ultima:
                setattr(instance, campo_proxima, calcular_calendario(instance))
            else:
                setattr(instance, campo_proxima, None)
        else:
            setattr(instance, campo_proxima, None)

    def update(self, instance, validated_data):
        freq_checagem_data = validated_data.pop('frequencia_checagem', None)
        freq_calibracao_data = validated_data.pop('frequencia_calibracao', None)
        normativos_nomes = validated_data.pop('normativos', [])
        pontos_data = validated_data.pop('pontos_de_calibracao', None)
        criterios_data = validated_data.pop('criterios_aceitacao', None)
        setor = validated_data.pop('setor', serializers.empty)
        data_ultima_calibracao_original = instance.data_ultima_calibracao
        data_ultima_checagem_original = instance.data_ultima_checagem
        
        self._preservar_datas_ultimas(instance, validated_data, freq_calibracao_data, freq_checagem_data)
        
        user = None
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            user = request.user
        
        old_posicao = instance.posicao
        new_posicao = validated_data.get('posicao', None)
        
        if setor is not serializers.empty:
            setor_anterior = instance.setor
            setor_anterior_id = setor_anterior.id if setor_anterior else None
            novo_setor = setor
            novo_setor_id = novo_setor.id if novo_setor else None

            if novo_setor_id != setor_anterior_id:
                MovimentacaoSetorInstrumento.objects.create(
                    instrumento=instance,
                    antigo_setor=setor_anterior.nome if setor_anterior else '',
                    novo_setor=novo_setor.nome if novo_setor else '',
                    usuario_alteracao=user
                )
                instance.setor = novo_setor
        
        frequencia_calibracao_mudou = self._atualizar_frequencia(
            instance, instance.frequencia_calibracao, freq_calibracao_data, 'frequencia_calibracao'
        )
        frequencia_checagem_mudou = self._atualizar_frequencia(
            instance, instance.frequencia_checagem, freq_checagem_data, 'frequencia_checagem'
        )
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        data_ultima_calibracao_mudou = data_ultima_calibracao_original != instance.data_ultima_calibracao
        data_ultima_checagem_mudou = data_ultima_checagem_original != instance.data_ultima_checagem
        
        if frequencia_calibracao_mudou or data_ultima_calibracao_mudou:
            self._recalcular_data_proxima(instance, tipo='calibracao')
        
        if frequencia_checagem_mudou or data_ultima_checagem_mudou:
            self._recalcular_data_proxima(instance, tipo='checagem')
        
        if new_posicao and new_posicao != old_posicao:
            MovimentacaoInstrumento.objects.create(
                instrumento=instance,
                nova_posicao=new_posicao,
                antiga_posicao=old_posicao,
                usuario_alteracao=user,
            )
        
        if frequencia_calibracao_mudou and instance.frequencia_calibracao:
            instance.frequencia_calibracao_id = instance.frequencia_calibracao.id
        
        if frequencia_checagem_mudou and instance.frequencia_checagem:
            instance.frequencia_checagem_id = instance.frequencia_checagem.id
        
        instance.save()
        
        atualizar_relacionamentos_instrumento(
            instance,
            normativos_nomes=normativos_nomes,
            pontos_data=pontos_data,
            criterios_data=criterios_data,
        )
        
        return instance

class InstrumentoDoClienteWriteAdminSerializer(serializers.ModelSerializer):
    procedimento_relacionado = serializers.CharField(
        required=False, allow_null=True, allow_blank=True
    )
    pontos_de_calibracao = serializers.ListField(
        child=serializers.JSONField(), required=False, write_only=True
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
            "numero_certificado",
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

        if setor_path:
            validated_data['setor'] = get_or_create_setor_from_path(
                setor_path,
                validated_data['cliente'],
            )

        instrumento = InstrumentoDoCliente.objects.create(**validated_data)

        MovimentacaoInstrumento.objects.create(
            instrumento=instrumento,
            nova_posicao=validated_data.pop('posicao', None),
            usuario_alteracao=self.context.get('request').user,
        )

        atualizar_relacionamentos_instrumento(
            instrumento,
            normativos_nomes=normativos_nomes,
            pontos_data=pontos_data,
            criterios_data=criterios_data,
        )
        return instrumento

    def _preservar_datas_ultimas(self, instance, validated_data, freq_calibracao_data, freq_checagem_data):
        """Preserva as datas da última calibração/checagem se existirem calibrações reais."""
        data_ultima_calibracao_from_front = validated_data.pop('data_ultima_calibracao', None)
        data_ultima_checagem_from_front = validated_data.pop('data_ultima_checagem', None)
        
        if freq_calibracao_data or freq_checagem_data:
            ultima_calibracao = instance.calibracoes.filter(checagem=False).order_by('-data').first()
            if ultima_calibracao and ultima_calibracao.data:
                validated_data['data_ultima_calibracao'] = ultima_calibracao.data
                instance.data_ultima_calibracao = ultima_calibracao.data
            elif data_ultima_calibracao_from_front is not None:
                validated_data['data_ultima_calibracao'] = data_ultima_calibracao_from_front
            elif instance.data_ultima_calibracao:
                validated_data['data_ultima_calibracao'] = instance.data_ultima_calibracao
            
            ultima_checagem = instance.calibracoes.filter(checagem=True).order_by('-data').first()
            if ultima_checagem and ultima_checagem.data:
                validated_data['data_ultima_checagem'] = ultima_checagem.data
                instance.data_ultima_checagem = ultima_checagem.data
            elif data_ultima_checagem_from_front is not None:
                validated_data['data_ultima_checagem'] = data_ultima_checagem_from_front
            elif instance.data_ultima_checagem:
                validated_data['data_ultima_checagem'] = instance.data_ultima_checagem
        else:
            if data_ultima_calibracao_from_front is not None:
                validated_data['data_ultima_calibracao'] = data_ultima_calibracao_from_front
            if data_ultima_checagem_from_front is not None:
                validated_data['data_ultima_checagem'] = data_ultima_checagem_from_front

    def _atualizar_frequencia(self, instance, frequencia_atual, frequencia_data, campo_frequencia):
        """Atualiza a frequência e retorna True se mudou."""
        if not frequencia_data:
            return False
        
        if frequencia_atual:
            for attr, value in frequencia_data.items():
                setattr(frequencia_atual, attr, value)
            frequencia_atual.save()
            frequencia_atual.refresh_from_db()
            return True
        else:
            nova_frequencia = Frequencia.objects.create(**frequencia_data)
            setattr(instance, campo_frequencia, nova_frequencia)
            return True

    def _recalcular_data_proxima(self, instance, tipo='calibracao'):
        """Recalcula a data da próxima calibração ou checagem baseado no critério."""
        if tipo == 'calibracao':
            frequencia = instance.frequencia_calibracao
            data_ultima = instance.data_ultima_calibracao
            calcular_servico = calcular_data_proxima_calibracao_servico
            calcular_calendario = calcular_data_proxima_calibracao_calendario
            campo_proxima = 'data_proxima_calibracao'
        else:
            frequencia = instance.frequencia_checagem
            data_ultima = instance.data_ultima_checagem
            calcular_servico = calcular_data_proxima_checagem_servico
            calcular_calendario = calcular_data_proxima_checagem_calendario
            campo_proxima = 'data_proxima_checagem'
        
        if not frequencia:
            setattr(instance, campo_proxima, None)
            return
        
        criterio = instance.criterio_frequencia or instance.cliente.criterio_frequencia_padrao
        posicao_uso = instance.Posicao.EM_USO
        criterio_servico = CriterioFrequencia.SERVICO
        
        if criterio == criterio_servico and instance.posicao == posicao_uso:
            setattr(instance, campo_proxima, calcular_servico(instance, criado=False))
        elif criterio != criterio_servico:
            if data_ultima:
                setattr(instance, campo_proxima, calcular_calendario(instance))
            else:
                setattr(instance, campo_proxima, None)
        else:
            setattr(instance, campo_proxima, None)

    def update(self, instance, validated_data):
        freq_checagem_data = validated_data.pop('frequencia_checagem', None)
        freq_calibracao_data = validated_data.pop('frequencia_calibracao', None)
        normativos_nomes = validated_data.pop('normativos', [])
        pontos_data = validated_data.pop('pontos_de_calibracao', None)
        criterios_data = validated_data.pop('criterios_aceitacao', None)
        setor = validated_data.pop('setor', serializers.empty)
        data_ultima_calibracao_original = instance.data_ultima_calibracao
        data_ultima_checagem_original = instance.data_ultima_checagem
        
        self._preservar_datas_ultimas(instance, validated_data, freq_calibracao_data, freq_checagem_data)
        
        user = None
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            user = request.user
        
        old_posicao = instance.posicao
        new_posicao = validated_data.get('posicao', None)
        
        if setor is not serializers.empty:
            if isinstance(setor, str):
                setor = get_or_create_setor_from_path(setor, instance.cliente)

            setor_anterior = instance.setor
            setor_anterior_id = setor_anterior.id if setor_anterior else None
            novo_setor = setor
            novo_setor_id = novo_setor.id if novo_setor else None

            if novo_setor_id != setor_anterior_id:
                MovimentacaoSetorInstrumento.objects.create(
                    instrumento=instance,
                    novo_setor=novo_setor.nome if novo_setor else '',
                    antigo_setor=setor_anterior.nome if setor_anterior else '',
                    usuario_alteracao=user,
                )
                instance.setor = novo_setor
        
        frequencia_calibracao_mudou = self._atualizar_frequencia(
            instance, instance.frequencia_calibracao, freq_calibracao_data, 'frequencia_calibracao'
        )
        frequencia_checagem_mudou = self._atualizar_frequencia(
            instance, instance.frequencia_checagem, freq_checagem_data, 'frequencia_checagem'
        )
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        data_ultima_calibracao_mudou = data_ultima_calibracao_original != instance.data_ultima_calibracao
        data_ultima_checagem_mudou = data_ultima_checagem_original != instance.data_ultima_checagem
        
        if frequencia_calibracao_mudou or data_ultima_calibracao_mudou:
            self._recalcular_data_proxima(instance, tipo='calibracao')
        
        if frequencia_checagem_mudou or data_ultima_checagem_mudou:
            self._recalcular_data_proxima(instance, tipo='checagem')
        
        if new_posicao and new_posicao != old_posicao:
            MovimentacaoInstrumento.objects.create(
                instrumento=instance,
                nova_posicao=new_posicao,
                antiga_posicao=old_posicao,
                usuario_alteracao=user,
            )
        
        if frequencia_calibracao_mudou and instance.frequencia_calibracao:
            instance.frequencia_calibracao_id = instance.frequencia_calibracao.id
        
        if frequencia_checagem_mudou and instance.frequencia_checagem:
            instance.frequencia_checagem_id = instance.frequencia_checagem.id
        
        instance.save()
        
        atualizar_relacionamentos_instrumento(
            instance,
            normativos_nomes=normativos_nomes,
            pontos_data=pontos_data,
            criterios_data=criterios_data,
        )
        
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
    nome = serializers.CharField(allow_blank=True)
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

    def validate(self, attrs):
        nome = attrs.get("nome", getattr(self.instance, "nome", None))
        cliente = attrs.get("cliente", getattr(self.instance, "cliente", None))
        setor_pai = attrs.get("setor_pai", getattr(self.instance, "setor_pai", None))

        if not nome or not cliente:
            return attrs

        nome = str(nome).strip()
        if not nome:
            return attrs
        if "nome" in attrs:
            attrs["nome"] = nome

        duplicados = Setor.objects.filter(
            nome=nome,
            cliente=cliente,
            setor_pai=setor_pai,
        )
        if self.instance:
            duplicados = duplicados.exclude(id=self.instance.id)

        if duplicados.exists():
            raise serializers.ValidationError({
                "nome": "Já existe um setor com este nome para este cliente."
            })

        return attrs

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
            "expirado",
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
