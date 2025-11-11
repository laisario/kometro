from django.contrib import admin
from .models import Post, Categoria, ImagemExtra, Video


class ImagemExtraInline(admin.TabularInline):
    model = ImagemExtra
    extra = 1

class VideoInline(admin.TabularInline):
    model = Video
    extra = 1


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("titulo", "categoria", "publicado_em", "visivel")
    list_filter = ("visivel", "categoria")
    search_fields = ["titulo"]
    inlines = [ImagemExtraInline, VideoInline]


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ("nome",)
