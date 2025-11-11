# ex: management command setup_permissoes.py
# from django.core.management.base import BaseCommand
# from django.contrib.auth.models import Group, Permission
# from django.apps import apps

# NIVEIS = {
#     "gestor": ["view"],
#     "registrador": ["view", "add"],
#     "observador": ["view", "add", "change", "delete"],
# }

# class Command(BaseCommand):
#     help = "Cria grupos gestor/registrador/observador e atribui permissões por model"

#     def handle(self, *args, **options):
#         # Liste apenas os models que precisam desse controle (evite dar permissão pra tudo)
#         modelos_alvo = ["OrdemServico", "Imagem", "Setor", "OS", "SeuModel..."]

#         for nome_grupo, acoes in NIVEIS.items():
#             grupo, _ = Group.objects.get_or_create(name=nome_grupo)
#             for model_name in modelos_alvo:
#                 model = apps.get_model("sua_app", model_name)
#                 opts = model._meta
#                 for acao in acoes:
#                     codename = f"{acao}_{opts.model_name}"
#                     try:
#                         perm = Permission.objects.get(
#                             content_type__app_label=opts.app_label,
#                             codename=codename,
#                         )
#                         grupo.permissions.add(perm)
#                     except Permission.DoesNotExist:
#                         self.stdout.write(f"Permissão não encontrada: {codename}")
#             self.stdout.write(f"Grupo configurado: {nome_grupo}")
