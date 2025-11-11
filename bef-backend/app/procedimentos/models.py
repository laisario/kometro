from django.db import models


class Procedimento(models.Model):
    codigo = models.CharField(max_length=250)
    descricao = models.CharField(max_length=250, null=True, blank=True)
    objetivo = models.CharField(max_length=250, null=True, blank=True)
    responsabilidade = models.CharField(max_length=250, null=True, blank=True)
    procedimentos_relacionados = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        verbose_name="Documentos relacionados",
        null=True,
        blank=True,
    )
    definicoes = models.TextField(null=True, blank=True)
    documentos_de_referencia = models.ManyToManyField(
        "documentos.DocumentoExterno", blank=True
    )

    def __str__(self):
        return f"{self.codigo} - {self.descricao}"
