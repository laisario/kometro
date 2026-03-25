from decimal import Decimal, InvalidOperation
from django.contrib import admin
from django.forms import ModelChoiceField
from import_export.admin import ImportMixin
from import_export.fields import Field
from import_export.forms import ConfirmImportForm, ImportForm
from import_export.resources import ModelResource, Resource
from import_export.tmp_storages import MediaStorage
from import_export.widgets import (
    CharWidget,
    DateWidget,
    DecimalWidget,
    ForeignKeyWidget,
    IntegerWidget,
    FloatWidget,
    Widget
)
from procedimentos.models import Procedimento
from clientes.models import Cliente
from .models import (
    Calibracao,
    CalibracaoStatus,
    CapacidadeMedicao,
    Instrumento,
    InstrumentoDoCliente,
    InstrumentoBaseCliente,
    TipoInstrumento,
    PontoDeCalibracao,
    Certificado,
    Anexo,
    Setor,
    Normativo,
    Frequencia,
    CriterioAceitacao,
    ResultadoCalibracao,
    MovimentacaoInstrumento,
    MovimentacaoSetorInstrumento,
)
from tablib import Dataset


def extract_number(string):
    if not string:
        return None
    chunks = string.split(" ")
    for chunk in chunks:
        try:
            return float(Decimal(chunk))
        except InvalidOperation:
            continue


class PontoDeCalibracaoAdmin(admin.StackedInline):
    model = PontoDeCalibracao


class AnexoAdmin(admin.StackedInline):
    model = Anexo


@admin.register(Certificado)
class CertificadoAdmin(admin.ModelAdmin):
    model = Certificado
    inlines = [AnexoAdmin]
    fields = ("numero", "arquivo", "calibracao")


@admin.register(Calibracao)
class CalibracaoAdmin(admin.ModelAdmin):
    list_display = ("id", "instrumento",)
    fieldsets = [
        (
            None,
            {
                "fields": [
                    "instrumento",
                    "local",
                    "data",
                    "ordem_de_servico",
                    "observacoes",
                    "laboratorio",
                    "preco",
                    "observacao_fornecedor"
                ],
            },
        ),
        (
            "Análise cliente",
            {"fields": ["analise_critica", "restricao_analise_critica"]},
        ),
    ]


class ExtractDecimalWidget(DecimalWidget):
    def clean(self, value, row=None, **kwargs):
        value = extract_number(value)
        return super().clean(value, row, **kwargs)


