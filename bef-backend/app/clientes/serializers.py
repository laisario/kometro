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
from instrumentos.models import Calibracao, Instrumento, InstrumentoDoCliente, ResultadoCalibracao, TipoInstrumento
from propostas.models import Proposta
from documentos.models import Documento, Revisao
import logging
from .logging_utils import mask_sensitive_data

logger = logging.getLogger(__name__)

class LoginSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super(LoginSerializer, cls).get_token(user)
        token["nome"] = (
            user.first_name or user.username
        )
        token["admin"] = user.is_staff
        token["cliente"] = user.clientes.first().id if user.clientes.exists() else None
        
        cliente = user.clientes.first()
        if cliente and cliente.empresa:
            token["empresa_nome"] = cliente.empresa.razao_social or cliente.empresa.nome_fantasia or None
        else:
            token["empresa_nome"] = None
        
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
    usuarios = serializers.SerializerMethodField()

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

    def get_usuarios(self, obj):
        return UserSerializer(obj.usuarios.filter(is_active=True), many=True).data

    def update(self, instance, validated_data):
        empresa_data = validated_data.get("empresa")
        endereco_data = validated_data.get("endereco")
        criterio = validated_data.get("criterio_frequencia_padrao")

        if criterio is not None:
            instance.criterio_frequencia_padrao = criterio
            instance.save()

        if empresa_data and instance.empresa:
            empresa = instance.empresa
            if empresa_data.get("razao_social") is not None:
                empresa.razao_social = empresa_data.get("razao_social")
            if empresa_data.get("cnpj") is not None:
                empresa.cnpj = empresa_data.get("cnpj")
            if "ie" in empresa_data:
                empresa.ie = empresa_data.get("ie")
            if "nome_fantasia" in empresa_data:
                empresa.nome_fantasia = empresa_data.get("nome_fantasia")
            if "filial" in empresa_data:
                empresa.filial = empresa_data.get("filial")
            if "isento" in empresa_data:
                empresa.isento = empresa_data.get("isento")
            empresa.save()

        if endereco_data and instance.endereco:
            endereco = instance.endereco
            
            has_geo_update = (
                endereco_data.get("uf") is not None or 
                endereco_data.get("cidade") is not None or 
                endereco_data.get("bairro") is not None
            )
            
            if has_geo_update:
                old_uf = endereco.bairro.cidade.uf
                old_cidade = endereco.bairro.cidade
                old_bairro = endereco.bairro
                
                new_uf = old_uf
                new_cidade = old_cidade
                new_bairro = old_bairro
                
                if endereco_data.get("uf") is not None:
                    new_uf, _ = UF.objects.get_or_create(sigla=endereco_data.get("uf"))
                
                if endereco_data.get("cidade") is not None:
                    new_cidade, _ = Cidade.objects.get_or_create(uf=new_uf, nome=endereco_data.get("cidade"))
                
                if endereco_data.get("bairro") is not None:
                    new_bairro, _ = Bairro.objects.get_or_create(cidade=new_cidade, nome=endereco_data.get("bairro"))
                elif new_cidade != old_cidade:
                    new_bairro, _ = Bairro.objects.get_or_create(cidade=new_cidade, nome="Centro")
                
                endereco.bairro = new_bairro
            
            if endereco_data.get("logradouro") is not None:
                endereco.logradouro = endereco_data.get("logradouro")
            if endereco_data.get("numero") is not None:
                endereco.numero = endereco_data.get("numero")
            if "complemento" in endereco_data:
                endereco.complemento = endereco_data.get("complemento")
            if endereco_data.get("cep") is not None:
                endereco.cep = endereco_data.get("cep")
            endereco.save()

        return instance


class ConviteSerializer(serializers.ModelSerializer):
    grupo = GroupSerializer()
    criado_por = UserSerializer()
    expira_em = serializers.SerializerMethodField()
    convite_url = serializers.SerializerMethodField()

    class Meta:
        model = Convite
        fields = ["id", "token_jti", "token", "grupo", "criado_por", "criado_em", "usado", "cliente", 'expira_em', 'convite_url']
        read_only_fields = ["id", "token_jti", "token", "criado_por", "criado_em", "usado", 'expira_em', 'convite_url']

    def get_expira_em(self, obj):
        return obj.criado_em + datetime.timedelta(8)
    
    def get_convite_url(self, obj):
        if obj.token:
            return obj.get_invite_url()
        return ""
    

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


