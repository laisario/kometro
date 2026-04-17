from django.contrib.auth.models import User
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class UserProfile(models.Model):
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='profile'
    )
    terms_accepted = models.BooleanField(
        default=False,
        verbose_name="Termos aceitos",
        help_text="Indica se o usuário aceitou os termos e condições"
    )
    
    def __str__(self):
        return f"{self.user.username} - Profile"


class Empresa(models.Model):
    razao_social = models.CharField(max_length=512, verbose_name="Razão Social")
    cnpj = models.CharField(max_length=25, verbose_name="C.N.P.J.")
    ie = models.CharField(
        max_length=50, verbose_name="Inscrição Estadual", null=True, blank=True
    )
    isento = models.BooleanField(default=False)
    nome_fantasia = models.CharField(
        max_length=512, verbose_name="Nome Fantasia", null=True, blank=True
    )
    filial = models.CharField(max_length=512, null=True, blank=True)

    def __str__(self):
        return self.razao_social


class Unidade(models.Model):
    nome = models.CharField(max_length=212)
    empresa = models.ForeignKey(
        Empresa, on_delete=models.CASCADE, related_name="unidades"
    )

    def __str__(self):
        return self.nome


class CriterioFrequencia(models.TextChoices):
    CALENDARIO = "C", _("Tempo de calendário")
    SERVICO = "S", _("Tempo de serviço")

class Cliente(models.Model):
    empresa = models.OneToOneField(
        Empresa, on_delete=models.SET_NULL, null=True, blank=True
    )
    endereco = models.ForeignKey(
        "enderecos.Endereco",
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="Endereço",
    )
    usuarios = models.ManyToManyField(
        User, related_name='clientes', blank=True
    )
    criterio_frequencia_padrao = models.CharField(
        max_length=1,
        choices=CriterioFrequencia.choices,
        default=CriterioFrequencia.CALENDARIO,
        verbose_name="Critério de frequência padrão"
    )
    # Cached info

    instrumentos_vencidos = models.PositiveIntegerField(default=0)
    instrumentos_em_dia = models.PositiveIntegerField(default=0)
    instrumentos_cadastrados = models.PositiveIntegerField(default=0)
    propostas_aguardando_aprovacao = models.PositiveIntegerField(default=0)

    def __str__(self):
        if hasattr(self.empresa, "razao_social"):
            return self.empresa.razao_social
        return super().__str__()


class Convite(models.Model):
    token_jti = models.CharField(max_length=255)
    grupo = models.ForeignKey("auth.Group", on_delete=models.CASCADE)
    criado_por = models.ForeignKey(User, on_delete=models.CASCADE, related_name='invites')
    criado_em = models.DateTimeField(auto_now_add=True)
    usado = models.BooleanField(default=False)
    # Nullable: staff-created invitations have no client association
    cliente = models.ForeignKey(
        Cliente, on_delete=models.CASCADE, related_name='invites', null=True, blank=True
    )


class PasswordReset(models.Model):
    email = models.EmailField()
    token = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)