class InstrumentoExportResource(ModelResource):
    tag = Field(column_name="TAG", attribute="tag", widget=CharWidget())
    numero_de_serie = Field(column_name="Nº Série", attribute="numero_de_serie", widget=CharWidget())
    laboratorio = Field(column_name="Laboratório", attribute="laboratorio", widget=CharWidget())
    posicao = Field(column_name="Status", attribute="get_posicao_display", widget=CharWidget())
    instrumento = Field(column_name="Instrumento", attribute="instrumento", widget=ForeignKeyWidget(Instrumento, "id"))
    setor = Field(column_name="Setor", attribute="setor__nome", widget=CharWidget())
    frequencia_calibracao = Field(column_name="Frequência de Calibração")
    frequencia_checagem = Field(column_name="Frequência de Checagem")
    data_proxima_checagem = Field(column_name="Próxima checagem", attribute="data_proxima_checagem", widget=DateWidget(format="%d/%m/%Y"))
    data_ultima_checagem = Field(column_name="Última checagem", attribute="data_ultima_checagem", widget=DateWidget(format="%d/%m/%Y"))
    data_proxima_calibracao = Field(column_name="Próxima calibração", attribute="data_proxima_calibracao", widget=DateWidget(format="%d/%m/%Y"))
    data_ultima_calibracao = Field(column_name="Última calibração", attribute="data_ultima_calibracao", widget=DateWidget(format="%d/%m/%Y"))
    normativos = Field(column_name="Normativos", attribute="normativos", widget=CharWidget())
    
    def __init__(self, campos_selecionados):
        self.campos_selecionados = campos_selecionados
        super()

    class Meta:
        model = InstrumentoDoCliente
        fields = (
            "tag",
            "numero_de_serie",
            "posicao",
            "data_ultima_calibracao",
            "data_proxima_calibracao",
            "data_ultima_checagem",
            "data_proxima_checagem",
            "frequencia_calibracao",
            "frequencia_checagem",
            "setor",
            "instrumento",
            "laboratorio",
            "normativos"
        )

    def dehydrate_normativos(self, obj):
        normas = obj.normativos.all()
        if normas:
            lista = [str(norma.nome) for norma in normas]
            return ", ".join(lista) + "."
        return ""

    def dehydrate_frequencia_calibracao(self, obj):
        freq = obj.frequencia_calibracao
        if freq:
            return f"{freq.quantidade} {freq.periodo}"
        return ""
    
    def dehydrate_frequencia_checagem(self, obj):
        freq = obj.frequencia_checagem
        if freq:
            return f"{freq.quantidade} {freq.periodo}"
        return ""

    def after_export(self, queryset, dataset, **kwargs):
        column_names = {
            "TAG": "tag",
            "Nº Série": "numeroDeSerie",
            "Laboratório": "laboratorio",
            "Status": "posicaoDoInstrumento",
            "Última calibração": "dataUltimaCalibracao",
            "Última checagem": "dataUltimaChecagem",
            "Frequência de Calibração": "frequenciaDeCalibracao",
            "Frequência de Checagem": "frequenciaDeChecagem",
            "Próxima calibração": "dataDaProximaCalibracao",
            "Próxima checagem": "dataDaProximaChecagem",
            "Instrumento": "instrumento",
            "Setor": "setor",
            "Normativos": "normativos",
        }

        all_keys = dataset.dict[0].keys() if dataset.dict else []
        for key in list(all_keys):
            if column_names.get(key) not in self.campos_selecionados:
                del dataset[key]

        return dataset
    

class RelatorioMovimentacoesResource(Resource):
    def export(self, instrumento_id=None, *args, **kwargs):
        dataset = Dataset()
        dataset.headers = [
            "movimentacao",
            "data alteracao",
            "usuario",
            "alteracao"
        ]

        posicao = {
            "U": "Em uso",
            "E": "Em estoque",
            "I": "Inativo",
            "F": "Fora de uso",
            "C": "Em calibração"
        }
        

        if not instrumento_id:
            return dataset

        for mov in MovimentacaoInstrumento.objects.filter(instrumento_id=instrumento_id):
            antiga_posicao = posicao.get(mov.antiga_posicao, '-') if mov.antiga_posicao else '-'
            nova_posicao = posicao.get(mov.nova_posicao, '-') if mov.nova_posicao else '-'
            dataset.append((
                "Posição",
                mov.data_alteracao.strftime("%d/%m/%Y %H:%M"),
                str(mov.usuario_alteracao) if mov.usuario_alteracao else "-",
                f"{antiga_posicao} → {nova_posicao}"
            ))

        for mov in MovimentacaoSetorInstrumento.objects.filter(instrumento_id=instrumento_id):
            dataset.append((
                "Setor",
                mov.data_alteracao.strftime("%d/%m/%Y %H:%M"),
                str(mov.usuario_alteracao) if mov.usuario_alteracao else "-",
                f"{mov.antigo_setor or '-'} → {mov.novo_setor}"
            ))
        
        return dataset


class SafeDateWidget(DateWidget):
    def clean(self, value, row=None, *args, **kwargs):
        if value in (None, "", " "):
            return None
        return super().clean(value, row, *args, **kwargs)


class FrequenciaWidget(Widget):
    def __init__(self, quantidade_col, periodo_col):
        self.quantidade_col = quantidade_col
        self.periodo_col = periodo_col

    def clean(self, value, row=None, *args, **kwargs):
        quantidade = row.get(self.quantidade_col)
        periodo = row.get(self.periodo_col)

        if quantidade is None or periodo is None:
            return None
        
        obj = Frequencia.objects.filter(
            quantidade=int(quantidade),
            periodo=periodo
        ).first()
        
        if obj is None:
            obj = Frequencia.objects.create(
                quantidade=int(quantidade),
                periodo=periodo
            )
        
        return obj

    def render(self, value, obj=None):
        if value:
            return f"{value.quantidade} {value.periodo}"
        return ""
    

