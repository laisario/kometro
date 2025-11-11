from django.contrib import admin
from import_export.resources import ModelResource
from .models import Documento, Revisao, Aprovacao, DocumentoExterno
from import_export.fields import Field
from import_export.widgets import (
    CharWidget,
    DateWidget,
    DecimalWidget,
    ForeignKeyWidget,
    IntegerWidget,
)


@admin.register(Documento)
class DocumentoAdmin(admin.ModelAdmin):
    list_display = ("id", "codigo", "identificador", "titulo", "status", "criador")
    readonly_fields = ["analise_critica"]
    fieldsets = [
        (
            None,
            {
                "fields": [
                    "codigo",
                    "identificador",
                    "titulo",
                    "status",
                    "data_validade",
                    "criador",
                    "frequencia",
                    "analise_critica",
                    "arquivo",
                    "ultima_notificacao",
                    "vencido",
                    "cliente"
                ],
            },
        )
    ]


@admin.register(Revisao)
class RevisaoAdmin(admin.ModelAdmin):
    list_display = ("id", "documento", "revisor", "ultima_notificacao", "tipo")
    fieldsets = [
        (
            None,
            {
                "fields": [
                    "documento",
                    "revisor",
                    "alteracao",
                    "data_revisao",
                    "aprovadores",
                    "ultima_notificacao",
                    "tipo",
                ],
            },
        ),
    ]
    readonly_fields = ["data_revisao"]

    class Meta:
        verbose_name = "Revisao"
        verbose_name_plural = "Revisoes"


@admin.register(Aprovacao)
class AprovacaoAdmin(admin.ModelAdmin):
    list_display = ("id", "aprovador", "revisao")
    fieldsets = [
        (
            None,
            {
                "fields": [
                    "aprovador",
                    "data_aprovacao",
                    "revisao",
                ],
            },
        ),
    ]
    readonly_fields = ["data_aprovacao"]

    class Meta:
        verbose_name = "Aprovacao"
        verbose_name_plural = "Aprovacoes"


@admin.register(DocumentoExterno)
class DocumentoExternoAdmin(admin.ModelAdmin):
    list_display = ("id", "codigo", "titulo")
    fieldsets = [
        (
            None,
            {
                "fields": [
                    "codigo",
                    "titulo",
                    "link_de_acesso",
                    "data_da_atualizacao",
                    "situacao",
                ],
            },
        ),
    ]

    class Meta:
        verbose_name = "Documento Externo"
        verbose_name_plural = "Documentos Externos"


class DocumentoExportResource(ModelResource):
    data_validade = Field(
        column_name="Data validade",
        attribute="data_validade",
        widget=DateWidget(format="%d/%m/%Y"),
        saves_null_values=True,
    )
    analise_critica = Field(
        column_name="Análise Crítica (em meses)",
        attribute="analise_critica",
        widget=IntegerWidget(),
        saves_null_values=True,
    )
    frequencia = Field(
        column_name="Frequência (em anos)",
        attribute="frequencia",
        widget=IntegerWidget(),
        saves_null_values=True,
    )
    codigo = Field(
        column_name="Código",
        attribute="codigo",
        widget=CharWidget(),
        saves_null_values=True,
    )
    criador = Field(
        column_name="Criador",
        attribute="criador",
        widget=CharWidget(),
        saves_null_values=True,
    )
    status = Field(
        column_name="Status",
        attribute="get_status_display",
        widget=CharWidget(),
        saves_null_values=True,
    )

    class Meta:
        model = Documento
        export_order = (
            "titulo",
            "codigo",
            "identificador",
            "status",
            "data_validade",
            "analise_critica",
            "arquivo",
            "frequencia",
            "criador",
        )
        fields = (
            "titulo",
            "codigo",
            "identificador",
            "status",
            "data_validade",
            "analise_critica",
            "arquivo",
            "frequencia",
            "criador",
        )
