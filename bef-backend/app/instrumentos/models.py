from datetime import date
from django.db import models
from django.utils.translation import gettext_lazy as _
from model_utils import FieldTracker
from django.core.validators import MinValueValidator, MaxValueValidator
from .utils import calcular_data_proxima_calibracao_servico, calcular_data_proxima_calibracao_calendario, calcular_data_proxima_checagem_servico, calcular_data_proxima_checagem_calendario
from django.db import transaction
from django.contrib.auth.models import User 

class PontoDeCalibracao(models.Model):
    instrumento = models.ForeignKey(
        "InstrumentoDoCliente",
        on_delete=models.CASCADE,
        related_name="pontos_de_calibracao",
    )
    nome = models.CharField(max_length=150)


class Local(models.TextChoices):
    PERMANENTE = "P", _("Instalação permanente")
    CLIENTE = "C", _("Instalação cliente")
    TERCEIRIZADA = "T", _("Terceirizada")


PERIODOS_RELATIVEDELTA = {
    "dia": "days",
    "mes": "months",
    "ano": "years",
    "dias": "days",
    "meses": "months",
    "anos": "years",
}

class CriterioFrequencia(models.TextChoices):
    CALENDARIO = "C", _("Tempo de calendário")
    SERVICO = "S", _("Tempo de serviço")