class InstrumentoResource(ModelResource):
    tag = Field(
        column_name="identificacao (tag)",
        attribute="tag",
        widget=CharWidget(),
        saves_null_values=True,
    )
    descricao = Field(
        column_name="descricao",
        attribute="descricao",
        widget=CharWidget(),
        saves_null_values=True,
    )
    laboratorio = Field(
        column_name="laboratorio de referencia",
        attribute="laboratorio",
        widget=CharWidget(),
        saves_null_values=True,
    )
    fabricante = Field(
        column_name="fabricante", attribute="fabricante", widget=CharWidget()
    )
    modelo = Field(column_name="modelo", attribute="modelo", widget=CharWidget())
    numero_de_serie = Field(
        column_name="n serie",
        attribute="numero_de_serie",
        widget=CharWidget(),
        saves_null_values=True,
    )
    resolucao = Field(
        column_name="resolucao", attribute="resolucao", widget=DecimalWidget()
    )
    unidade = Field(column_name="unidade", attribute="unidade", widget=CharWidget())
    maximo = Field(
        column_name="faixa nominal maxima", attribute="maximo", widget=DecimalWidget()
    )
    minimo = Field(
        column_name="faixa nominal minima", attribute="minimo", widget=DecimalWidget()
    )
    preco_calibracao_no_laboratorio = Field(
        column_name="valor calibracao no laboratorio",
        attribute="preco_calibracao_no_laboratorio",
        widget=DecimalWidget(),
    )
    preco_calibracao_no_cliente = Field(
        column_name="valor calibracao no cliente",
        attribute="preco_calibracao_no_cliente",
        widget=DecimalWidget(),
    )
    data = Field(
        column_name="data",
        attribute="data",
        widget=SafeDateWidget(),
        saves_null_values=True,
    )
    posicao = Field(
        column_name="status",
        attribute="posicao",
        widget=CharWidget(),
        saves_null_values=True,
    )
    data_utilizacao = Field(
        column_name="data utilizacao",
        attribute="data_utilizacao",
        widget=DateWidget(),
        saves_null_values=True,
    )
    frequencia_calibracao = Field(
        column_name="frequencia calibracao quantidade",
        attribute="frequencia_calibracao",
        widget=FrequenciaWidget(
            quantidade_col="frequencia calibracao quantidade",
            periodo_col="frequencia calibracao periodo"
        ),
        saves_null_values=True,
    )
    frequencia_checagem = Field(
        column_name="frequencia checagem quantidade",
        attribute="frequencia_checagem",
        widget=FrequenciaWidget(
            quantidade_col="frequencia checagem quantidade",
            periodo_col="frequencia checagem periodo"
        ),
        saves_null_values=True,
    )
    criterio_de_aceitacao = Field(
        column_name="criterio de aceitacao",
        attribute="criterio_de_aceitacao",
        widget=DecimalWidget(),
        saves_null_values=True,
    )
    referencia_do_criterio = Field(
        column_name="referencia do criterio de aceitacao",
        attribute="referencia_do_criterio",
        widget=CharWidget(),
        saves_null_values=True,
    )
    maior_erro = Field(
        column_name="erro",
        attribute="maior_erro",
        widget=DecimalWidget(),
        saves_null_values=True,
    )
    status = Field(
        column_name="resultado",
        attribute="resultado",
        widget=CharWidget(),
        saves_null_values=True,
    )
    data_ultima_calibracao = Field(
        column_name="data da ultima calibracao",
        attribute="data_ultima_calibracao",
        widget=DateWidget(),
        saves_null_values=True,
    )
    data_ultima_checagem = Field(
        column_name="data da ultima checagem",
        attribute="data_ultima_checagem",
        widget=DateWidget(),
        saves_null_values=True,
    )
    observacoes = Field(
        column_name="observacoes adicionais",
        attribute="observacoes",
        widget=CharWidget(),
        saves_null_values=True,
    )
    ordem_de_servico = Field(
        column_name="ordem de servico (calibracao)",
        attribute="ordem_de_servico",
        widget=CharWidget(),
        saves_null_values=True,
    )
    local = Field(
        column_name="local",
        attribute="local",
        widget=CharWidget(),
        saves_null_values=True,
    )
    tipo_de_servico = Field(
        column_name="tipo de servico",
        attribute="tipo_de_servico",
        widget=CharWidget(),
        saves_null_values=True,
    )
    capacidade_de_medicao = Field(
        column_name="capacidade de medicao",
        attribute="capacidade_de_medicao",
        widget=FloatWidget(),
        saves_null_values=True,
    )
    capacidade_de_medicao_unidade = Field(
        column_name="capacidade de medicao unidade",
        attribute="capacidade_de_medicao",
        widget=CharWidget(),
        saves_null_values=True,
    )
    procedimento_relacionado = Field(
        column_name="procedimento relacionado",
        attribute="procedimento_relacionado",
        widget=CharWidget(),
        saves_null_values=True,
    )
    dias_uteis = Field(
        column_name="Dias úteis",
        attribute="dias_uteis",
        widget=IntegerWidget(),
        saves_null_values=True,
    )
    dias_uteis = Field(
        column_name="data utilizacao",
        attribute="data_utilizacao",
        widget=DateWidget(),
        saves_null_values=True,
    )
    instrumento = Field(
        column_name="instrumento",
        attribute="instrumento",
        widget=ForeignKeyWidget(Instrumento),
        saves_null_values=True,
    )
    cliente = Field(
        column_name="cliente",
        attribute="cliente",
        widget=ForeignKeyWidget(Cliente),
        saves_null_values=True,
    )
    setor = Field(
        column_name="setor", 
        attribute="setor", 
        widget=CharWidget()
    )
    sinal = Field(
        column_name="sinal",
        attribute="tipo_sinal",
        widget=CharWidget(),
        saves_null_values=True,
    )
    checagem = Field(
        column_name="checagem",
        attribute="checagem",
        widget=CharWidget(),
        saves_null_values=True,
    )

    def __init__(self, cliente=None):
        super()
        self.cliente = cliente

    def before_import_row(self, row, *args, **kwargs):
        faixa_nominal_max = row["faixa nominal maxima"]
        faixa_nominal_min = row["faixa nominal minima"]
        preco_calibracao_no_laboratorio = row["valor calibracao no laboratorio"]
        preco_calibracao_no_cliente = row["valor calibracao no cliente"]
        tipo_de_servico = row["tipo de servico"]
        capacidade_medicao = row["capacidade de medicao"]
        capacidade_medicao_unidade = row["capacidade de medicao unidade"]
        descricao = row["descricao"]
        modelo = row["modelo"]
        fabricante = row["fabricante"]
        resolucao = row["resolucao"]
        procedimento = row["procedimento relacionado"]
        unidade = row["unidade"]
        sinal = row["sinal"]
        nome_setor = row.get("setor")

        if descricao is not None:
            tipo_instrumento, created = TipoInstrumento.objects.get_or_create(
                descricao=descricao,
                modelo=modelo,
                fabricante=fabricante,
                resolucao=resolucao,
            )

            instrument_parameters = {
                "maximo": faixa_nominal_max,
                "minimo": faixa_nominal_min,
                "unidade": unidade,
                "preco_calibracao_no_cliente": preco_calibracao_no_cliente,
                "preco_calibracao_no_laboratorio": preco_calibracao_no_laboratorio,
                "tipo_de_instrumento_id": tipo_instrumento.id,
                "tipo_de_servico": tipo_de_servico,
                "tipo_sinal": sinal,
            }

            if capacidade_medicao and capacidade_medicao_unidade is not None:
                (
                    capacidade_de_medicao,
                    created,
                ) = CapacidadeMedicao.objects.get_or_create(
                    valor=capacidade_medicao, unidade=capacidade_medicao_unidade
                )
                instrument_parameters[
                    "capacidade_de_medicao_id"
                ] = capacidade_de_medicao.id

            if procedimento is not None:
                procedimento_relacionado, created = Procedimento.objects.get_or_create(
                    codigo=procedimento
                )
                instrument_parameters[
                    "procedimento_relacionado_id"
                ] = procedimento_relacionado.id

            instrumento, created = Instrumento.objects.get_or_create(
                **instrument_parameters
            )
            nome_setor_stripped = (
                str(nome_setor).strip() if nome_setor is not None else ""
            )
            if nome_setor_stripped:
                setor_data, created = Setor.objects.get_or_create(
                    nome=nome_setor_stripped,
                    cliente=Cliente.objects.filter(id=self.cliente).first()
                )
                row["setor"] = setor_data
            else:
                row["setor"] = None

            row["instrumento"] = instrumento.pk
            row["cliente"] = self.cliente
            

    def after_import_row(self, row, row_result, *args, **kwargs):
        row = {
            key.strip(): value if value not in ["-", ""] else None
            for key, value in row.items()
            if key is not None
        }
        local = row["local"]
        data = row["data"]
        ordem_de_servico = row["ordem de servico (calibracao)"]
        laboratorio = row["laboratorio de referencia"]
        checagem = row["checagem"]
        criterio_calibracao = row['criterio calibracao']

        checagem_valor = str(row.get("checagem") or "").strip().lower()
        if checagem_valor in ["sim", "s", "yes", "y", "true", "1"]:
            checagem = True
        elif checagem_valor in ["não", "nao", "n", "no", "false", "0"]:
            checagem = False
        else:
            checagem = None 

        calibracao, _ = Calibracao.objects.get_or_create(
            instrumento_id=row_result.object_id,
            ordem_de_servico=ordem_de_servico,
            local=local,
            data=data,
            laboratorio=laboratorio,
            checagem=checagem
        )


        for col_name, value in row.items():
            if col_name.lower().startswith("criterio de aceitacao"):
                tipo = col_name.replace("criterio de aceitacao", "").strip(" []")

                if value not in [None, ""]:
                    criterio = CriterioAceitacao.objects.create(
                        instrumento_id=row_result.object_id,
                        tipo=tipo,
                        criterio_de_aceitacao=value,
                        unidade=row.get(f"unidade [{tipo}]"),
                        referencia_do_criterio=row.get(f"referencia [{tipo}]"),
                        observacao_criterio_aceitacao=row.get(f"observacao [{tipo}]"),
                    )

                    erro = row.get(f"erro [{tipo}]")
                    incerteza = row.get(f"incerteza [{tipo}]")

                    erro = Decimal(str(erro)) if erro not in [None, ""] else Decimal("0")
                    incerteza = Decimal(str(incerteza)) if incerteza not in [None, ""] else Decimal("0")
                    criterio_valor = Decimal(str(value))


                    status = (
                        CalibracaoStatus.APROVADO
                        if abs(erro) + abs(incerteza) <= criterio_valor
                        else CalibracaoStatus.REPROVADO
                    )
                    if criterio_calibracao == tipo:
                        ResultadoCalibracao.objects.create(
                            calibracao=calibracao,
                            maior_erro=row.get(f"erro [{tipo}]"),
                            incerteza=row.get(f"incerteza [{tipo}]"),
                            criterio=criterio,
                            status=status
                        )

    class Meta:
        model = InstrumentoDoCliente
        import_id_fields = ("tag",)
        skip_unchanged = True
        report_skipped = True
        use_bulk = False 
        fields = (
            "tag",
            "numero_de_serie",
            "laboratorio",
            "data_ultima_checagem",
            "observacoes",
            "posicao",
            "data_ultima_calibracao",
            "descricao",
            "numero_do_certificado",
            "fabricante",
            "modelo",
            "unidade",
            "maximo",
            "minimo",
            "local",
            "setor",
            "preco_calibracao_no_cliente",
            "preco_calibracao_no_laboratorio",
            "data",
            "criterio_de_aceitacao",
            "referncia_do_criterio",
            "maior_erro",
            "incerteza",
            "status",
            "dias_uteis",
            "cliente_id",
            "frequencia_checagem",
            "frequencia_calibracao",
            "checagem",
            "sinal",
        )
    def before_save_instance(self, instance, using_transactions, dry_run):
        if not instance.criterio_frequencia:
            instance.criterio_frequencia = instance.cliente.criterio_frequencia_padrao



