from django.contrib.auth.models import Group, User
from rest_framework import filters, generics, permissions, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django_filters.rest_framework import DjangoFilterBackend
from instrumentos.models import InstrumentoDoCliente
from propostas.models import Proposta
from documentos.models import Documento, Revisao, Aprovacao
from .models import Cliente, Convite, PasswordReset
from .serializers import (
    ClienteSerializer,
    ClientesSerializer,
    LoginSerializer,
    RegisterAuthSerializer,
    RegisterBasicsSerializer,
    RegisterLocationSerializer,
    UserSerializer,
    ConviteSerializer,
    GroupSerializer,
    DashboardInstrumentoDoClienteSerializer,
    DasboardPropostaSerializer,
    DashboardRevisaoSerializer,
    ResetPasswordRequestSerializer,
    ResetPasswordSerializer,
)
from .tasks import enviar_email_reset_senha
import logging

logger = logging.getLogger(__name__)
from rest_framework.views import APIView
from rest_framework.decorators import action
import jwt
import uuid
from django.conf import settings
from django.utils import timezone
import os
from .tasks import update_clients, update_dashboard_stats
from .permissions import NivelPermission
from rest_framework.decorators import action
from .mixins import ClienteScopedQuerysetMixin
from django.db.models import Exists, OuterRef
from django.contrib.auth.tokens import PasswordResetTokenGenerator


class LoginView(TokenObtainPairView):
    permission_classes = (AllowAny,)
    serializer_class = LoginSerializer


class RegisterBasicsView(generics.CreateAPIView):
    queryset = Cliente.objects.all()
    permission_classes = (AllowAny,)
    authentication_classes = []
    serializer_class = RegisterBasicsSerializer

    def post(self, request, *args, **kwargs):
        serializer = RegisterBasicsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cliente = serializer.save()

        return Response(cliente.id, status=status.HTTP_201_CREATED)


class RegisterLocationView(generics.CreateAPIView):
    queryset = Cliente.objects.all()
    permission_classes = (AllowAny,)
    authentication_classes = []
    serializer_class = RegisterLocationSerializer


class RegisterAuthView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    authentication_classes = []
    serializer_class = RegisterAuthSerializer


