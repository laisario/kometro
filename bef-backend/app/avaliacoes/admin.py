from django.contrib import admin

from django.contrib import admin
from .models import Avaliacao


@admin.register(Avaliacao)
class AvaliacaoAdmin(admin.ModelAdmin):
    list_display = ("nome", "empresa", "criado_em")
    search_fields = ("nome", "empresa", "comentario")
    list_filter = ("criado_em",)
