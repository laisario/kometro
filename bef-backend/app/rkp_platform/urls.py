from django.conf import settings
from django.conf.urls.i18n import i18n_patterns
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from clientes.views import (
    ClienteViewSet,
    LoginView,
    RegisterAuthView,
    RegisterBasicsView,
    RegisterLocationView,
    UserAdminViewSet,
    DashboardViewSet,
    RegistroDoConviteView,
    CriarConviteView,
    GrupoViewSet,
    ConviteViewSet,
    ResetPassword,
    RequestPasswordReset,
)
from instrumentos.views import (
    InstrumentoDoClienteViewSet,
    InstrumentoViewSet,
    CalibracaoViewSet,
    SetorViewSet,
    NormativoViewSet,
    TipoInstrumentoViewSet,
)
from propostas.views import PropostaFileViewSet, PropostaViewSet
from documentos.views import DocumentoViewSet, RevisaoViewSet
from procedimentos.views import ProcedimentoViewSet
from blog.views import PostViewSet, CategoriaViewSet
from avaliacoes.views import AvaliacaoViewSet
from equipamentos.views import CategoriaEquipamentosViewSet, EquipamentosViewSet

router = DefaultRouter()
router.register(r"instrumentos", InstrumentoDoClienteViewSet, basename="instrumento")
router.register(r"propostas", PropostaViewSet, basename="proposta")
router.register(r"propostas-files", PropostaFileViewSet, basename="propostas-files")
router.register(r"instrumentos-empresa", InstrumentoViewSet, basename="instrumento-empresa")
router.register(r"clientes", ClienteViewSet, basename="cliente")
router.register(r"documentos", DocumentoViewSet, basename="documento")
router.register(r"procedimentos", ProcedimentoViewSet, basename="procedimento")
router.register(r"users", UserAdminViewSet, basename="user")
router.register(r"calibracoes", CalibracaoViewSet, basename="calibracao")
router.register(r"revisoes", RevisaoViewSet, basename="revisao")
router.register(r"dashboard", DashboardViewSet, basename="dashboard")
router.register(r"avaliacoes", AvaliacaoViewSet, basename="avaliacao")
router.register(r"posts", PostViewSet, basename="post")
router.register(r"categorias", CategoriaViewSet, basename="categoria")
router.register(r"setores", SetorViewSet, basename="setor")
router.register(r'normativos', NormativoViewSet, basename="normativo")
router.register(r'grupos', GrupoViewSet, basename="grupo")
router.register(r'convites', ConviteViewSet, basename="convite")
router.register(r'categorias-equipamentos', CategoriaEquipamentosViewSet, basename='categoria-equipamento')
router.register(r'equipamentos', EquipamentosViewSet, basename='equipamentos')
router.register(r'tipos-instrumento', TipoInstrumentoViewSet, basename='tipo-instrumento')

urlpatterns = i18n_patterns(
    path("admin/", admin.site.urls),
    path("api-auth/", include("rest_framework.urls")),
    path("login/", LoginView.as_view(), name="login"),
    path("refresh-token/", TokenRefreshView.as_view(), name="refresh_token"),
    path("register/basics/", RegisterBasicsView.as_view(), name="register-basics"),
    path(
        "register/location/", RegisterLocationView.as_view(), name="register-location"
    ),
    path("register/auth/", RegisterAuthView.as_view(), name="register-auth"),
    path("", include(router.urls)),
    path("invites/create/", CriarConviteView.as_view(), name="create-invite"),
    path('djrichtextfield/', include('djrichtextfield.urls')),
    path("invites/register/<str:token>/", RegistroDoConviteView.as_view(), name="register-invite"),
    path("reset-password/<str:token>/", ResetPassword.as_view(), name="reset-password"),
    path("reset-password-request/", RequestPasswordReset.as_view(), name="reset-password-request"),
    prefix_default_language=False,
) + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
