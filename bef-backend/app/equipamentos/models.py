from django.db import models
from djrichtextfield.models import RichTextField

class Categoria(models.Model):
    nome = models.CharField(max_length=255)
    explicacao = RichTextField(blank=True, null=True)

    def __str__(self):
        return self.nome

class Equipamento(models.Model):
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, related_name="equipamentos")
    nome = models.CharField(max_length=255)
    modelo = models.CharField(max_length=100, blank=True)
    fabricante = models.CharField(max_length=255, blank=True)
    descricao = models.TextField(blank=True)
    video_url = models.URLField(blank=True, null=True)
    manual_url = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"{self.nome} ({self.modelo})"
    

class EquipamentoImagem(models.Model):
    equipamento = models.ForeignKey(Equipamento, on_delete=models.CASCADE, related_name="imagens")
    imagem = models.URLField()


class EquipamentoCaracteristica(models.Model):
    equipamento = models.ForeignKey(Equipamento, on_delete=models.CASCADE, related_name="caracteristicas")
    descricao = models.CharField(max_length=255)
  