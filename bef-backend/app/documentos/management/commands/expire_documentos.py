from django.core.management.base import BaseCommand

from documentos.jobs import expires_documents


class Command(BaseCommand):
    def handle(self, *args, **options):
        expires_documents()
