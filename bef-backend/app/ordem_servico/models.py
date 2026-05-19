from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _
from instrumentos.models import Local, TipoServico


class TipoOS(models.TextChoices):
    CALIBRACAO = "CAL", _("OS Calibração")
    BALANCAS = "BAL", _("OS Balanças")
    MANUTENCAO = "MAN", _("OS Manutenção")
    SERVICOS_EXTERNOS = "EXT", _("OS Serviços Externos")
    VISITA_TECNICA = "TV", _("Visita Técnica")


class StatusOS(models.TextChoices):
    A_REALIZAR = "AR", _("A realizar")
    EM_ANDAMENTO = "EA", _("Em andamento")
    REALIZADO = "RE", _("Realizado")
    CANCELADO = "CA", _("Cancelado")


class OrdemServico(models.Model):
    proposta = models.ForeignKey(
        "propostas.Proposta",
        on_delete=models.CASCADE,
        related_name="ordens_servico",
        verbose_name="Proposta",
        null=True,
        blank=True,
    )
    cliente = models.ForeignKey(
        "clientes.Cliente",
        on_delete=models.CASCADE,
        related_name="ordens_servico",
        verbose_name="Cliente",
        null=True,
        blank=True,
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
        through="InstrumentoOS",
        related_name="ordens_servico",
        verbose_name="Instrumentos"
    )
    tipo_os = models.CharField(
        max_length=3,
        choices=TipoOS.choices,
        verbose_name="Tipo de OS",
        null=True,
        blank=True,
    )
    status = models.CharField(
        max_length=2,
        choices=StatusOS.choices,
        default=StatusOS.A_REALIZAR,
        verbose_name="Status"
    )
    data_expiracao = models.DateField(
        null=True,
        blank=True,
        verbose_name="Data de Expiração"
    )
    # Type-specific date fields (nullable, populated based on tipo_os)
    data_recebimento_instrumentos = models.DateField(
        null=True,
        blank=True,
        verbose_name="Data recebimento dos instrumentos"
    )  # Calibração
    data_liberacao_instrumentos = models.DateField(
        null=True,
        blank=True,
        verbose_name="Data liberação instrumentos"
    )  # Calibração, Manutenção
    data_calibracao_instrumentos = models.DateField(
        null=True,
        blank=True,
        verbose_name="Data de calibração dos instrumentos"
    )  # Serviços Externos
    data_liberacao_calibracao = models.DateField(
        null=True,
        blank=True,
        verbose_name="Data liberação da calibração"
    )  # Serviços Externos
    os_recebimento_dos_instruementos = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        verbose_name="OS de recebimento dos instrumentos (Manutenção)"
    )  # Manutenção
    descricao = models.TextField(
        null=True,
        blank=True,
        verbose_name="Descrição"
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
    def resolved_cliente(self):
        if self.proposta:
            return self.proposta.cliente
        return self.cliente

    @property
    def cliente_nome(self):
        cliente = self.resolved_cliente
        if cliente and cliente.empresa:
            return cliente.empresa.razao_social
        return None
    
    def pode_transicionar_status(self, novo_status):
        """Validate status transition"""
        transitions = {
            StatusOS.A_REALIZAR: [StatusOS.EM_ANDAMENTO, StatusOS.CANCELADO],
            StatusOS.EM_ANDAMENTO: [StatusOS.REALIZADO, StatusOS.CANCELADO],
            StatusOS.REALIZADO: [],
            StatusOS.CANCELADO: [],
        }
        return novo_status in transitions.get(self.status, [])


class InstrumentoOS(models.Model):
    """
    Through model linking instruments to OS with type-specific fields.
    """
    ordem_servico = models.ForeignKey(
        OrdemServico,
        on_delete=models.CASCADE,
        related_name="instrumentos_os",
        verbose_name="Ordem de Serviço"
    )
    instrumento = models.ForeignKey(
        "instrumentos.InstrumentoDoCliente",
        on_delete=models.CASCADE,
        related_name="ordens_servico_os",
        verbose_name="Instrumento"
    )
    item = models.IntegerField(verbose_name="Item")  # Sequence number in OS
    
    # Common fields
    observacao = models.TextField(null=True, blank=True, verbose_name="Observação")
    
    # Type-specific fields (nullable, used based on OS type)
    # For Calibração:
    local = models.CharField(
        max_length=1,
        choices=Local.choices,
        null=True,
        blank=True,
        verbose_name="Local"
    )
    # tipo_servico DB field kept for backward compatibility (exists in DB from migration)
    # Use the @property tipo_servico instead, which computes from instrumento.instrumento.tipo_de_servico
    tipo_servico = models.CharField(
        max_length=2,
        choices=TipoServico.choices,
        null=True,
        blank=True,
        verbose_name="Tipo de serviço (deprecated - use property)"
    )
    
    # For Balanças:
    # fabricante and numero_serie come from instrumento properties, not stored here
    # carga_maxima DB field kept for backward compatibility (exists in DB from migration)
    # Use the @property carga_maxima instead, which computes from instrumento.instrumento.maximo
    carga_maxima = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Carga máxima (deprecated - use property)"
    )
    marca_reparo = models.BooleanField(
        default=False,
        null=True,
        blank=True,
        verbose_name="Marca de reparo"
    )
    marca_selagem_nova = models.BooleanField(
        default=False,
        null=True,
        blank=True,
        verbose_name="Marca de selagem nova"
    )
    marca_selagem_retirada = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="Marca de selagem retirada"
    )
    servico_executado = models.TextField(
        null=True,
        blank=True,
        verbose_name="Serviço executado"
    )
    
    # For Manutenção:
    descricao_anomalia = models.TextField(
        null=True,
        blank=True,
        verbose_name="Descrição anomalia"
    )
    
    # For Serviços Externos:
    quantidade = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Quantidade"
    )
    
    class Meta:
        unique_together = [['ordem_servico', 'item']]
        ordering = ['item']
        verbose_name = "Instrumento OS"
        verbose_name_plural = "Instrumentos OS"
    
    def __str__(self):
        return f"{self.ordem_servico.numero} - Item {self.item}"
    
    @property
    def fabricante(self):
        """Get fabricante from instrumento.tipo_de_instrumento.fabricante"""
        if self.instrumento and self.instrumento.instrumento:
            return self.instrumento.instrumento.tipo_de_instrumento.fabricante
        return None
    
    @property
    def numero_serie(self):
        """Get numero_serie from instrumento.numero_de_serie"""
        if self.instrumento:
            return self.instrumento.numero_de_serie
        return None
    
    @property
    def carga_maxima(self):
        """
        Computed property: returns instrumento.instrumento.maximo.
        Returns None if any link in the chain is missing.
        """
        if self.instrumento and self.instrumento.instrumento:
            return self.instrumento.instrumento.maximo
        return None
    
    @property
    def tipo_servico(self):
        """
        Computed property: returns InstrumentoDoCliente.tipo_de_servico.
        Returns None if instrumento link is missing.
        """
        if self.instrumento:
            return self.instrumento.tipo_de_servico
        return None
