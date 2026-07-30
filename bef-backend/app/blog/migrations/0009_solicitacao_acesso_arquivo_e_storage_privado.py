from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0008_alter_arquivopost_arquivo"),
    ]

    operations = [
        migrations.CreateModel(
            name="SolicitacaoAcessoArquivoPost",
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
                ("nome", models.CharField(max_length=255)),
                ("empresa", models.CharField(max_length=255)),
                ("email", models.EmailField(max_length=254)),
                ("telefone", models.CharField(max_length=30)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                (
                    "arquivo",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="solicitacoes_acesso",
                        to="blog.arquivopost",
                    ),
                ),
            ],
            options={
                "verbose_name": "Solicitação de acesso a arquivo do post",
                "verbose_name_plural": "Solicitações de acesso a arquivos dos posts",
                "ordering": ["-criado_em", "-id"],
            },
        ),
    ]
