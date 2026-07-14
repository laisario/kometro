# Generated manually for public blog post attachment storage.

from django.db import migrations, models
import rkp_platform.storage_backends


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0007_arquivopost"),
    ]

    operations = [
        migrations.AlterField(
            model_name="arquivopost",
            name="arquivo",
            field=models.FileField(
                storage=rkp_platform.storage_backends.BlogPublicMediaStorage(),
                upload_to="blog/posts/arquivos/",
            ),
        ),
    ]
