# Generated manually for blog post download files feature.

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0006_remove_post_video_arquivo_post_imagem_destaque_url_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="ArquivoPost",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "arquivo",
                    models.FileField(upload_to="blog/posts/arquivos/"),
                ),
                ("nome_original", models.CharField(blank=True, max_length=255)),
                ("titulo", models.CharField(blank=True, max_length=255)),
                ("tipo", models.CharField(blank=True, max_length=100, null=True)),
                ("tamanho", models.PositiveIntegerField(blank=True, null=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                (
                    "post",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="arquivos",
                        to="blog.post",
                    ),
                ),
            ],
            options={
                "ordering": ["criado_em", "id"],
            },
        ),
    ]

