from django.db import models


class UF(models.Model):
    sigla = models.CharField(max_length=2)

    def __str__(self):
        return self.sigla

    class Meta:
        verbose_name = "UF"
        verbose_name_plural = "UFs"


class Cidade(models.Model):
    nome = models.CharField(max_length=212)
    uf = models.ForeignKey(
        UF, on_delete=models.CASCADE, related_name="cidades", verbose_name="UF"
    )

    def __str__(self):
        return self.nome


class Bairro(models.Model):
    nome = models.CharField(max_length=212)
    cidade = models.ForeignKey(Cidade, on_delete=models.CASCADE, related_name="bairros")

    def __str__(self):
        return self.nome


class Endereco(models.Model):
    cep = models.CharField(max_length=10, verbose_name="CEP")
    numero = models.IntegerField(verbose_name="Número")
    bairro = models.ForeignKey(Bairro, on_delete=models.CASCADE)
    logradouro = models.TextField()
    complemento = models.TextField(null=True, blank=True)

    def __str__(self):
        return "{}, {} - {} - {}: {}".format(
            self.logradouro,
            self.numero,
            self.bairro.cidade.nome,
            self.bairro.cidade.uf.sigla,
            self.cep,
        )

    class Meta:
        verbose_name = "Endereço"
