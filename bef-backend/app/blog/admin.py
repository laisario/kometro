from django.contrib import admin
from django.utils import timezone

from .models import (
    ArquivoPost,
    Categoria,
    ImagemExtra,
    Post,
    SolicitacaoAcessoArquivoPost,
    Video,
)


class ImagemExtraInline(admin.TabularInline):
    model = ImagemExtra
    extra = 1

class VideoInline(admin.TabularInline):
    model = Video
    extra = 1


class ArquivoPostInline(admin.TabularInline):
    model = ArquivoPost
    extra = 1
    readonly_fields = ("nome_original", "tipo", "tamanho", "criado_em")
    fields = ("arquivo", "titulo", "nome_original", "tipo", "tamanho", "criado_em")


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("titulo", "categoria", "publicado_em", "visivel")
    list_filter = ("visivel", "categoria")
    search_fields = ["titulo"]
    inlines = [ImagemExtraInline, VideoInline, ArquivoPostInline]


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ("nome",)


@admin.register(SolicitacaoAcessoArquivoPost)
class SolicitacaoAcessoArquivoPostAdmin(admin.ModelAdmin):
    list_display = (
        "nome",
        "empresa",
        "email",
        "telefone",
        "arquivo",
        "data_solicitacao",
        "hora_solicitacao",
    )
    search_fields = (
        "nome",
        "empresa",
        "email",
        "telefone",
        "arquivo__titulo",
        "arquivo__nome_original",
        "arquivo__post__titulo",
    )
    list_filter = ("criado_em",)
    date_hierarchy = "criado_em"
    list_select_related = ("arquivo", "arquivo__post")
    readonly_fields = (
        "nome",
        "empresa",
        "email",
        "telefone",
        "arquivo",
        "criado_em",
    )

    @admin.display(description="Data", ordering="criado_em")
    def data_solicitacao(self, obj):
        return timezone.localtime(obj.criado_em).strftime("%d/%m/%Y")

    @admin.display(description="Hora", ordering="criado_em")
    def hora_solicitacao(self, obj):
        return timezone.localtime(obj.criado_em).strftime("%H:%M:%S")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
