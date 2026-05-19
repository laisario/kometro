from rest_framework.permissions import BasePermission, SAFE_METHODS
from .models import Cliente
import logging

logger = logging.getLogger(__name__)

class NivelPermission(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        if not u.is_authenticated:
            logger.warning(
                "[NIVEL_PERMISSION_DENIED] reason=unauthenticated method=%s path=%s view=%s",
                request.method,
                request.path,
                view.__class__.__name__,
            )
            return False
        if u.is_staff:
            return True

        metodo = request.method
        if metodo in SAFE_METHODS:
            grupos_ok = {"gerente", "registrador", "observador"}
        elif metodo == "POST":
            grupos_ok = {"gerente", "registrador"}
        elif metodo in {"PUT", "PATCH", "DELETE"}:
            grupos_ok = {"gerente"}
        else:
            logger.warning(
                "[NIVEL_PERMISSION_DENIED] reason=unsupported_method user_id=%s method=%s path=%s view=%s",
                u.id,
                request.method,
                request.path,
                view.__class__.__name__,
            )
            return False

        allowed = u.groups.filter(name__in=grupos_ok).exists()
        if not allowed:
            logger.warning(
                "[NIVEL_PERMISSION_DENIED] reason=missing_group user_id=%s username=%s "
                "method=%s path=%s view=%s required_groups=%s",
                u.id,
                u.username,
                request.method,
                request.path,
                view.__class__.__name__,
                sorted(grupos_ok),
            )
        return allowed

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        
        user_cliente = request.user.clientes.first()

        if isinstance(obj, Cliente):
            allowed = obj.id == user_cliente.id if user_cliente else False
            if not allowed:
                logger.warning(
                    "[NIVEL_OBJECT_PERMISSION_DENIED] reason=cliente_mismatch user_id=%s "
                    "user_cliente_id=%s object_cliente_id=%s method=%s path=%s view=%s",
                    request.user.id,
                    user_cliente.id if user_cliente else None,
                    obj.id,
                    request.method,
                    request.path,
                    view.__class__.__name__,
                )
            return allowed

        if hasattr(obj, "cliente_id"):
            allowed = obj.cliente_id == user_cliente.id if user_cliente else False
            if not allowed:
                logger.warning(
                    "[NIVEL_OBJECT_PERMISSION_DENIED] reason=related_cliente_mismatch user_id=%s "
                    "user_cliente_id=%s object_cliente_id=%s object_model=%s method=%s path=%s view=%s",
                    request.user.id,
                    user_cliente.id if user_cliente else None,
                    obj.cliente_id,
                    obj.__class__.__name__,
                    request.method,
                    request.path,
                    view.__class__.__name__,
                )
            return allowed

        if hasattr(obj, '_meta') and obj._meta.model_name == 'instrumento':
            if user_cliente:
                from instrumentos.models import InstrumentoBaseCliente
                allowed = InstrumentoBaseCliente.objects.filter(
                    instrumento=obj,
                    cliente=user_cliente,
                    ativo=True
                ).exists()
                if not allowed:
                    logger.warning(
                        "[NIVEL_OBJECT_PERMISSION_DENIED] reason=instrumento_sem_acesso user_id=%s "
                        "user_cliente_id=%s instrumento_id=%s method=%s path=%s view=%s",
                        request.user.id,
                        user_cliente.id,
                        obj.id,
                        request.method,
                        request.path,
                        view.__class__.__name__,
                    )
                return allowed
            logger.warning(
                "[NIVEL_OBJECT_PERMISSION_DENIED] reason=user_without_cliente user_id=%s "
                "instrumento_id=%s method=%s path=%s view=%s",
                request.user.id,
                obj.id,
                request.method,
                request.path,
                view.__class__.__name__,
            )
            return False

        logger.warning(
            "[NIVEL_OBJECT_PERMISSION_DENIED] reason=unsupported_object user_id=%s object_model=%s "
            "method=%s path=%s view=%s",
            request.user.id,
            obj.__class__.__name__,
            request.method,
            request.path,
            view.__class__.__name__,
        )
        return False
