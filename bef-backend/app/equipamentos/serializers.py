from rest_framework import serializers
from .models import Equipamento, EquipamentoImagem, Categoria, EquipamentoCaracteristica

class EquipamentoImagemSerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipamentoImagem
        fields = ['id', 'imagem',]

class EquipamentoCaracteristicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipamentoCaracteristica
        fields = ['id', 'descricao']


class EquipamentoSerializer(serializers.ModelSerializer):
    imagens = EquipamentoImagemSerializer(many=True, read_only=True)
    midia = serializers.SerializerMethodField()
    caracteristicas = EquipamentoCaracteristicaSerializer(many=True)

    class Meta:
        model = Equipamento
        fields = [
            'id', 
            'nome', 
            'modelo', 
            'fabricante', 
            'descricao', 
            'caracteristicas', 
            'video_url', 
            'imagens', 
            'midia',
            'caracteristicas',
            'manual_url'
        ]

    def get_midia(self, obj):
        media_list = []

        for img in obj.imagens.all():
            media_list.append({
                'type': 'image',
                'url': img.imagem,
            })


        if obj.video_url:
            media_list.append({
                'type': 'video_url',
                'url': obj.video_url
            })

        return media_list
    

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nome', 'explicacao', 'equipamentos']
