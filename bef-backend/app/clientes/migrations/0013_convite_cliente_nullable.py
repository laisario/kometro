from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("clientes", "0012_passwordreset"),
    ]

    operations = [
        migrations.AlterField(
            model_name="convite",
            name="cliente",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="invites",
                to="clientes.cliente",
            ),
        ),
    ]
