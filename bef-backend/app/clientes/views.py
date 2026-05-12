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
    ClienteCreateSerializer,
    ClienteUpdateSerializer,
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
        if self.action == 'create':
            return ClienteCreateSerializer
        if self.action in ['update', 'partial_update']:
            return ClienteUpdateSerializer
        if self.action in ['list']:
            return ClientesSerializer
        return ClienteSerializer

    def get_queryset(self):
        if self.request.user.is_staff:
            return Cliente.objects.exclude(usuarios__is_staff=True).distinct()
        return Cliente.objects.filter(usuarios=self.request.user)

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response(
                {"detail": "Only staff users can create clients."},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cliente = serializer.save()
        return Response(
            ClienteSerializer(cliente).data,
            status=status.HTTP_201_CREATED
        )
        
    @action(detail=True, methods=["patch"], permission_classes=[NivelPermission])
    def atualizar_criterio_frequencia_padrao(self, request, pk=None):
        cliente = self.get_object()
        criterio = request.data.get("criterio_frequencia")
        cliente.criterio_frequencia_padrao = criterio
        cliente.save(update_fields=["criterio_frequencia_padrao"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["delete"], url_path="usuarios/(?P<user_id>[^/.]+)")
    def remover_usuario(self, request, pk=None, user_id=None):
        try:
            cliente = Cliente.objects.get(pk=pk)
        except Cliente.DoesNotExist:
            return Response(
                {"detail": "Cliente não encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "Usuário não encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )

        if not cliente.usuarios.filter(pk=user_id).exists():
            return Response(
                {"detail": "Usuário não está vinculado a este cliente"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user == request.user:
            return Response(
                {"detail": "Não é possível remover seu próprio acesso"},
                status=status.HTTP_400_BAD_REQUEST
            )

        is_staff = request.user.is_staff
        is_gerente = request.user.groups.filter(name='gerente').exists()
        user_in_same_client = cliente.usuarios.filter(pk=request.user.id).exists()

        if not is_staff and not (is_gerente and user_in_same_client):
            return Response(
                {"detail": "Apenas administradores ou gerentes deste cliente podem remover usuários."},
                status=status.HTTP_403_FORBIDDEN
            )

        user.delete()

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


def gerar_token_convite(grupo_id, criado_por_id, cliente_id, para_equipe=False):
    jti = str(uuid.uuid4())
    payload = {
        "jti": jti,
        "grupo_id": grupo_id,
        "criado_por": criado_por_id,
        "cliente_id": cliente_id,
        "para_equipe": para_equipe,
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
        origin = request.data.get("origin", "access_page")

        if not grupo_id:
            return Response({"error": "grupo_id é obrigatório"}, status=400)

        inviter_is_staff = request.user.is_staff

        if inviter_is_staff:
            cliente_id = request.data.get("cliente")
        else:
            cliente_id = request.data.get("cliente")
            if not cliente_id:
                user_clientes = request.user.clientes.all()
                if user_clientes.count() == 1:
                    cliente_id = user_clientes.first().id
                elif user_clientes.count() > 1:
                    return Response({"error": "Especifique o cliente para criar convite"}, status=400)
                else:
                    return Response({"error": "Usuário não está vinculado a nenhum cliente"}, status=400)
            if not request.user.clientes.filter(id=cliente_id).exists():
                return Response({"error": "Não autorizado a criar convite para este cliente"}, status=403)

        if origin == "client_page":
            para_equipe = False
        elif origin == "access_page":
            para_equipe = inviter_is_staff
        else:
            para_equipe = False

        token, jti = gerar_token_convite(grupo_id, request.user.id, cliente_id, para_equipe=para_equipe)

        invite = Convite.objects.create(
            grupo_id=grupo_id,
            criado_por=request.user,
            cliente_id=cliente_id,
            token=token,
            token_jti=jti,
        )
        invite_url = invite.get_invite_url()

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

        para_equipe = payload.get("para_equipe", False)

        user = User.objects.create_user(
            first_name=name,
            username=email,
            password=password,
            is_staff=para_equipe,
        )

        group = Group.objects.get(id=payload["grupo_id"])
        user.groups.add(group)

        if not para_equipe:
            cliente_id = payload.get("cliente_id")
            if not cliente_id:
                return Response({"error": "Convite inválido: cliente não especificado"}, status=400)
            cliente = Cliente.objects.get(id=cliente_id)
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