class InstrumentosImportForm(ImportForm):
    cliente = ModelChoiceField(queryset=Cliente.objects.all(), required=True)


class InstrumentosConfirmImportForm(ConfirmImportForm):
    cliente = ModelChoiceField(queryset=Cliente.objects.all(), required=True)


@admin.register(InstrumentoDoCliente)
class InstrumentoDoClienteAdmin(ImportMixin, admin.ModelAdmin):
    resource_classes = [InstrumentoResource]
    import_form_class = InstrumentosImportForm
    confirm_form_class = InstrumentosConfirmImportForm
    tmp_storage_class = MediaStorage
    inlines = [PontoDeCalibracaoAdmin]

    def get_resource_kwargs(self, request, *args, **kwargs):
        rk = super().get_resource_kwargs(request, *args, **kwargs)
        rk["cliente"] = None

        if request.POST:
            cliente = request.POST.get("cliente", None)
            if cliente:
                request.session["cliente"] = cliente
            else:
                try:
                    cliente = request.session["cliente"]
                except KeyError as e:
                    raise Exception(f"Nao conseguimos definir o cliente, erro: {e}")
            rk["cliente"] = cliente
        return rk

    def get_confirm_form_initial(self, request, import_form):
        initial = super().get_confirm_form_initial(request, import_form)
        if import_form:
            initial["cliente"] = import_form.cleaned_data["cliente"]
        return initial

    def get_import_data_kwargs(self, request, *args, **kwargs):
        """
        Return form data as kwargs for import_data.
        """
        form = kwargs.get("form")
        if form:
            return form.cleaned_data
        return {}

    list_display = (
        "id",
        "tag",
        "cliente",
        "instrumento",
        "data_proxima_calibracao",
    )
    readonly_fields = ("data_utilizacao",)