class InstrumentoDoCliente(models.Model):
    class Posicao(models.TextChoices):
        EM_USO = "U", _("Em uso")
        EM_ESTOQUE = "E", _("Em estoque")
        INATIVO = "I", _("Inativo")
        FORA_DE_USO = "F", _("Fora de uso")
        EM_CALIBRACAO = "C", _("Em calibração")

    tag = models.CharField(max_length=512, null=True, blank=True)
    numero_de_serie = models.CharField(
        max_length=1024, null=True, blank=True, verbose_name="Número de série"
    )
    cliente = models.ForeignKey(
        "clientes.Cliente", on_delete=models.CASCADE, related_name="instrumentos"
    )
    posicao = models.CharField(
        max_length=1,
        choices=Posicao.choices,
        null=True, blank=True,
        verbose_name="Posição do instrumento",
    )
    data_proxima_calibracao = models.DateField(
        null=True, blank=True, verbose_name="Data da próxima calibração"
    )
    data_ultima_calibracao = models.DateField(
        null=True, blank=True, verbose_name="Data da última calibração"
    )
    data_proxima_checagem = models.DateField(
        null=True, blank=True, verbose_name="Data da próxima checagem"
    )
    data_ultima_checagem = models.DateField(
        null=True, blank=True, verbose_name="Data da última checagem"
    )
    expirado = models.BooleanField(default=False)
    data_utilizacao = models.DateField(
        null=True, blank=True, verbose_name="Data do início da utilização"
    )
    instrumento = models.ForeignKey(
        "Instrumento", on_delete=models.CASCADE, related_name="instrumentos"
    )    
    tracker = FieldTracker(fields=["posicao", "frequencia_calibracao", "frequencia_checagem", 'data_ultima_calibracao', 'data_ultima_checagem'])
    preco_alternativo_calibracao = models.DecimalField(
        null=True,
        blank=True,
        max_digits=12,
        decimal_places=2,
        verbose_name="Preço alternativo calibração",
    )
    dias_uteis = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Dias úteis",
        help_text="Em dias",
    )
    ultima_notificacao = models.DateTimeField(null=True, blank=True)
    setor = models.ForeignKey(
        "Setor",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="instrumentos",
        verbose_name="Setor"
    )
    classe = models.CharField(
        max_length=256,
        blank=True,
        null=True,
        verbose_name="Classe",
    )
    frequencia_checagem = models.ForeignKey(
        'Frequencia',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='instrumentos_checagem',
        help_text='Frequência de checagem do instrumento'
    )
    frequencia_calibracao = models.ForeignKey(
        'Frequencia',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='instrumentos_calibracao',
        help_text='Frequência de calibração do instrumento'
    )
    normativos = models.ManyToManyField('Normativo', blank=True)
    data_ultima_checagem = models.DateField(
        null=True, blank=True, verbose_name="Data da última checagem"
    )
    observacao = models.TextField(null=True, blank=True, verbose_name="Observação")
    data_criacao = models.DateTimeField(auto_now_add=True, null=True, blank=True,)
    criterio_frequencia = models.CharField(
        max_length=1,
        choices=CriterioFrequencia.choices,
        null=True, blank=True,
        verbose_name="Critério de frequência"
    )

    def __str__(self):
        return f"{self.tag}"

    def delete(self, *args, **kwargs):
        self.cliente.instrumentos_cadastrados -= 1
        self.cliente.save()
        return super( ).delete(*args, **kwargs)
    

    def atualizar_datas(self, campos):
        criado = self._state.adding
        posicao_uso = self.Posicao.EM_USO
        criterio_servico = CriterioFrequencia.SERVICO
        criterio = self.criterio_frequencia or self.cliente.criterio_frequencia_padrao
        with self.tracker:
            for campo in campos:
                if not self.tracker.has_changed(campo):
                    continue

                if criterio == criterio_servico:
                    if self.posicao == posicao_uso:
                        self.data_utilizacao = date.today()
                    else:
                        self.data_utilizacao = None

                if campo == "posicao" or campo == "frequencia_calibracao" or campo == "data_ultima_calibracao":
                    if criterio == criterio_servico and self.posicao == posicao_uso:
                        self.data_proxima_calibracao = calcular_data_proxima_calibracao_servico(self, criado=criado)
                    elif criterio != criterio_servico:
                        self.data_proxima_calibracao = calcular_data_proxima_calibracao_calendario(self)
                    else:
                        self.data_proxima_calibracao = None

                if campo == "posicao" or campo == "frequencia_checagem"  or campo == "data_ultima_checagem":
                    if criterio == criterio_servico and self.posicao == posicao_uso:
                        self.data_proxima_checagem = calcular_data_proxima_checagem_servico(self, criado=criado)
                    elif criterio != criterio_servico:
                        self.data_proxima_checagem = calcular_data_proxima_checagem_calendario(self)
                    else:
                        self.data_proxima_checagem = None
                    

    def save(self, *args, **kwargs) -> None:
        with transaction.atomic():
            is_new = not self.pk

            self.atualizar_datas(['posicao', 'frequencia_calibracao', 'frequencia_checagem', 'data_ultima_calibracao', 'data_ultima_checagem'])
            
            super().save(*args, **kwargs)
            
            if is_new:
                self.cliente.instrumentos_cadastrados += 1
                self.cliente.save()

            for proposta in self.propostas.all():
                proposta.save()


    class Meta:
        verbose_name = "Instrumento do cliente"
        verbose_name_plural = "Instrumentos dos clientes"
        constraints = [
            models.UniqueConstraint(
                fields=["cliente", "tag"],
                name="unique_tag_por_cliente"
            )
        ]
        indexes = [
            models.Index(fields=['tag']),
            models.Index(fields=['cliente', 'tag']), 
        ]


