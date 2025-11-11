from rest_framework import serializers
from .models import Avaliacao


class AvaliacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Avaliacao
        fields = ["id", "nome", "empresa", "foto", "comentario", "criado_em"]
        read_only_fields = ["id", "criado_em"]
