from django.core.management.base import BaseCommand

from instrumentos.tasks import expires_instruments


class Command(BaseCommand):
    def handle(self, *args, **options):
        expires_instruments.apply()