class CriterioAceitacao(models.Model):
    instrumento = models.ForeignKey(
        'InstrumentoDoCliente',
        on_delete=models.CASCADE,
        related_name='criterios_aceitacao'
    )
    tipo = models.CharField(
        max_length=100,
        verbose_name="Tipo"
    )
    criterio_de_aceitacao = models.DecimalField(
        verbose_name="Critério de aceitação",
        null=True,
        blank=True,
        decimal_places=5,
        max_digits=10,
    )
    referencia_do_criterio = models.CharField(
        max_length=256,
        blank=True,
        null=True,
        verbose_name="Referência do critério de aceitação",
    )
    observacao_criterio_aceitacao = models.TextField(
        null=True,
        blank=True,
        verbose_name="Observações critério de aceitação"
    )
    unidade = models.CharField(
        max_length=16,
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"{self.instrumento} - {self.tipo}"


class MovimentacaoInstrumento(models.Model):
    instrumento = models.ForeignKey(
        InstrumentoDoCliente,
        on_delete=models.CASCADE,
        related_name="historico_posicoes"
    )
    nova_posicao = models.CharField(
        max_length=1,
        choices=InstrumentoDoCliente.Posicao.choices
    )
    antiga_posicao = models.CharField(
        max_length=1,
        choices=InstrumentoDoCliente.Posicao.choices,
        null=True,
        blank=True,
    )
    data_alteracao = models.DateTimeField(auto_now_add=True)
    usuario_alteracao = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    class Meta:
        ordering = ["-data_alteracao"]


class MovimentacaoSetorInstrumento(models.Model):
    instrumento = models.ForeignKey(
        InstrumentoDoCliente,
        on_delete=models.CASCADE,
        related_name="historico_setores"
    )
    data_alteracao = models.DateTimeField(auto_now_add=True)
    usuario_alteracao = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    novo_setor = models.CharField(max_length=255)
    antigo_setor = models.CharField(max_length=255)

    class Meta:
        ordering = ["-data_alteracao"]


class CalibracaoStatus(models.TextChoices):
    APROVADO = "A", _("Aprovado")
    REPROVADO = "R", _("Reprovado")


class CalibracaoAnaliseCritica(models.TextChoices):
    APROVADO = "A", _("Aprovado")
    REPROVADO = "X", _("Reprovado")
    RESTRICAO = "R", _("Aprovado com restrição")
    PENDENTE = "P", _("Pendente")


class Anexo(models.Model):
    anexo = models.FileField(null=True, blank=True, upload_to="certificados/anexos/")
    certificado = models.ForeignKey(
        "Certificado", on_delete=models.CASCADE, related_name="anexos"
    )


class Certificado(models.Model):
    numero = models.CharField(
        max_length=512, verbose_name="Número do certificado", null=True, blank=True
    )
    arquivo = models.FileField(upload_to="certificados/", null=True, blank=True)
    calibracao = models.ForeignKey(
        "Calibracao", on_delete=models.CASCADE, related_name="certificados"
    )

    def __str__(self):
        return f"{self.numero}: {self.calibracao}"


class ResultadoCalibracao(models.Model):
    calibracao = models.ForeignKey(
        'Calibracao',
        on_delete=models.CASCADE,
        related_name='resultados'
    )
    criterio = models.ForeignKey(
        "CriterioAceitacao", 
        on_delete=models.CASCADE, 
        related_name="resultados",
        null=True,
        blank=True,
    )
    status = models.CharField(
        max_length=1,
        choices=CalibracaoStatus.choices,
        null=True,
        blank=True,
        help_text="Aprovação é definida por: |Maior erro| + |Incerteza| <= Critério de aceitação",
    )
    maior_erro = models.DecimalField(
        verbose_name="Maior erro",
        max_digits=10,
        decimal_places=5,
        null=True,
        blank=True,
    )
    incerteza = models.DecimalField(
        max_digits=10,
        decimal_places=5,
        null=True,
        blank=True
    )

    def __str__(self):
        return f"{self.maior_erro} - {self.incerteza}"


class Calibracao(models.Model):
    instrumento = models.ForeignKey(
        InstrumentoDoCliente,
        on_delete=models.CASCADE,
        related_name="calibracoes",
        verbose_name="Instrumento calibrado",
    )
    ordem_de_servico = models.CharField(
        max_length=512, blank=True, null=True, verbose_name="Ordem de serviço"
    )
    data = models.DateField(null=True, blank=True, verbose_name="Data da calibração")
    checagem = models.BooleanField(null=True, blank=True,)
    observacoes = models.TextField(blank=True, null=True, verbose_name="Observações")
    analise_critica = models.CharField(
        max_length=1,
        choices=CalibracaoAnaliseCritica.choices,
        default=CalibracaoAnaliseCritica.PENDENTE,
        verbose_name="Análise Crítica Cliente",
    )
    restricao_analise_critica = models.TextField(
        blank=True, null=True, verbose_name="Restrição análise crítica"
    )
    tracker = FieldTracker(fields=["data"])
    setor = models.ForeignKey(
        "Setor",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="calibracoes",
        verbose_name="Setor"
    )
    laboratorio = models.CharField(max_length=512, null=True, blank=True)
    observacao_fornecedor = models.TextField(null=True, blank=True, verbose_name="Observações fornecedor")
    preco = models.DecimalField(
        null=True,
        blank=True,
        max_digits=12,
        decimal_places=2,
        verbose_name="Preço ultima calibração",
    )
    local = models.CharField(
        choices=Local.choices,
        null=True,
        blank=True,
        max_length=1,
    )

    @property
    def cliente(self):
        return self.instrumento.cliente
    
    @property
    def cliente_id(self):
        return self.instrumento.cliente_id

    def __str__(self):
        return "Calibração {} - {}".format(self.pk, self.instrumento.tag)

    def save(self, *args, **kwargs) -> None:
        self.setor = self.instrumento.setor
        with transaction.atomic():
            super().save(*args, **kwargs)
            instrumento = self.instrumento

            if self.checagem:
                instrumento.data_ultima_checagem = self.data
                instrumento.atualizar_datas(["posicao", "frequencia_checagem", "data_ultima_checagem"])
                update_fields = ["data_ultima_checagem", "data_proxima_checagem", "data_utilizacao"]
            else:
                instrumento.data_ultima_calibracao = self.data
                instrumento.atualizar_datas(["posicao", "frequencia_calibracao", "data_ultima_calibracao"])
                update_fields = [
                    "data_ultima_calibracao",
                    "data_proxima_calibracao",
                    "data_utilizacao",
                ]

            instrumento.save(update_fields=update_fields)
        
    class Meta:
        verbose_name = "Calibração"
        verbose_name_plural = "Calibrações"


class TipoServico(models.TextChoices):
    ACREDITADO = "A", _("Acreditado")
    NAO_ACREDITADO = "NA", _("Não acreditado")
    INTERNO = "I", _("Interno")


class TipoSinal(models.TextChoices):
    ANALOGICO = "A", _("Analógico")
    DIGITAL = "D", _("Digital")


class CapacidadeMedicao(models.Model):
    valor = models.FloatField()
    unidade = models.CharField(
        max_length=16,
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Capacidade de medição"
        verbose_name_plural = "Capacidades de medição"

    def __str__(self):
        return f"{self.valor} {self.unidade}"


class InstrumentoBaseCliente(models.Model):
    """
    Model to relate instruments with clients, allowing clients to have access to specific instruments
    """
    instrumento = models.ForeignKey(
        "Instrumento",
        on_delete=models.CASCADE,
        related_name="clientes_acesso",
        verbose_name="Instrumento"
    )
    cliente = models.ForeignKey(
        "clientes.Cliente",
        on_delete=models.CASCADE,
        related_name="instrumentos_disponiveis",
        verbose_name="Cliente"
    )
    ativo = models.BooleanField(
        default=True,
        verbose_name="Ativo",
        help_text="Se o cliente tem acesso a este instrumento"
    )
    data_criacao = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Data de criação"
    )

    class Meta:
        verbose_name = "Instrumento Base do Cliente"
        verbose_name_plural = "Instrumentos Base dos Clientes"
        unique_together = ['instrumento', 'cliente']

    def __str__(self):
        return f"{self.cliente.empresa.razao_social} - {self.instrumento.tipo_de_instrumento.descricao}"


class Instrumento(models.Model):
    maximo = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Máximo",
        null=True,
        blank=True,
    )
    minimo = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Mínimo/Absoluto",
        null=True,
        blank=True,
    )
    unidade = models.CharField(
        max_length=16,
        null=True,
        blank=True,
    )
    preco_calibracao_no_cliente = models.DecimalField(
        null=True,
        blank=True,
        max_digits=12,
        decimal_places=2,
        verbose_name="Preço calibração no cliente",
    )
    preco_calibracao_no_laboratorio = models.DecimalField(
        null=True,
        blank=True,
        max_digits=12,
        decimal_places=2,
        verbose_name="Preço calibração no laboratório",
    )
    tipo_de_servico = models.CharField(
        max_length=2,
        choices=TipoServico.choices,
        null=True,
        blank=True,
        verbose_name="Tipo de serviço",
    )
    tipo_sinal = models.CharField(
        max_length=1,
        choices=TipoSinal.choices,
        null=True,
        blank=True,
        verbose_name="Tipo de sinal",
    )
    capacidade_de_medicao = models.ForeignKey(
        CapacidadeMedicao,
        on_delete=models.SET_NULL,
        verbose_name="Capacidade de medição",
        null=True,
        blank=True,
    )
    procedimento_relacionado = models.ForeignKey(
        "procedimentos.Procedimento", on_delete=models.SET_NULL, null=True, blank=True
    )
    tipo_de_instrumento = models.ForeignKey(
        "TipoInstrumento",
        on_delete=models.CASCADE,
        related_name="intrumento",
        verbose_name="Tipo de instrumento",
    )

    def __str__(self):
        return f"{self.tipo_de_instrumento.descricao}: {self.minimo}-{self.maximo}"

    class Meta:
        verbose_name = "Instrumento"
        verbose_name_plural = "Instrumentos"

