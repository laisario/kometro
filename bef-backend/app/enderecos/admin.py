from django.contrib import admin

from .models import UF, Bairro, Cidade, Endereco


@admin.register(Cidade)
class CidadeAdmin(admin.ModelAdmin):
    list_display = ("id", "nome", "uf")


@admin.register(Bairro)
class BairroAdmin(admin.ModelAdmin):
    list_display = ("id", "nome", "cidade")


@admin.register(Endereco)
class EnderecoAdmin(admin.ModelAdmin):
    list_display = ("id", "cep", "logradouro")


@admin.register(UF)
class UFAdmin(admin.ModelAdmin):
    list_display = ("id", "sigla")
