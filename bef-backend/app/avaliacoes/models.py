from django.db import models


class Avaliacao(models.Model):
    nome = models.CharField(max_length=100)
    empresa = models.CharField(max_length=100, blank=True)
    foto = models.ImageField(upload_to="avaliacoes/", blank=True, null=True)
    comentario = models.TextField()
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nome} - {self.empresa or 'Sem empresa'}"
