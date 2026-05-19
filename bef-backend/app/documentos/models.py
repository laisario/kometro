from django.db import models
from django.utils.translation import gettext_lazy as _
from datetime import date, timedelta
from django.contrib.auth.models import User
from procedimentos.models import Procedimento
from django.core.exceptions import ValidationError


class Status(models.TextChoices):
    VIGENTE = "V", _("Vigente")
    OBSOLETO = "O", _("Obsoleto")
    CANCELADO = "C", _("Cancelado")


class DocumentoExterno(models.Model):
    codigo = models.CharField(max_length=100, null=True, blank=True)
    titulo = models.CharField(max_length=250, null=True, blank=True)
    link_de_acesso = models.URLField(null=True, blank=True)
    data_da_atualizacao = models.DateField(null=True, blank=True)
    situacao = models.CharField(
        max_length=1,
        choices=Status.choices,
        default=Status.VIGENTE,
    )

    def __str__(self):
        return f"{self.codigo}: {self.titulo} - {self.situacao}"


class Documento(models.Model):
    codigo = models.ForeignKey(
        Procedimento, on_delete=models.SET_NULL, null=True, blank=True
    )
    identificador = models.CharField(max_length=250, null=True, blank=True)
    titulo = models.CharField(max_length=250, null=True, blank=True)
    status = models.CharField(
        max_length=1,
        choices=Status.choices,
        default=Status.VIGENTE,
    )
    data_validade = models.DateField(null=True, blank=True)
    vencido = models.BooleanField(default=False)
    analise_critica = models.IntegerField(
        null=True,
        blank=True,
        help_text="Em dias",
    )
    arquivo = models.FileField(upload_to="documentos/")
    frequencia = models.IntegerField(null=True, blank=True, help_text="Em anos")
    ultima_notificacao = models.DateTimeField(null=True, blank=True)
    criador = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="criador_documento",
        null=True,
        blank=True,
    )
    cliente = models.ForeignKey(
        "clientes.Cliente", 
        on_delete=models.CASCADE, 
        related_name="documentos",
        blank=True,
        null=True,
    )

    # def clean(self):
    #     super().clean()
    #     if self.criador and not self.cliente.usuarios.filter(pk=self.criador.pk).exists():
    #         raise ValidationError({"criador": "O criador deve pertencer aos usuários do cliente."})

    def __str__(self):
        return f"{self.codigo}: {self.titulo} - {self.status}"

    def save(self, *args, **kwargs):
        if self.data_validade:
            delta = self.data_validade - date.today()
            self.analise_critica = delta.days

        # self.full_clean() 
        super().save(*args, **kwargs)


class TipoRevisao(models.TextChoices):
    REVALIDAR = "revalidar", _("Revalidar")
    REVISAR = "revisar", _("Revisar")


class Revisao(models.Model):
    documento = models.ForeignKey(
        Documento,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="revisoes",
    )
    revisor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="revisoes",
        null=True,
        blank=True,
    )
    data_revisao = models.DateField(auto_now_add=True)
    alteracao = models.TextField(null=True, blank=True)
    aprovadores = models.ManyToManyField(
        User, related_name="revisoes_autorizadas"
    )
    tipo = models.CharField(
        max_length=9,
        choices=TipoRevisao.choices,
        default=TipoRevisao.REVISAR,
        verbose_name="tipo",
    )
    ultima_notificacao = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-data_revisao"]

    def __str__(self):
        return f"{self.documento} - {self.revisor}"

    def save(self, *args, **kwargs):
        frequencia_em_dias = self.documento.frequencia * 365
        self.documento.data_validade = date.today() + timedelta(days=frequencia_em_dias)
        self.documento.save()
        super().save(*args, **kwargs)


class Aprovacao(models.Model):
    aprovador = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="aprovacoes",
        null=True,
        blank=True,
    )
    data_aprovacao = models.DateField(auto_now_add=True, null=True)
    revisao = models.ForeignKey(
        Revisao,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="aprovacoes",
    )

    class Meta:
        unique_together = ["aprovador", "revisao"]

    def __str__(self):
        return f"{self.aprovador} - {self.data_aprovacao}"