class DashboardResultadoCalibracaoReprovadoSerializer(serializers.ModelSerializer):
    criterio_tipo = serializers.SerializerMethodField()
    criterio_de_aceitacao = serializers.SerializerMethodField()
    unidade = serializers.SerializerMethodField()

    class Meta:
        model = ResultadoCalibracao
        fields = (
            "id",
            "status",
            "maior_erro",
            "incerteza",
            "criterio_tipo",
            "criterio_de_aceitacao",
            "unidade",
        )

    def get_criterio_tipo(self, obj):
        return obj.criterio.tipo if obj.criterio else None

    def get_criterio_de_aceitacao(self, obj):
        if not obj.criterio:
            return None
        criterio = obj.criterio.criterio_de_aceitacao
        return str(criterio) if criterio is not None else None

    def get_unidade(self, obj):
        return obj.criterio.unidade if obj.criterio else None


class DashboardCalibracaoReprovadaSerializer(serializers.ModelSerializer):
    instrumento_id = serializers.IntegerField(source="instrumento.id")
    instrumento_tag = serializers.CharField(source="instrumento.tag", allow_null=True)
    instrumento_numero_de_serie = serializers.CharField(source="instrumento.numero_de_serie", allow_null=True)
    instrumento_descricao = serializers.CharField(
        source="instrumento.instrumento.tipo_de_instrumento.descricao",
        allow_null=True,
    )
    setor_id = serializers.IntegerField(source="instrumento.setor_id", allow_null=True)
    resultados_reprovados_count = serializers.SerializerMethodField()
    resultados_reprovados = serializers.SerializerMethodField()

    class Meta:
        model = Calibracao
        fields = (
            "id",
            "data",
            "ordem_de_servico",
            "instrumento_id",
            "instrumento_tag",
            "instrumento_numero_de_serie",
            "instrumento_descricao",
            "setor_id",
            "resultados_reprovados_count",
            "resultados_reprovados",
        )

    def _resultados_reprovados(self, obj):
        prefetched = getattr(obj, "resultados_reprovados_prefetch", None)
        if prefetched is not None:
            return prefetched
        return obj.resultados.filter(status="R").select_related("criterio")

    def get_resultados_reprovados_count(self, obj):
        return len(self._resultados_reprovados(obj))

    def get_resultados_reprovados(self, obj):
        return DashboardResultadoCalibracaoReprovadoSerializer(
            self._resultados_reprovados(obj),
            many=True,
        ).data


class ResetPasswordRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class ResetPasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    confirm_password = serializers.CharField(write_only=True, required=True)


class EnderecoNestedSerializer(serializers.Serializer):
    uf = serializers.CharField(required=False, max_length=2)
    cidade = serializers.CharField(required=False, max_length=212)
    bairro = serializers.CharField(required=False, max_length=212)
    logradouro = serializers.CharField(required=False, max_length=255)
    numero = serializers.IntegerField(required=False)
    complemento = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=255)
    cep = serializers.CharField(required=False, max_length=10)


class EmpresaNestedSerializer(serializers.Serializer):
    razao_social = serializers.CharField(required=False, max_length=512)
    cnpj = serializers.CharField(required=False, max_length=25)
    ie = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=50)
    nome_fantasia = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=512)
    filial = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=512)
    isento = serializers.BooleanField(required=False, default=False)


