from rest_framework.exceptions import PermissionDenied


class ClienteScopedQuerysetMixin:
    cliente_field = "cliente"

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user

        if user.is_staff:
            return qs

        return qs.filter(**{f"{self.cliente_field}__usuarios": user})

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_staff:
            serializer.save()
        else:
            cliente = user.clientes.first()
            if not cliente:
                raise PermissionDenied("Usuário não está vinculado a nenhum cliente.")
            serializer.save(cliente=cliente)