class ClienteViewSet(viewsets.ModelViewSet):
    serializer_class = ClienteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ["empresa__razao_social", "empresa__nome_fantasia"]

    def get_serializer_class(self):
        if self.action in ['list', 'create']:
            return ClientesSerializer
        return ClienteSerializer

    def get_queryset(self):
        if self.request.user.is_staff:
            return Cliente.objects.filter(usuarios__is_staff=False).distinct()
        return Cliente.objects.filter(usuarios=self.request.user)
        
    @action(detail=True, methods=["patch"], permission_classes=[NivelPermission])
    def atualizar_criterio_frequencia_padrao(self, request, pk=None):
        cliente = self.get_object()
        criterio = request.data.get("criterio_frequencia")
        cliente.criterio_frequencia_padrao = criterio
        cliente.save(update_fields=["criterio_frequencia_padrao"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserAdminViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer

    def get_queryset(self):
        queryset = User.objects.all()
        
        # Filtrar por is_staff se o parâmetro for passado
        is_staff = self.request.query_params.get('is_staff', None)
        if is_staff is not None:
            is_staff_bool = is_staff.lower() in ('true', '1', 'yes')
            queryset = queryset.filter(is_staff=is_staff_bool)
        
        return queryset.order_by('first_name', 'username')


class DashboardViewSet(viewsets.ViewSet):
    def list(self, request):
        user = request.user
        if user.is_staff:
            return Response(
                {
                    "instrumentos_vencidos": InstrumentoDoCliente.objects.filter(
                        expirado=True
                    ).count(),
                    "instrumentos_em_dia": InstrumentoDoCliente.objects.filter(
                        expirado=False
                    ).count(),
                    "documentos_vencidos": Documento.objects.filter(
                        vencido=True
                    ).count(),
                    "propostas_em_elaboracao": Proposta.objects.filter(
                        status="E"
                    ).count(),
                    "revisoes_a_serem_aprovadas": DashboardRevisaoSerializer(
                        Revisao.objects
                        .filter(aprovadores=request.user)
                        .annotate(
                            ja_aprovou=Exists(
                                Aprovacao.objects.filter(revisao_id=OuterRef('pk'),
                                aprovador_id=request.user.id)
                            )
                        )
                        .filter(ja_aprovou=False)
                        .select_related('documento')
                        .order_by('documento__analise_critica', 'documento_id'),
                        many=True,
                    ).data,
                    "ultimas_propostas": DasboardPropostaSerializer(
                        Proposta.objects
                        .all()
                        .select_related('cliente')
                        .order_by("-pk")[:5], many=True
                    ).data,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "instrumentos_vencidos": user.clientes.first().instrumentos_vencidos,
                "instrumentos_em_dia": user.clientes.first().instrumentos_em_dia,
                "instrumentos_cadastrados": user.clientes.first().instrumentos_cadastrados,
                "propostas_aguardando_aprovacao": user.clientes.first().propostas_aguardando_aprovacao,
                "instrumentos_recentes": DashboardInstrumentoDoClienteSerializer(
                    user.clientes.first().instrumentos.select_related('instrumento', 'instrumento__tipo_de_instrumento').order_by("-pk")[:5], many=True
                ).data,
                "ultimas_propostas": DasboardPropostaSerializer(
                    user.clientes.first().propostas.select_related('cliente').order_by("-pk")[:5], many=True
                ).data,
                "revisoes_a_serem_aprovadas": DashboardRevisaoSerializer(
                    Revisao.objects
                    .filter(aprovadores=request.user)
                    .annotate(
                        ja_aprovou=Exists(
                            Aprovacao.objects.filter(revisao_id=OuterRef('pk'),
                            aprovador_id=request.user.id)
                        )
                    )
                    .filter(ja_aprovou=False)
                    .select_related('documento')
                    .order_by('documento__analise_critica', 'documento_id'),
                    many=True,
                ).data,
                "documentos_vencidos": Documento.objects.filter(
                    vencido=True, cliente=user.clientes.first()
                ).count(),
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def update_stats(self, request):
        user = request.user
        
        if not user.clientes.exists():
            return Response(
                {'error': 'User has no associated client'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cliente = user.clientes.first()
        
        update_dashboard_stats(cliente.id)
        
        return Response(
            {
                'message': 'Statistics update started',
            },
            status=status.HTTP_202_ACCEPTED
        )


def gerar_token_convite(grupo_id, criado_por_id, cliente_id):
    jti = str(uuid.uuid4())
    payload = {
        "jti": jti,
        "grupo_id": grupo_id,
        "criado_por": criado_por_id,
        "cliente_id": cliente_id,
        "type": "invite",
        "exp": timezone.now() + timezone.timedelta(days=7)
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    return token, jti


class GrupoViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    permission_classes = (IsAuthenticated, NivelPermission)
    serializer_class = GroupSerializer


class ConviteViewSet(ClienteScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Convite.objects.all().order_by("-criado_em")
    permission_classes = (IsAuthenticated, NivelPermission)
    serializer_class = ConviteSerializer
    pagination_class = None
    cliente_field = "cliente"


class CriarConviteView(APIView):
    permission_classes = [IsAuthenticated, NivelPermission]

    def post(self, request):
        grupo_id = request.data.get("grupo")
        cliente_id = request.data.get("cliente")

        if not grupo_id or not cliente_id:
            return Response({"error": "grupo_id e cliente_id são obrigatórios"}, status=400)

        token, jti = gerar_token_convite(grupo_id, request.user.id, cliente_id)

        invite = Convite.objects.create(
            token_jti=jti,
            grupo_id=grupo_id,
            criado_por=request.user,
            cliente_id=cliente_id
        )
        site = settings.SITE
        invite_url = f"{site}/#/register/invite/{token}"

        return Response({
            "convite_url": invite_url,
            "convite": ConviteSerializer(invite).data
        })


class RegistroDoConviteView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, token):
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return Response({"error": "Convite expirado"}, status=400)
        except jwt.InvalidTokenError:
            return Response({"error": "Token inválido"}, status=400)

        if payload.get("type") != "invite":
            return Response({"error": "Token inválido"}, status=400)

        try:
            convite = Convite.objects.get(token_jti=payload["jti"])
        except Convite.DoesNotExist:
            return Response({"error": "Convite não encontrado"}, status=404)

        if convite.usado:
            return Response({"error": "Convite já utilizado"}, status=400)

        name = request.data.get("first_name")
        email = request.data.get("username")
        password = request.data.get("password")

        if not all([name, email, password]):
            return Response({"error": "Campos obrigatórios: nome, email, senha"}, status=400)

        user = User.objects.create_user(
            first_name=name,
            username=email,
            password=password
        )

        group = Group.objects.get(id=payload["grupo_id"])
        user.groups.add(group)

        cliente = Cliente.objects.get(id=payload["cliente_id"])
        cliente.usuarios.add(user)  
        cliente.save()
        convite.usado = True
        convite.save()

        return Response({"success": "Usuário criado com sucesso"})


class RequestPasswordReset(generics.GenericAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = ResetPasswordRequestSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        email = request.data['email']
        
        user = User.objects.filter(username__iexact=email).first()

        if user:
            token_generator = PasswordResetTokenGenerator()
            token = token_generator.make_token(user) 
            reset = PasswordReset.objects.create(email=email, token=token)

            reset_url = f"{settings.SITE}/#/reset-password/{token}"

            nome = user.first_name or user.username
            
            logger.info(f"Enviando email de reset para {email}, nome: {nome}, url: {reset_url}")
            
            try:
                enviar_email_reset_senha.apply_async(args=[email, nome, reset_url])
                logger.info(f"Email enviado com sucesso para {email}")
            except Exception as e:
                logger.error(f"Erro ao enviar email: {str(e)}")
        else:
            logger.info(f"Tentativa de reset para email não cadastrado: {email}")

        return Response({
            'success': 'Se o email estiver cadastrado, você receberá um link para resetar sua senha.'
        }, status=status.HTTP_200_OK)


class ResetPassword(generics.GenericAPIView):
    serializer_class = ResetPasswordSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, token):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        new_password = data['new_password']
        confirm_password = data['confirm_password']
        
        if new_password != confirm_password:
            return Response({"error": "As senhas não coincidem"}, status=400)
        
        reset_obj = PasswordReset.objects.filter(token=token).first()
        
        if not reset_obj:
            return Response({'error':'Token inválido'}, status=400)
        
        user = User.objects.filter(username=reset_obj.email).first()
        
        if user:
            user.set_password(request.data['new_password'])
            user.save()
            
            reset_obj.delete()
            
            return Response({'success':'Senha atualizada'}, status=status.HTTP_200_OK)
        else: 
            return Response({'error':'Usuário não encontrado'}, status=404)