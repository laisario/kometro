from rest_framework import serializers
from .models import Procedimento


class WriteProcedimentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Procedimento
        fields = "__all__"


class ReadProcedimentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Procedimento
        fields = "__all__"
