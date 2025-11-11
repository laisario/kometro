from django.contrib import admin
from .models import Categoria, Equipamento, EquipamentoImagem, EquipamentoCaracteristica

class EquipamentoImagemInline(admin.TabularInline):
    model = EquipamentoImagem
    extra = 1 
    fields = ['imagem']
    readonly_fields = []

class EquipamentoCaracteristicaInline(admin.TabularInline):
    model = EquipamentoCaracteristica
    extra = 2
    fields = ['descricao']
    readonly_fields = []

@admin.register(Equipamento)
class EquipamentoAdmin(admin.ModelAdmin):
    list_display = ['nome', 'modelo', 'fabricante', 'categoria']
    list_filter = ['categoria']
    search_fields = ['nome', 'modelo', 'fabricante']
    inlines = [EquipamentoCaracteristicaInline, EquipamentoImagemInline,]

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ['nome', 'explicacao']
    search_fields = ['nome']
