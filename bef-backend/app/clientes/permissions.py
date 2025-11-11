from rest_framework.permissions import BasePermission, SAFE_METHODS
from .models import Cliente

class NivelPermission(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        if not u.is_authenticated:
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
            return False
        return u.groups.filter(name__in=grupos_ok).exists()

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        
        user_cliente = request.user.clientes.first()

        if isinstance(obj, Cliente):
            return obj.id == user_cliente.id if user_cliente else False

        if hasattr(obj, "cliente_id"):
            return obj.cliente_id == user_cliente.id if user_cliente else False

        if hasattr(obj, '_meta') and obj._meta.model_name == 'instrumento':
            if user_cliente:
                from instrumentos.models import InstrumentoBaseCliente
                return InstrumentoBaseCliente.objects.filter(
                    instrumento=obj,
                    cliente=user_cliente,
                    ativo=True
                ).exists()
            return False

        return False
