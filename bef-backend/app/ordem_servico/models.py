from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _


class OrdemServico(models.Model):
    proposta = models.ForeignKey(
        "propostas.Proposta",
        on_delete=models.CASCADE,
        related_name="ordens_servico",
        verbose_name="Proposta"
    )
    responsavel = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ordens_servico",
        verbose_name="Responsável"
    )
    instrumentos = models.ManyToManyField(
        "instrumentos.InstrumentoDoCliente",
        related_name="ordens_servico",
        verbose_name="Instrumentos"
    )
    data_expiracao = models.DateField(
        null=True,
        blank=True,
        verbose_name="Data de Expiração"
    )
    numero = models.CharField(
        max_length=25,
        unique=True,
        verbose_name="Número"
    )
    data_criacao = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Data de Criação"
    )

    class Meta:
        verbose_name = "Ordem de Serviço"
        verbose_name_plural = "Ordens de Serviço"
        ordering = ['-data_criacao']

    def __str__(self):
        return f"{self.numero}"

    @property
    def cliente(self):
        return self.proposta.cliente

    @property
    def cliente_nome(self):
        if self.proposta.cliente and self.proposta.cliente.empresa:
            return self.proposta.cliente.empresa.razao_social
        return None
