from rest_framework.exceptions import PermissionDenied


class ClienteScopedQuerysetMixin:
    cliente_field = "cliente"

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        cliente_id = self.request.query_params.get("cliente")

        if user.is_staff:
            if cliente_id:
                qs = qs.filter(**{self.cliente_field: cliente_id})
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