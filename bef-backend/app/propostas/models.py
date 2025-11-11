from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _
from model_utils import FieldTracker
import datetime
from instrumentos.models import Local
from decimal import Decimal


class Status(models.TextChoices):
    ELABORACAO = "E", _("Elaboração")
    AGUARDANDO_APROVACAO = "AA", _("Aguardando aprovação")
    APROVADA = "A", _("Aprovada")
    REPROVADA = "R", _("Reprovada")


class Revisao(models.Model):
    pdf = models.FileField(upload_to="revisoes/", null=True, blank=True)
    rev = models.IntegerField(
        null=True,
        blank=True,
    )
    proposta = models.ForeignKey(
        "Proposta", on_delete=models.CASCADE, related_name="revisoes"
    )

    def generate_number(self):
        last_revision = self.proposta.revisoes.last()
        if last_revision:
            return int(last_revision.rev) + 1
        else:
            return 0

    def save(self, *args, **kwargs) -> None:
        if not self.rev:
            self.rev = self.generate_number()
        super().save(*args, **kwargs)


class Anexo(models.Model):
    anexo = models.FileField(null=True, blank=True, upload_to="anexos/")
    proposta = models.ForeignKey(
        "Proposta", on_delete=models.CASCADE, related_name="anexos"
    )


class Proposta(models.Model):
    cliente = models.ForeignKey(
        "clientes.Cliente", on_delete=models.CASCADE, related_name="propostas"
    )
    informacoes_adicionais = models.TextField(
        null=True, blank=True, verbose_name="Informações adicionais"
    )
    total = models.DecimalField(
        default=0.0, max_digits=65, decimal_places=2, blank=True, null=True
    )
    condicao_de_pagamento = models.CharField(
        max_length=50, verbose_name="Condição de pagamento", null=True, blank=True
    )
    transporte = models.CharField(max_length=512, null=True, blank=True)
    endereco_de_entrega = models.ForeignKey(
        "enderecos.Endereco",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name="Endereço de entrega",
    )
    validade = models.DateField(null=True, blank=True)
    data_criacao = models.DateTimeField(
        verbose_name="Data criação", default=timezone.now
    )
    data_aprovacao = models.DateTimeField(
        null=True, blank=True, verbose_name="Data aprovação"
    )
    status = models.CharField(
        max_length=2,
        choices=Status.choices,
        default=Status.ELABORACAO,
    )
    tracker = FieldTracker(fields=["status"])
    instrumentos = models.ManyToManyField(
        "instrumentos.InstrumentoDoCliente",
        related_name="propostas",
        blank=True,
    )
    numero = models.CharField(null=True, blank=True, max_length=15, unique=True)
    responsavel = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="propostas_responsaveis",
        verbose_name="Funcionário Responsável",
    )
    dias_uteis = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Dias úteis",
        help_text="Em dias",
    )
    desconto_percentual = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Desconto percentual aplicado sobre o valor total (ex: 10 para 10%)",
    )
    data_atualizacao = models.DateTimeField(
        verbose_name="Data atualização", auto_now=True
    )
    realizado = models.BooleanField(default=False)
    data_liberacao_faturamento = models.DateTimeField(
        null=True, blank=True, verbose_name="Data de Liberação para Faturamento"
    )
    usuario_liberou_faturamento = models.CharField(max_length=100, blank=True, null=True)
    nf_entrada = models.CharField(max_length=50, blank=True, null=True)
    nf = models.CharField(max_length=50, blank=True, null=True)
    observacao = models.TextField(blank=True, null=True)
    local = models.CharField(
        choices=Local.choices,
        default=Local.PERMANENTE,
        max_length=1,
    )

    def generate_numero(self):
        current_year = datetime.datetime.now().year
        last_two_digits_year = str(current_year)[-2:]
        month_letter_map = {
            1: "A",
            2: "B",
            3: "C",
            4: "D",
            5: "E",
            6: "F",
            7: "G",
            8: "H",
            9: "I",
            10: "J",
            11: "K",
            12: "L",
        }
        current_month = datetime.datetime.now().month
        month_letter = month_letter_map[current_month]

        last_proposta = Proposta.objects.order_by("numero").last()

        if last_proposta:
            last_sequence = int(last_proposta.numero[:4])
            new_sequence = last_sequence + 1
        else:
            new_sequence = 1

        new_sequence_str = f"{new_sequence:04d}"
        new_numero = f"{new_sequence_str}{month_letter}{last_two_digits_year}"
        return new_numero

    def save(self, *args, **kwargs) -> None:
        if not self.numero:
            self.numero = self.generate_numero()
        super().save(*args, **kwargs)
        # if self.instrumentos.exists():
        #     if self.local == Local.CLIENTE:
        #         preco_field = "instrumento__preco_calibracao_no_cliente"
        #     else:
        #         preco_field = "instrumento__preco_calibracao_no_laboratorio"
        #     self.total = (
        #         self.instrumentos.aggregate(
        #             total=models.Sum(
        #                 models.Case(
        #                     models.When(
        #                         preco_alternativo_calibracao__isnull=False,
        #                         then=models.F("preco_alternativo_calibracao"),
        #                     ),
        #                     default=models.F(preco_field),
        #                 )
        #             )
        #         )["total"]
        #         or 0
        #     )

        #     super().save(*args, **kwargs)
