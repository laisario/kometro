from django.contrib import admin

from .models import Procedimento


@admin.register(Procedimento)
class ProcedimentoAdmin(admin.ModelAdmin):
    list_display = ("id", "codigo", "descricao")
    fieldsets = [
        (
            None,
            {
                "fields": [
                    "codigo",
                    "descricao",
                    "objetivo",
                    "responsabilidade",
                    "procedimentos_relacionados",
                    "documentos_de_referencia",
                ],
            },
        ),
    ]
