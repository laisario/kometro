from django.contrib import admin
from .models import OrdemServico


@admin.register(OrdemServico)
class OrdemServicoAdmin(admin.ModelAdmin):
    list_display = ['numero', 'proposta', 'responsavel', 'data_expiracao', 'data_criacao', 'get_cliente', "tipo_os"]
    list_filter = ['responsavel', 'data_expiracao', 'data_criacao']
    search_fields = ['numero', 'proposta__numero', 'proposta__cliente__empresa__razao_social', 'cliente__empresa__razao_social']
    raw_id_fields = ['proposta', 'cliente', 'responsavel']
    filter_horizontal = ['instrumentos']
    readonly_fields = ['numero', 'proposta', 'data_criacao']
    date_hierarchy = 'data_criacao'
    
    fieldsets = [
        (None, {
            'fields': ('numero', 'proposta', 'cliente', 'tipo_os', 'descricao')
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
        cliente = obj.resolved_cliente
        if cliente and cliente.empresa:
            return cliente.empresa.razao_social
        return '-'
