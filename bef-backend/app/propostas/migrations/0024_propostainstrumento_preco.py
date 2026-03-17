from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("propostas", "0023_proposta_tipo_servico"),
    ]

    operations = [
        migrations.AddField(
            model_name="propostainstrumento",
            name="preco",
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                help_text="Preço unitário deste item na proposta. Usado no cálculo do total.",
                max_digits=12,
                null=True,
                verbose_name="Preço",
            ),
        ),
    ]
