from django.contrib import admin
from .models import OrdemServico


@admin.register(OrdemServico)
class OrdemServicoAdmin(admin.ModelAdmin):
    list_display = ['numero', 'proposta', 'responsavel', 'data_expiracao', 'data_criacao', 'get_cliente', "tipo_os"]
    list_filter = ['responsavel', 'data_expiracao', 'data_criacao']
    search_fields = ['numero', 'proposta__numero', 'proposta__cliente__empresa__razao_social']
    raw_id_fields = ['proposta', 'responsavel']
    filter_horizontal = ['instrumentos']
    readonly_fields = ['numero', 'proposta', 'data_criacao']
    date_hierarchy = 'data_criacao'
    
    fieldsets = [
        (None, {
            'fields': ('numero', 'proposta')
        }),
        ('Atribuição', {
            'fields': ('responsavel', 'data_expiracao')
        }),
        # ('Datas', {
        #     'fields': ('data_criacao',),
        #     'classes': ('collapse',)
        # }),
    ]
    
    def get_cliente(self, obj):
        if obj.proposta and obj.proposta.cliente and obj.proposta.cliente.empresa:
            return obj.proposta.cliente.empresa.razao_social
        return '-'
   