class TipoInstrumento(models.Model):
    descricao = models.CharField(max_length=512, verbose_name="Descrição")
    modelo = models.CharField(
        max_length=512,
        blank=True,
        null=True,
    )
    fabricante = models.CharField(
        max_length=512,
        blank=True,
        null=True,
    )
    resolucao = models.FloatField(
        verbose_name="Resolução",
        blank=True,
        null=True,
    )

    class Meta:
        verbose_name = "Tipo de instrumento"
        verbose_name_plural = "Tipos de instrumento"
        indexes = [
            models.Index(fields=['descricao']),
            models.Index(fields=['modelo']),
            models.Index(fields=['fabricante']),
        ]

    def __str__(self):
        return f"{self.descricao}"

class Setor(models.Model):
    nome = models.CharField(max_length=255)
    setor_pai = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subsetores',
        verbose_name='Setor pai'
    )
    cliente = models.ForeignKey(
        "clientes.Cliente", 
        on_delete=models.CASCADE, 
        related_name="setores",
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"{self.nome}"

    class Meta:
        verbose_name = "Setor"
        verbose_name_plural = "Setores"

    def delete(self, *args, **kwargs):
        self.instrumentos.all().delete()

        for subsetor in self.subsetores.all():
            subsetor.delete()

        super().delete(*args, **kwargs)    

class Frequencia(models.Model):
    PERIODO_CHOICES = [
        ('dia', 'dia'),
        ('mes', 'mes'),
        ('ano', 'ano'),
    ]

    quantidade = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(366)],
        help_text="Valor entre 0 e 366"
    )
    periodo = models.CharField(
        max_length=10,
        choices=PERIODO_CHOICES,
        help_text="Escolha um período"
    )

    def __str__(self):
        return f"{self.quantidade} {self.periodo}"

class Normativo(models.Model):
    nome = models.CharField(max_length=255)
    cliente = models.ForeignKey(
        "clientes.Cliente",
        on_delete=models.CASCADE,
        related_name="normativos",
        null=True,
        blank=True,
    )


    def __str__(self):
        return f"{self.nome} ({self.cliente})"