from datetime import date
from .models import Documento


def expires_documents():
    today = date.today()
    for documento in Documento.objects.all():
        documento.vencido = documento.data_validade < today
        documento.save()
