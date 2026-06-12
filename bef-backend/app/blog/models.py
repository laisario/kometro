import mimetypes
from pathlib import Path

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.files.storage import default_storage
from django.db import models
from djrichtextfield.models import RichTextField


BLOG_POST_FILE_ALLOWED_TYPES = {
    ".pdf": {"application/pdf"},
    ".xls": {"application/vnd.ms-excel"},
    ".xlsx": {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},
    ".ppt": {"application/vnd.ms-powerpoint"},
    ".pptx": {"application/vnd.openxmlformats-officedocument.presentationml.presentation"},
    ".doc": {"application/msword"},
    ".docx": {"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
    ".jpg": {"image/jpeg"},
    ".jpeg": {"image/jpeg"},
    ".png": {"image/png"},
}


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


class ArquivoPost(models.Model):
    post = models.ForeignKey(
        Post, on_delete=models.CASCADE, related_name="arquivos"
    )
    arquivo = models.FileField(upload_to="blog/posts/arquivos/")
    nome_original = models.CharField(max_length=255, blank=True)
    titulo = models.CharField(max_length=255, blank=True)
    tipo = models.CharField(max_length=100, blank=True, null=True)
    tamanho = models.PositiveIntegerField(blank=True, null=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["criado_em", "id"]

    def __str__(self):
        return self.titulo or self.nome_original or f"Arquivo de {self.post.titulo}"

    @property
    def extensao(self):
        return Path(self.nome_original or self.arquivo.name).suffix.lower().lstrip(".")

    def _get_content_type(self):
        if not self.arquivo:
            return None

        content_type = getattr(self.arquivo, "content_type", None)
        if content_type:
            return content_type

        file_obj = getattr(self.arquivo, "file", None)
        content_type = getattr(file_obj, "content_type", None)
        if content_type:
            return content_type

        guessed_type, _ = mimetypes.guess_type(self.arquivo.name)
        return guessed_type

    def clean(self):
        super().clean()

        if not self.arquivo:
            raise ValidationError({"arquivo": "Arquivo obrigatório."})

        extension = Path(self.arquivo.name).suffix.lower()
        allowed_extensions = getattr(
            settings,
            "BLOG_POST_FILE_ALLOWED_EXTENSIONS",
            BLOG_POST_FILE_ALLOWED_TYPES.keys(),
        )
        allowed_extensions = {ext.lower() for ext in allowed_extensions}

        if extension not in allowed_extensions:
            raise ValidationError(
                {"arquivo": f"Formato de arquivo não permitido: {extension or 'sem extensão'}."}
            )

        content_type = self._get_content_type()
        allowed_types = getattr(
            settings,
            "BLOG_POST_FILE_ALLOWED_MIME_TYPES",
            BLOG_POST_FILE_ALLOWED_TYPES,
        )

        if isinstance(allowed_types, dict):
            allowed_mimes = allowed_types.get(extension, set())
        else:
            allowed_mimes = set(allowed_types)

        if content_type and allowed_mimes and content_type not in allowed_mimes:
            raise ValidationError(
                {"arquivo": f"Tipo de arquivo não permitido: {content_type}."}
            )

        max_size_mb = getattr(settings, "BLOG_POST_FILE_MAX_SIZE_MB", 20)
        max_size = max_size_mb * 1024 * 1024
        size = getattr(self.arquivo, "size", None)

        if size and size > max_size:
            raise ValidationError(
                {"arquivo": f"O arquivo não pode ultrapassar {max_size_mb} MB."}
            )

    def save(self, *args, **kwargs):
        if self.arquivo:
            original_name = Path(self.nome_original or self.arquivo.name).name
            if not self.nome_original:
                self.nome_original = original_name
            if not self.titulo:
                self.titulo = Path(original_name).stem
            if not self.tipo:
                self.tipo = self._get_content_type()
            if not self.tamanho:
                self.tamanho = getattr(self.arquivo, "size", None)

        self.full_clean()
        super().save(*args, **kwargs)
