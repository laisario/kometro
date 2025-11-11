from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import Cliente, Empresa, UserProfile

@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ("id","empresa")


@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ("id", "razao_social", "cnpj")


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "terms_accepted")
    list_filter = ("terms_accepted",)
    search_fields = ("user__username", "user__email")


admin.site.index_title = _("Painel Administrativo")
admin.site.site_header = _("Kometro")
admin.site.site_title = _("Kometro")
