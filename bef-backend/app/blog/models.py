from django.db import models
from django.core.files.storage import default_storage
from djrichtextfield.models import RichTextField


class Categoria(models.Model):
    nome = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nome


class Post(models.Model):
    titulo = models.CharField(max_length=200)
    texto = RichTextField(blank=True, null=True)
    imagem_destaque = models.ImageField(upload_to="blog/posts/", blank=True, null=True)
    imagem_destaque_url = models.URLField(blank=True, null=True)
    categoria = models.ForeignKey(
        Categoria, on_delete=models.SET_NULL, null=True, related_name="posts"
    )
    publicado_em = models.DateTimeField(auto_now_add=True)
    visivel = models.BooleanField(default=True)
    resumo = models.TextField(null=True, blank=True)
    destaque = models.BooleanField(default=False)

    def __str__(self):
        return self.titulo
    
    def delete(self, *args, **kwargs):
        if self.imagem_destaque:
            default_storage.delete(self.imagem_destaque.name)
        super().delete(*args, **kwargs)

class ImagemExtra(models.Model):
    post = models.ForeignKey(
        Post, on_delete=models.CASCADE, related_name="imagens_adicionais"
    )
    imagem = models.URLField()

    def __str__(self):
        return f"Imagem extra de {self.post.titulo}"
    
    
class Video(models.Model):
    post = models.ForeignKey(
        Post, on_delete=models.CASCADE, related_name="videos_url"
    )
    url = models.URLField()

    def __str__(self):
        return f"Video de {self.post.titulo}"