@admin.register(TipoInstrumento)
class TipoInstrumentoAdmin(admin.ModelAdmin):
    list_display = ("descricao", "modelo", "fabricante")
    fieldsets = [
        (
            None,
            {
                "fields": [
                    "descricao",
                    "modelo",
                    "fabricante",
                    "resolucao",
                ],
            },
        ),
    ]


@admin.register(Instrumento)
class InstrumentoAdmin(admin.ModelAdmin):
    list_display = (
        "tipo_de_instrumento",
        "minimo",
        "maximo",
        "tipo_de_servico",
    )
    fieldsets = [
        (
            None,
            {
                "fields": [
                    "minimo",
                    "maximo",
                    "unidade",
                    "tipo_de_servico",
                    "capacidade_de_medicao",
                    "tipo_de_instrumento",
                    "procedimento_relacionado",
                ],
            },
        ),
        (
            "Preços",
            {
                "fields": [
                    "preco_calibracao_no_cliente",
                    "preco_calibracao_no_laboratorio",
                ],
            },
        ),
    ]


@admin.register(CapacidadeMedicao)
class CapacidadeMedicaoAdmin(admin.ModelAdmin):
    list_display = ("valor", "unidade")
    fieldsets = [
        (
            None,
            {
                "fields": [
                    "valor",
                    "unidade",
                ],
            },
        ),
    ]


@admin.register(Setor)
class SetorAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome', 'setor_pai_display', "cliente")
    search_fields = ('nome',)
    list_filter = ('setor_pai',)

    def setor_pai_display(self, obj):
        return obj.setor_pai.nome if obj.setor_pai else '—'
    setor_pai_display.short_description = 'Setor Pai'


@admin.register(Normativo)
class NormativoAdmin(admin.ModelAdmin):
    list_display = ['nome']
    search_fields = ['nome']


@admin.register(InstrumentoBaseCliente)
class InstrumentoBaseClienteAdmin(admin.ModelAdmin):
    list_display = ['cliente', 'instrumento', 'ativo', 'data_criacao']
    list_filter = ['ativo', 'data_criacao', 'cliente']
    search_fields = ['cliente__empresa__razao_social', 'instrumento__tipo_de_instrumento__descricao']
    readonly_fields = ['data_criacao']
    list_editable = ['ativo']