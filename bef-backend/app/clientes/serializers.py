from django.contrib.auth.models import Group, User
from .models import UserProfile
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import datetime
from enderecos.models import UF, Bairro, Cidade, Endereco
from enderecos.serializers import ReadEnderecoSerializer
from .models import Cliente, Empresa, Unidade, Convite
from instrumentos.models import Instrumento, InstrumentoDoCliente, TipoInstrumento
from propostas.models import Proposta
from documentos.models import Documento, Revisao

class LoginSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super(LoginSerializer, cls).get_token(user)
        token["nome"] = (
            user.first_name or user.username
        )
        token["admin"] = user.is_staff
        token["cliente"] = user.clientes.first().id if user.clientes.exists() else user.id
        return token


class RegisterBasicsSerializer(serializers.Serializer):
    empresa = serializers.BooleanField(default=False, write_only=True)
    razao_social = serializers.CharField(
        required=False,
        write_only=True,
        validators=[UniqueValidator(queryset=Empresa.objects.all())],
    )
    cnpj = serializers.CharField(
        required=False,
        write_only=True,
        validators=[UniqueValidator(queryset=Empresa.objects.all())],
    )
    ie = serializers.CharField(required=False, allow_null=True, write_only=True)
    nome_fantasia = serializers.CharField(
        required=False, allow_null=True, write_only=True
    )
    filial = serializers.CharField(required=False, allow_null=True, write_only=True)

    def create(self, validated_data):
        empresa = None
        if validated_data.get("empresa"):
            empresa, created = Empresa.objects.get_or_create(
                razao_social=validated_data.get("razao_social"),
                cnpj=validated_data.get("cnpj"),
                ie=validated_data.get("ie"),
                nome_fantasia=validated_data.get("nome_fantasia"),
                filial=validated_data.get("filial"),
            )
        cliente = Cliente.objects.create(
            empresa=empresa,
        )

        return cliente


class RegisterLocationSerializer(serializers.Serializer):
    cliente_id = serializers.IntegerField(write_only=True)

    uf = serializers.CharField(write_only=True)
    cidade = serializers.CharField(write_only=True)
    bairro = serializers.CharField(write_only=True)
    logradouro = serializers.CharField(write_only=True)
    numero = serializers.IntegerField(write_only=True)
    complemento = serializers.CharField(required=False, write_only=True)
    cep = serializers.CharField(write_only=True)

    def create(self, validated_data):
        cliente = Cliente.objects.get(id=validated_data["cliente_id"])

        uf, created = UF.objects.get_or_create(sigla=validated_data.get("uf"))
        cidade, created = Cidade.objects.get_or_create(
            uf=uf, nome=validated_data.get("cidade")
        )
        bairro, created = Bairro.objects.get_or_create(
            cidade=cidade, nome=validated_data.get("bairro")
        )
        endereco, created = Endereco.objects.get_or_create(
            cep=validated_data.get("cep"),
            numero=validated_data.get("numero"),
            bairro=bairro,
            logradouro=validated_data.get("logradouro"),
            complemento=validated_data.get("complemento", ""),
        )
        cliente.endereco = endereco
        cliente.save()

        return cliente


class RegisterAuthSerializer(serializers.Serializer):
    cliente_id = serializers.IntegerField(write_only=True)

    username = serializers.CharField(
        required=True, validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    first_name = serializers.CharField(required=False)
    terms_accepted = serializers.BooleanField(required=True, write_only=True)

    def create(self, validated_data):
        cliente = Cliente.objects.get(id=validated_data["cliente_id"])
        grupo = Group.objects.get(name="gerente")
        
        user = User.objects.create(
            username=validated_data["username"],
            first_name=validated_data["first_name"]
        )
        user.groups.add(grupo)
        user.set_password(validated_data["password"])
        user.save()
        
        UserProfile.objects.create(
            user=user,
            terms_accepted=validated_data["terms_accepted"]
        )

        cliente.usuarios.add(user)
        cliente.save()

        return user


class EmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = "__all__"


class UnidadeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unidade
        fields = "__all__"


class GroupSerializer(serializers.ModelSerializer):    
    class Meta:
        model = Group
        fields = ('name', 'id')


class UserSerializer(serializers.ModelSerializer):
    groups = GroupSerializer(many=True)
    
    class Meta:
        model = User
        fields = ["id", "groups", "username", "first_name", "is_staff"]


class ClientesSerializer(serializers.ModelSerializer):
    empresa = serializers.SerializerMethodField()

    class Meta:
        model = Cliente
        fields = (
            "id",
            'empresa'
        )
    
    def get_empresa(self, obj):
        if obj.empresa:
            return f"{obj.empresa.razao_social} - {obj.empresa.nome_fantasia}" if obj.empresa.nome_fantasia else obj.empresa.razao_social
        return None


class ClienteSerializer(serializers.ModelSerializer):
    endereco = ReadEnderecoSerializer()
    empresa = EmpresaSerializer()
    usuarios = UserSerializer(many=True)

    class Meta:
        model = Cliente
        fields = (
            "id",
            "empresa",
            "endereco",
            "usuarios",
            "instrumentos_vencidos",
            "instrumentos_em_dia",
            "instrumentos_cadastrados",
            "propostas_aguardando_aprovacao",
            "criterio_frequencia_padrao"
        )


class ConviteSerializer(serializers.ModelSerializer):
    grupo = GroupSerializer()
    criado_por = UserSerializer()
    expira_em = serializers.SerializerMethodField()

    class Meta:
        model = Convite
        fields = ["id", "token_jti", "grupo", "criado_por", "criado_em", "usado", "cliente", 'expira_em']
        read_only_fields = ["id", "token_jti", "criado_por", "criado_em", "usado", 'expira_em'] 

    def get_expira_em(self, obj):
        return obj.criado_em + datetime.timedelta(8)
    

class DashboardTipoInstrumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoInstrumento
        fields = [
            "descricao",
            "modelo",
            "fabricante",
        ]
        

class DashboardInstrumentoSerializer(serializers.ModelSerializer):
    tipo_de_instrumento = DashboardTipoInstrumentoSerializer()

    class Meta:
        model = Instrumento
        fields = [
            "tipo_de_instrumento",
            "maximo",
            "minimo",
            "unidade",
        ]


class DashboardInstrumentoDoClienteSerializer(serializers.ModelSerializer):
    instrumento = DashboardInstrumentoSerializer()
    
    class Meta:
        model = InstrumentoDoCliente
        fields = (
            "instrumento",
            "tag",
            "data_proxima_calibracao",
            "data_ultima_calibracao",
            "id",
            "expirado",
            "setor",
        )


class DashboardClienteSerializer(serializers.ModelSerializer):
    empresa = serializers.SerializerMethodField()

    class Meta:
        model = Cliente
        fields = (
            "id",
            "empresa",
        )

    def get_empresa(self, obj):
        return obj.empresa.razao_social


class DasboardPropostaSerializer(serializers.ModelSerializer):
    cliente = DashboardClienteSerializer()

    class Meta:
        model = Proposta
        fields = (
            "cliente",
            "data_criacao",
            "status",
            "id",
            "numero",
        )


class DashboardDocumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Documento
        fields = (
            "id",
            "titulo",
            "analise_critica",
        )


class DashboardRevisaoSerializer(serializers.ModelSerializer):
    documento = DashboardDocumentoSerializer()

    class Meta:
        model = Revisao
        fields = (
            "id",
            "alteracao",
            "documento",
            "tipo",
        )


class ResetPasswordRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class ResetPasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    confirm_password = serializers.CharField(write_only=True, required=True)