class ClienteUpdateSerializer(serializers.Serializer):
    empresa = EmpresaNestedSerializer(required=False)
    endereco = EnderecoNestedSerializer(required=False)
    criterio_frequencia_padrao = serializers.ChoiceField(
        choices=["C", "S"],
        required=False,
    )

    def update(self, instance, validated_data):
        empresa_data = validated_data.get("empresa")
        endereco_data = validated_data.get("endereco")
        criterio = validated_data.get("criterio_frequencia_padrao")

        if criterio is not None:
            instance.criterio_frequencia_padrao = criterio
            instance.save()

        if empresa_data and instance.empresa:
            empresa = instance.empresa
            if empresa_data.get("razao_social") is not None:
                empresa.razao_social = empresa_data.get("razao_social")
            if empresa_data.get("cnpj") is not None:
                empresa.cnpj = empresa_data.get("cnpj")
            if "ie" in empresa_data:
                empresa.ie = empresa_data.get("ie")
            if "nome_fantasia" in empresa_data:
                empresa.nome_fantasia = empresa_data.get("nome_fantasia")
            if "filial" in empresa_data:
                empresa.filial = empresa_data.get("filial")
            if "isento" in empresa_data:
                empresa.isento = empresa_data.get("isento")
            empresa.save()

        if endereco_data and instance.endereco:
            endereco = instance.endereco
            
            has_geo_update = (
                endereco_data.get("uf") is not None or 
                endereco_data.get("cidade") is not None or 
                endereco_data.get("bairro") is not None
            )
            
            if has_geo_update:
                old_uf = endereco.bairro.cidade.uf
                old_cidade = endereco.bairro.cidade
                old_bairro = endereco.bairro
                
                new_uf = old_uf
                new_cidade = old_cidade
                new_bairro = old_bairro
                
                if endereco_data.get("uf") is not None:
                    new_uf, _ = UF.objects.get_or_create(sigla=endereco_data.get("uf"))
                
                if endereco_data.get("cidade") is not None:
                    new_cidade, _ = Cidade.objects.get_or_create(uf=new_uf, nome=endereco_data.get("cidade"))
                
                if endereco_data.get("bairro") is not None:
                    new_bairro, _ = Bairro.objects.get_or_create(cidade=new_cidade, nome=endereco_data.get("bairro"))
                elif new_cidade != old_cidade:
                    new_bairro, _ = Bairro.objects.get_or_create(cidade=new_cidade, nome="Centro")
                
                endereco.bairro = new_bairro
            
            if endereco_data.get("logradouro") is not None:
                endereco.logradouro = endereco_data.get("logradouro")
            if endereco_data.get("numero") is not None:
                endereco.numero = endereco_data.get("numero")
            if "complemento" in endereco_data:
                endereco.complemento = endereco_data.get("complemento")
            if endereco_data.get("cep") is not None:
                endereco.cep = endereco_data.get("cep")
            endereco.save()

        instance.refresh_from_db()
        return instance


class ClienteCreateSerializer(serializers.Serializer):
    empresa = EmpresaNestedSerializer(required=True)
    endereco = EnderecoNestedSerializer(required=True)
    criterio_frequencia_padrao = serializers.ChoiceField(
        choices=["C", "S"],
        required=False,
        default="C"
    )

    def create(self, validated_data):
        empresa_data = validated_data.get("empresa")
        endereco_data = validated_data.get("endereco")
        criterio = validated_data.get("criterio_frequencia_padrao", "C")
        logger.info(
            "[CLIENT_CREATE_SERIALIZER_START] validated_data=%s",
            mask_sensitive_data(validated_data),
        )

        try:
            empresa, empresa_created = Empresa.objects.get_or_create(
                cnpj=empresa_data.get("cnpj"),
                defaults={
                    "razao_social": empresa_data.get("razao_social"),
                    "ie": empresa_data.get("ie"),
                    "nome_fantasia": empresa_data.get("nome_fantasia"),
                    "filial": empresa_data.get("filial"),
                    "isento": empresa_data.get("isento", False),
                }
            )
            logger.info(
                "[CLIENT_CREATE_EMPRESA_READY] empresa_id=%s empresa_created=%s cnpj=%s",
                empresa.id,
                empresa_created,
                empresa_data.get("cnpj"),
            )

            uf, uf_created = UF.objects.get_or_create(sigla=endereco_data.get("uf"))
            cidade, cidade_created = Cidade.objects.get_or_create(uf=uf, nome=endereco_data.get("cidade"))
            bairro, bairro_created = Bairro.objects.get_or_create(cidade=cidade, nome=endereco_data.get("bairro"))
            logger.info(
                "[CLIENT_CREATE_LOCATION_READY] uf_id=%s uf_created=%s cidade_id=%s "
                "cidade_created=%s bairro_id=%s bairro_created=%s",
                uf.id,
                uf_created,
                cidade.id,
                cidade_created,
                bairro.id,
                bairro_created,
            )

            endereco, endereco_created = Endereco.objects.get_or_create(
                cep=endereco_data.get("cep"),
                numero=endereco_data.get("numero"),
                bairro=bairro,
                logradouro=endereco_data.get("logradouro"),
                defaults={"complemento": endereco_data.get("complemento", "")}
            )
            logger.info(
                "[CLIENT_CREATE_ENDERECO_READY] endereco_id=%s endereco_created=%s",
                endereco.id,
                endereco_created,
            )

            cliente = Cliente.objects.create(
                empresa=empresa,
                endereco=endereco,
                criterio_frequencia_padrao=criterio
            )
            logger.info(
                "[CLIENT_CREATE_SERIALIZER_SUCCESS] cliente_id=%s empresa_id=%s endereco_id=%s",
                cliente.id,
                empresa.id,
                endereco.id,
            )

            return cliente
        except Exception as exc:
            logger.exception(
                "[CLIENT_CREATE_SERIALIZER_EXCEPTION] error=%s validated_data=%s",
                exc,
                mask_sensitive_data(validated_data),
            )
            raise
