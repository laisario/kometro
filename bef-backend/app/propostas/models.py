from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _
from model_utils import FieldTracker
import datetime
from instrumentos.models import Local, TipoServico
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


class PropostaInstrumento(models.Model):
    """
    Stores per-instrument service selections for a proposal.
    Replaces the single Proposta.local field with per-instrument granularity.
    """
    proposta = models.ForeignKey(
        "Proposta",
        on_delete=models.CASCADE,
        related_name="instrumentos_selecoes",
        verbose_name="Proposta"
    )
    instrumento = models.ForeignKey(
        "instrumentos.InstrumentoDoCliente",
        on_delete=models.CASCADE,
        related_name="propostas_selecoes",
        verbose_name="Instrumento"
    )
    
    # Service selection fields
    service_kind = models.CharField(
        max_length=20,
        choices=[
            ("calibracao", _("Calibração")),
            ("manutencao", _("Manutenção")),
        ],
        verbose_name="Tipo de serviço"
    )
    local = models.CharField(
        max_length=1,
        choices=Local.choices,
        verbose_name="Local"
    )
    preco = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Preço",
        help_text="Preço unitário deste item na proposta. Usado no cálculo do total.",
    )
    # Note: tipo_servico (acreditado/nao_acreditado) is stored in Instrumento.tipo_de_servico
    # and does not need to be stored here. It will be read from the instrument during OS generation.
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data de criação")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data de atualização")
    
    class Meta:
        unique_together = [['proposta', 'instrumento']]
        verbose_name = "Seleção de Serviço do Instrumento"
        verbose_name_plural = "Seleções de Serviço dos Instrumentos"
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.proposta.numero} - {self.instrumento.tag or self.instrumento.id}"


class Proposta(models.Model):
    # Service type for proposal level (manual override)
    TIPO_SERVICO_ACREDITADO = "acreditado"
    TIPO_SERVICO_NAO_ACREDITADO = "nao_acreditado"

    TIPO_SERVICO_CHOICES = (
        (TIPO_SERVICO_ACREDITADO, _("Acreditado")),
        (TIPO_SERVICO_NAO_ACREDITADO, _("Não acreditado")),
    )

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
    # Manual service type for the whole proposal (optional, overrides inference)
    tipo_servico = models.CharField(
        max_length=20,
        choices=TIPO_SERVICO_CHOICES,
        null=True,
        blank=True,
        verbose_name="Tipo de serviço (proposta)",
        help_text="Classificação manual da proposta: acreditado ou não acreditado.",
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

    def get_instrumentos_selecoes(self):
        """
        Returns dict of instrument selections:
        {
            instrumento_id: {
                'instrumento': InstrumentoDoCliente instance,
                'service_kind': 'calibracao' | 'manutencao',
                'local': 'C' | 'P' | 'T',
                'tipo_servico': 'A' | 'NA'  # Read from instrumento.instrumento.tipo_de_servico
            }
        }
        """
        selecoes = self.instrumentos_selecoes.select_related(
            'instrumento__instrumento__tipo_de_instrumento'
        ).all()
        
        return {
            sel.instrumento_id: {
                'instrumento': sel.instrumento,
                'service_kind': sel.service_kind,
                'local': sel.local,
                'tipo_servico': sel.instrumento.instrumento.tipo_de_servico or TipoServico.NAO_ACREDITADO,
            }
            for sel in selecoes
        }
    
    def get_instrumento_selecao(self, instrumento_id):
        """Get selection for specific instrument"""
        try:
            sel = self.instrumentos_selecoes.select_related(
                'instrumento__instrumento'
            ).get(instrumento_id=instrumento_id)
            return {
                'service_kind': sel.service_kind,
                'local': sel.local,
                'tipo_servico': sel.instrumento.instrumento.tipo_de_servico or TipoServico.NAO_ACREDITADO,
            }
        except PropostaInstrumento.DoesNotExist:
            # Fallback to proposta.local for backward compatibility
            try:
                instrumento = self.instrumentos.get(id=instrumento_id)
                return {
                    'service_kind': 'calibracao',  # Default assumption
                    'local': self.local,
                    'tipo_servico': instrumento.instrumento.tipo_de_servico or TipoServico.NAO_ACREDITADO,
                }
            except:
                return {
                    'service_kind': 'calibracao',
                    'local': self.local,
                    'tipo_servico': TipoServico.NAO_ACREDITADO,
                }

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

    # --- Service type resolution helpers ---

    def infer_tipo_servico_from_instrumentos(self) -> str:
        """
        Infer proposal service type based on its instruments.

        Rules:
        - If at least one instrument linked to the proposal is accredited (TipoServico.ACREDITADO),
          return TIPO_SERVICO_ACREDITADO.
        - Otherwise, return TIPO_SERVICO_NAO_ACREDITADO.

        This uses efficient EXISTS-based queries and supports both the new
        PropostaInstrumento relation and the legacy many-to-many 'instrumentos'.
        """
        from instrumentos.models import TipoServico as InstrumentoTipoServico

        # Check selections table first (new structure)
        has_accredited_selection = self.instrumentos_selecoes.filter(
            instrumento__instrumento__tipo_de_servico=InstrumentoTipoServico.ACREDITADO
        ).exists()

        if has_accredited_selection:
            return self.TIPO_SERVICO_ACREDITADO

        # Fallback to legacy M2M if needed
        has_accredited_instrument = self.instrumentos.filter(
            instrumento__tipo_de_servico=InstrumentoTipoServico.ACREDITADO
        ).exists()

        if has_accredited_instrument:
            return self.TIPO_SERVICO_ACREDITADO

        return self.TIPO_SERVICO_NAO_ACREDITADO

    def resolve_tipo_servico_efetivo(self) -> str:
        """
        Resolve effective service type for the proposal.

        Priority:
        1. Infer from instruments (infer_tipo_servico_from_instrumentos)
        2. If self.tipo_servico is filled, override the inferred value.
        """
        inferred = self.infer_tipo_servico_from_instrumentos()
        return self.tipo_servico or inferred

    def should_apply_seal(self) -> bool:
        """
        Decide if the PDF seal must be applied for this proposal.

        Only apply seal when effective service type is 'acreditado'.
        """
        return self.resolve_tipo_servico_efetivo() == self.TIPO_SERVICO_ACREDITADO
