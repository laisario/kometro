from django.contrib import admin
from .models import Post, Categoria, ImagemExtra, Video, ArquivoPost


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
