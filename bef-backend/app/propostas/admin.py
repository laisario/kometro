from django.contrib import admin
from .models import Proposta, Revisao, Anexo
from clientes.models import Cliente
from django.contrib.auth import get_user_model
from import_export.resources import ModelResource
from import_export.fields import Field
from import_export.widgets import ForeignKeyWidget, CharWidget, BooleanWidget


class AnexoAdmin(admin.StackedInline):
    model = Anexo
    list_display = (
        "id",
        "anexo",
    )
    fieldsets = (
        (
            "Anexo",
            {"fields": ("anexo",)},
        ),
    )
    extra = 1


class RevisaoAdmin(admin.StackedInline):
    model = Revisao
    list_display = (
        "id",
        "pdf",
    )
    fieldsets = (
        (
            "Revisão",
            {"fields": ("pdf",)},
        ),
    )
    extra = 1


@admin.register(Proposta)
class PropostaAdmin(admin.ModelAdmin):
    list_display = ("id", "numero", "status", "cliente")
    readonly_fields = [
        "total",
        "data_atualizacao",
    ]
    inlines = [AnexoAdmin, RevisaoAdmin]
    fieldsets = (
        (
            "Informações clientes",
            {
                "fields": (
                    "cliente",
                    "instrumentos",
                    "informacoes_adicionais",
                    "data_criacao",
                )
            },
        ),
        (
            "Informações b&f",
            {
                "fields": (
                    "numero",
                    "total",
                    "data_atualizacao",
                    "condicao_de_pagamento",
                    "transporte",
                    "endereco_de_entrega",
                    "validade",
                    "data_aprovacao",
                    "status",
                    "responsavel",
                    "desconto_percentual",
                )
            },
        ),
        (
            "Liberar para faturamento",
            {
                "fields": (
                    "realizado",
                    "usuario_liberou_faturamento",
                    "data_liberacao_faturamento",
                    "nf_entrada",
                    "nf",
                    "observacao",
                )
            },
        ),
    )


class PropostaExportResource(ModelResource):
    numero = Field(
        column_name="Número da Proposta",
        attribute="numero",
        widget=CharWidget(),
        saves_null_values=True,
    )
    cliente = Field(
        column_name="Cliente",
        attribute="cliente",
        widget=ForeignKeyWidget(Cliente, field="empresa__razao_social"),
        saves_null_values=True,
    )

    local = Field(
        column_name="Local de Calibração",
        attribute="local",
        widget=CharWidget(),
        saves_null_values=True,
    )

    responsavel = Field(
        column_name="Elaborador da Proposta",
        attribute="responsavel",
        widget=ForeignKeyWidget(get_user_model(), field="username"),
        saves_null_values=True,
    )
    status = Field(
        column_name="Status",
        attribute="status",
        widget=CharWidget(),
        saves_null_values=True,
    )
    realizado = Field(
        column_name="Realizado",
        attribute="realizado",
        widget=BooleanWidget(),
        saves_null_values=True,
    )
    nf_entrada = Field(
        column_name="NF Entrada",
        attribute="nf_entrada",
        widget=CharWidget(),
        saves_null_values=True,
    )
    nf = Field(
        column_name="Frequência (em anos)",
        attribute="frequencia",
        widget=CharWidget(),
        saves_null_values=True,
    )
    observacao = Field(
        column_name="Observação",
        attribute="observacao",
        widget=CharWidget(),
        saves_null_values=True,
    )

    class Meta:
        model = Proposta
        export_order = (
            "numero",
            "cliente",
            "local",
            "responsavel",
            "status",
            "realizado",
            "nf_entrada",
            "nf",
            "observacao",
        )
        fields = (
            "numero",
            "cliente",
            "local",
            "responsavel",
            "status",
            "realizado",
            "nf_entrada",
            "nf",
            "observacao",
        )
