from rest_framework import serializers

from .models import UF, Bairro, Cidade, Endereco


class ReadEnderecoSerializer(serializers.ModelSerializer):
    bairro = serializers.SerializerMethodField()
    cidade = serializers.SerializerMethodField()
    uf = serializers.SerializerMethodField()
    endereco_completo = serializers.SerializerMethodField()
    
    class Meta:
        model = Endereco
        fields = ["id", "logradouro", "numero", "complemento", "bairro", "cidade", "uf", "cep", "endereco_completo"]
    
    def get_bairro(self, obj):
        return obj.bairro.nome if obj.bairro else None
    
    def get_cidade(self, obj):
        return obj.bairro.cidade.nome if obj.bairro and obj.bairro.cidade else None
    
    def get_uf(self, obj):
        return obj.bairro.cidade.uf.sigla if obj.bairro and obj.bairro.cidade and obj.bairro.cidade.uf else None

    def get_endereco_completo(self, obj):
        if not obj.bairro or not obj.bairro.cidade or not obj.bairro.cidade.uf:
            return None
        
        parts = []
        
        # Logradouro e número
        if obj.logradouro and obj.numero:
            parts.append(f"{obj.logradouro}, {obj.numero}")
        elif obj.logradouro:
            parts.append(obj.logradouro)
        
        if obj.complemento:
            parts.append(obj.complemento)
        
        if obj.bairro and obj.bairro.nome:
            parts.append(obj.bairro.nome)
        
        if obj.bairro.cidade and obj.bairro.cidade.nome:
            parts.append(obj.bairro.cidade.nome)
        
        if obj.bairro.cidade.uf and obj.bairro.cidade.uf.sigla:
            parts.append(obj.bairro.cidade.uf.sigla)
        
        if obj.cep:
            parts.append(obj.cep)
        
        return " - ".join(parts) if parts else None

class WriteEnderecoSerializer(serializers.ModelSerializer):
    bairro = serializers.CharField(required=False, write_only=True)
    estado = serializers.CharField(required=False, write_only=True)
    cidade = serializers.CharField(required=False, write_only=True)

    class Meta:
        model = Endereco
        fields = "__all__"

    def validate(self, data):
        uf, created = UF.objects.get_or_create(sigla=data["estado"])
        cidade, created = Cidade.objects.get_or_create(nome=data["cidade"], uf=uf)
        bairro, created = Bairro.objects.get_or_create(
            nome=data["bairro"], cidade=cidade
        )
        del data["cidade"]
        del data["estado"]
        data["bairro"] = bairro
        return data