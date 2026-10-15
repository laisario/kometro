from datetime import date, timedelta
from decimal import Decimal
import os
from types import SimpleNamespace
import tempfile
from unittest.mock import Mock, patch

from botocore.exceptions import ClientError
from celery import current_app
from django.contrib.auth.models import Group, User
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, TransactionTestCase, override_settings
from django.utils import timezone
from rest_framework.request import Request
from rest_framework.test import APIClient, APIRequestFactory

from clientes.models import Cliente, Empresa
from instrumentos.models import (
    Calibracao,
    Anexo,
    Certificado,
    CriterioAceitacao,
    CalibracaoStatus,
    Instrumento,
    InstrumentoDoCliente,
    InstrumentExportJob,
    MovimentacaoSetorInstrumento,
    Normativo,
    PontoDeCalibracao,
    ResultadoCalibracao,
    Setor,
    TipoInstrumento,
)
from instrumentos.serializers import (
    InstrumentoDoClienteWriteAdminSerializer,
    InstrumentoDoClienteWriteSerializer,
    SetorSerializer,
)
from clientes.signals import NORMAS_PADRAO, criar_normas_padrao
from instrumentos.constants import (
    INSTRUMENT_EXPORT_NOT_STARTED_MESSAGE,
    INSTRUMENT_EXPORT_PROCESSING_TIMEOUT_MESSAGE,
    INSTRUMENT_EXPORT_PROCESSING_TIMEOUT_MINUTES,
    INSTRUMENT_EXPORT_QUEUE_TIMEOUT_MINUTES,
    MAX_EXPORT_ITEMS,
)
from instrumentos.services import (
    annotate_numero_ultimo_certificado,
    get_instrument_export_storage,
)
from instrumentos.tasks import (
    cleanup_expired_instrument_exports,
    generate_instrument_export,
)
from instrumentos.views import InstrumentoPagination
from rkp_platform.storage_backends import InstrumentExportPrivateStorage


def _make_cliente():
    empresa = Empresa.objects.create(
        razao_social="Empresa Instrumentos",
        cnpj="11111111111111",
    )
    return Cliente.objects.create(empresa=empresa)


def _make_instrumento_base():
    tipo = TipoInstrumento.objects.create(descricao="Termometro")
    return Instrumento.objects.create(tipo_de_instrumento=tipo)


def _make_storage_client_error():
    return ClientError(
        {"Error": {"Code": "403", "Message": "Forbidden"}},
        "HeadObject",
    )


class InstrumentoDoClienteExpirationStatusFilterTest(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.admin = User.objects.create_user(
            username="admin-status-instrumentos",
            password="pass",
            is_staff=True,
        )
        self.api.force_authenticate(user=self.admin)

        self.cliente = _make_cliente()
        self.outro_cliente = _make_cliente()
        self.instrumento_base = _make_instrumento_base()

        self.vencido = InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=self.instrumento_base,
            tag="VENCIDO-001",
            data_proxima_calibracao=date.today() - timedelta(days=1),
        )
        self.outro_vencido = InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=self.instrumento_base,
            tag="VENCIDO-002",
            data_proxima_calibracao=date.today() - timedelta(days=2),
        )
        self.em_dia = InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=self.instrumento_base,
            tag="EM-DIA-001",
            data_proxima_calibracao=date.today() + timedelta(days=1),
        )
        self.vencido_de_outro_cliente = InstrumentoDoCliente.objects.create(
            cliente=self.outro_cliente,
            instrumento=self.instrumento_base,
            tag="VENCIDO-OUTRO-CLIENTE",
            data_proxima_calibracao=date.today() - timedelta(days=3),
        )

        self.cliente.instrumentos_vencidos = self.cliente.instrumentos.filter(
            expirado=True
        ).count()
        self.cliente.instrumentos_em_dia = self.cliente.instrumentos.filter(
            expirado=False
        ).count()
        self.cliente.save(
            update_fields=["instrumentos_vencidos", "instrumentos_em_dia"]
        )

    def test_all_preserva_todos_os_instrumentos_do_cliente(self):
        response = self.api.get(
            "/instrumentos/",
            {"client": self.cliente.id, "expiration_status": "all"},
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["count"], 3)
        self.assertNotIn(
            self.vencido_de_outro_cliente.id,
            [item["id"] for item in response.data["results"]],
        )

    def test_expired_reutiliza_a_mesma_regra_da_estatistica(self):
        response = self.api.get(
            "/instrumentos/",
            {"client": self.cliente.id, "expiration_status": "expired"},
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["count"], self.cliente.instrumentos_vencidos)
        self.assertEqual(
            {item["id"] for item in response.data["results"]},
            {self.vencido.id, self.outro_vencido.id},
        )

    def test_up_to_date_reutiliza_a_mesma_regra_da_estatistica(self):
        response = self.api.get(
            "/instrumentos/",
            {"client": self.cliente.id, "expiration_status": "up_to_date"},
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["count"], self.cliente.instrumentos_em_dia)
        self.assertEqual(
            [item["id"] for item in response.data["results"]],
            [self.em_dia.id],
        )

    def test_status_funciona_com_busca_e_paginacao(self):
        response = self.api.get(
            "/instrumentos/",
            {
                "client": self.cliente.id,
                "expiration_status": "expired",
                "search": "VENCIDO",
                "page": 2,
                "page_size": 1,
            },
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["count"], 2)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertIn(
            response.data["results"][0]["id"],
            {self.vencido.id, self.outro_vencido.id},
        )


class InstrumentoPaginationAndExportTest(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.user = User.objects.create_user(
            username="gerente-exportacao-instrumentos",
            password="pass",
        )
        self.user.groups.add(Group.objects.get_or_create(name="gerente")[0])

        self.cliente = _make_cliente()
        self.outro_cliente = _make_cliente()
        self.user.clientes.add(self.cliente)
        self.api.force_authenticate(user=self.user)
        queue_patcher = patch(
            "instrumentos.views.generate_instrument_export.apply_async",
            return_value=SimpleNamespace(id="celery-export-task"),
        )
        self.mock_queue_export = queue_patcher.start()
        self.addCleanup(queue_patcher.stop)

        instrumento_base = _make_instrumento_base()
        self.instrumento_autorizado = InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=instrumento_base,
            tag="EXPORT-AUTORIZADO",
        )
        self.outro_instrumento_autorizado = (
            InstrumentoDoCliente.objects.create(
                cliente=self.cliente,
                instrumento=instrumento_base,
                tag="EXPORT-AUTORIZADO-2",
            )
        )
        self.instrumento_outro_cliente = InstrumentoDoCliente.objects.create(
            cliente=self.outro_cliente,
            instrumento=instrumento_base,
            tag="EXPORT-NAO-AUTORIZADO",
        )

    def _exportar(self, ids):
        return self.api.post(
            "/instrumentos/exportar/",
            {
                "instrumentos_selecionados": [
                    {"id": item_id} for item_id in ids
                ],
                "campos_selecionados": ["tag"],
            },
            format="json",
        )

    def _exportar_novo_contrato(self, selection, campos=None):
        return self.api.post(
            "/instrumentos/exportar/",
            {
                "selection": selection,
                "campos_selecionados": campos or ["tag"],
            },
            format="json",
        )

    def test_page_size_ate_limite_e_permitido(self):
        request = Request(APIRequestFactory().get(
            "/instrumentos/",
            {"page_size": MAX_EXPORT_ITEMS},
        ))

        self.assertEqual(
            InstrumentoPagination().get_page_size(request),
            MAX_EXPORT_ITEMS,
        )

    def test_page_size_acima_do_limite_e_reduzido_ao_maximo(self):
        request = Request(APIRequestFactory().get(
            "/instrumentos/",
            {"page_size": MAX_EXPORT_ITEMS + 1},
        ))

        self.assertEqual(
            InstrumentoPagination().get_page_size(request),
            MAX_EXPORT_ITEMS,
        )

    def test_exportacao_de_instrumentos_autorizados(self):
        response = self._exportar([
            self.instrumento_autorizado.id,
            self.outro_instrumento_autorizado.id,
        ])

        self.assertEqual(response.status_code, 200, response.data)
        self.assertIn("EXPORT-AUTORIZADO", response.data)
        self.assertIn("EXPORT-AUTORIZADO-2", response.data)

    def test_exportacao_com_mais_de_9999_ids_e_rejeitada(self):
        response = self._exportar(range(1, MAX_EXPORT_ITEMS + 2))

        self.assertEqual(response.status_code, 400)
        self.assertIn("detail", response.data)

    def test_payload_grande_com_ids_duplicados_e_rejeitado(self):
        response = self._exportar(
            [self.instrumento_autorizado.id] * (MAX_EXPORT_ITEMS + 1)
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("detail", response.data)

    def test_ids_duplicados_sao_exportados_uma_unica_vez(self):
        response = self._exportar([
            self.instrumento_autorizado.id,
            self.instrumento_autorizado.id,
        ])

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data.count("EXPORT-AUTORIZADO"), 1)

    def test_instrumento_de_outro_cliente_nao_e_exportado(self):
        response = self._exportar([
            self.instrumento_autorizado.id,
            self.instrumento_outro_cliente.id,
        ])

        self.assertEqual(response.status_code, 200, response.data)
        self.assertIn("EXPORT-AUTORIZADO", response.data)
        self.assertNotIn("EXPORT-NAO-AUTORIZADO", response.data)

    def test_id_invalido_e_rejeitado(self):
        response = self.api.post(
            "/instrumentos/exportar/",
            {
                "instrumentos_selecionados": [{"id": "invalido"}],
                "campos_selecionados": ["tag"],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("detail", response.data)

    def test_id_fracionario_e_rejeitado(self):
        response = self.api.post(
            "/instrumentos/exportar/",
            {
                "instrumentos_selecionados": [{"id": 1.5}],
                "campos_selecionados": ["tag"],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("detail", response.data)

    def test_novo_contrato_exporta_selecao_manual(self):
        response = self._exportar_novo_contrato({
            "mode": "manual",
            "ids": [self.instrumento_autorizado.id],
        })

        self.assertEqual(response.status_code, 200, response.data)
        self.assertIn("EXPORT-AUTORIZADO", response.data)
        self.assertEqual(response["X-Matched-Count"], "1")
        self.assertEqual(response["X-Exported-Count"], "1")

    def test_novo_contrato_deduplica_ids_manuais(self):
        response = self._exportar_novo_contrato({
            "mode": "manual",
            "ids": [
                self.instrumento_autorizado.id,
                self.instrumento_autorizado.id,
            ],
        })

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data.count("EXPORT-AUTORIZADO"), 1)

    def test_novo_contrato_manual_rejeita_mais_de_9999_ids(self):
        response = self._exportar_novo_contrato({
            "mode": "manual",
            "ids": list(range(1, MAX_EXPORT_ITEMS + 2)),
        })

        self.assertEqual(response.status_code, 400)
        self.assertIn("ids", str(response.data["detail"]))

    def test_novo_contrato_manual_preserva_escopo_do_cliente(self):
        response = self._exportar_novo_contrato({
            "mode": "manual",
            "ids": [
                self.instrumento_autorizado.id,
                self.instrumento_outro_cliente.id,
            ],
        })

        self.assertEqual(response.status_code, 200, response.data)
        self.assertIn("EXPORT-AUTORIZADO", response.data)
        self.assertNotIn("EXPORT-NAO-AUTORIZADO", response.data)

    def test_all_filtered_aplica_busca_e_preserva_escopo_do_cliente(self):
        response = self._exportar_novo_contrato({
            "mode": "all_filtered",
            "filters": {"search": "EXPORT-AUTORIZADO"},
        })

        self.assertEqual(response.status_code, 202, response.data)
        job = InstrumentExportJob.objects.get(id=response.data["job_id"])
        self.assertEqual(job.matched_count, 2)
        self.assertEqual(
            set(job.instrument_ids),
            {
                self.instrumento_autorizado.id,
                self.outro_instrumento_autorizado.id,
            },
        )
        self.assertNotIn(self.instrumento_outro_cliente.id, job.instrument_ids)

    def test_all_filtered_combina_status_datas_e_norma(self):
        norma = Normativo.objects.create(nome="ISO 9001", cliente=self.cliente)
        correspondente = InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=self.instrumento_autorizado.instrumento,
            tag="COMBINADO-CORRETO",
            data_proxima_calibracao=date.today() - timedelta(days=2),
        )
        correspondente.normativos.add(norma)
        fora_da_data = InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=self.instrumento_autorizado.instrumento,
            tag="COMBINADO-FORA",
            data_proxima_calibracao=date.today() - timedelta(days=20),
        )
        fora_da_data.normativos.add(norma)

        response = self._exportar_novo_contrato({
            "mode": "all_filtered",
            "filters": {
                "status": "expired",
                "date_start": str(date.today() - timedelta(days=5)),
                "date_stop": str(date.today()),
                "norma": "ISO 9001",
            },
        })

        self.assertEqual(response.status_code, 202, response.data)
        job = InstrumentExportJob.objects.get(id=response.data["job_id"])
        self.assertEqual(job.instrument_ids, [correspondente.id])
        self.assertNotIn(fora_da_data.id, job.instrument_ids)
        self.assertEqual(job.matched_count, 1)

    def test_all_filtered_rejeita_filtro_fora_da_allowlist(self):
        response = self._exportar_novo_contrato({
            "mode": "all_filtered",
            "filters": {"client": self.outro_cliente.id},
        })

        self.assertEqual(response.status_code, 400)
        self.assertIn("client", str(response.data["detail"]))

    @patch("instrumentos.views.MAX_EXPORT_ITEMS", 2)
    def test_all_filtered_limita_e_ordena_por_id_decrescente(self):
        criados = [
            InstrumentoDoCliente.objects.create(
                cliente=self.cliente,
                instrumento=self.instrumento_autorizado.instrumento,
                tag=f"ORDEM-EXPORT-{indice}",
            )
            for indice in range(3)
        ]

        response = self._exportar_novo_contrato({
            "mode": "all_filtered",
            "filters": {"search": "ORDEM-EXPORT"},
        })

        self.assertEqual(response.status_code, 202, response.data)
        job = InstrumentExportJob.objects.get(id=response.data["job_id"])
        self.assertEqual(job.matched_count, 3)
        self.assertEqual(job.exported_count, 2)
        self.assertTrue(job.limit_applied)
        self.assertEqual(job.instrument_ids, [criados[2].id, criados[1].id])


class InstrumentExportJobTest(TestCase):
    def setUp(self):
        self.private_export_dir = tempfile.TemporaryDirectory()
        self.settings_override = override_settings(
            PRIVATE_EXPORT_STORAGE="filesystem",
            PRIVATE_EXPORT_LOCAL_PATH=self.private_export_dir.name,
        )
        self.settings_override.enable()
        self.addCleanup(self.settings_override.disable)
        self.addCleanup(self.private_export_dir.cleanup)

        self.api = APIClient()
        self.user = User.objects.create_user(
            username="gerente-job-exportacao",
            password="pass",
        )
        self.user.groups.add(Group.objects.get_or_create(name="gerente")[0])
        self.cliente = _make_cliente()
        self.user.clientes.add(self.cliente)
        self.api.force_authenticate(user=self.user)
        self.instrumento_base = _make_instrumento_base()
        self.instrumento = InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=self.instrumento_base,
            tag="JOB-EXPORT-1",
        )

        queue_patcher = patch(
            "instrumentos.views.generate_instrument_export.apply_async",
            return_value=SimpleNamespace(id="celery-job-id"),
        )
        self.mock_queue_export = queue_patcher.start()
        self.addCleanup(queue_patcher.stop)

    def _post_export(self, selection, request_id=None, fields=None):
        payload = {
            "selection": selection,
            "campos_selecionados": fields or ["tag"],
        }
        if request_id:
            payload["request_id"] = request_id
        return self.api.post("/instrumentos/exportar/", payload, format="json")

    def _create_job(self, status=InstrumentExportJob.Status.QUEUED, **overrides):
        values = {
            "requested_by": self.user,
            "cliente": self.cliente,
            "client_ids": [self.cliente.id],
            "status": status,
            "matched_count": 1,
            "exported_count": 1,
            "limit_applied": False,
            "selected_fields": ["tag"],
            "selection_mode": InstrumentExportJob.SelectionMode.ALL_FILTERED,
            "filters_snapshot": {"search": "JOB-EXPORT"},
            "instrument_ids": [self.instrumento.id],
            "expires_at": timezone.now() + timedelta(hours=24),
        }
        values.update(overrides)
        return InstrumentExportJob.objects.create(**values)

    def test_manual_ate_100_continua_sincrono(self):
        response = self._post_export({
            "mode": "manual",
            "ids": [self.instrumento.id],
        })

        self.assertEqual(response.status_code, 200, response.data)
        self.assertIn("JOB-EXPORT-1", response.data)
        self.assertFalse(InstrumentExportJob.objects.exists())

    def test_manual_acima_de_100_cria_job(self):
        InstrumentoDoCliente.objects.bulk_create([
            InstrumentoDoCliente(
                cliente=self.cliente,
                instrumento=self.instrumento_base,
                tag=f"JOB-BULK-{index}",
            )
            for index in range(101)
        ])
        instrument_ids = list(
            InstrumentoDoCliente.objects.filter(tag__startswith="JOB-BULK-")
            .order_by("id")
            .values_list("id", flat=True)
        )
        response = self._post_export({
            "mode": "manual",
            "ids": instrument_ids,
        })

        self.assertEqual(response.status_code, 202, response.data)
        job = InstrumentExportJob.objects.get(id=response.data["job_id"])
        self.assertEqual(job.status, InstrumentExportJob.Status.QUEUED)
        self.assertEqual(job.exported_count, 101)
        self.assertEqual(len(job.instrument_ids), 101)
        self.mock_queue_export.assert_called_once_with(args=[str(job.id)])

    def test_all_filtered_cria_job_queued_e_preserva_campos(self):
        response = self._post_export(
            {"mode": "all_filtered", "filters": {"search": "JOB-EXPORT"}},
            fields=["tag", "setor"],
        )

        self.assertEqual(response.status_code, 202, response.data)
        job = InstrumentExportJob.objects.get(id=response.data["job_id"])
        self.assertEqual(job.status, InstrumentExportJob.Status.QUEUED)
        self.assertEqual(job.selected_fields, ["tag", "setor"])
        self.assertEqual(job.instrument_ids, [self.instrumento.id])
        self.assertEqual(response.data["status"], "queued")

    def test_request_id_impede_jobs_duplicados(self):
        request_id = "70d294d8-3441-476c-8630-d32dd2c335e1"
        selection = {"mode": "all_filtered", "filters": {}}

        first = self._post_export(selection, request_id=request_id)
        second = self._post_export(selection, request_id=request_id)

        self.assertEqual(first.status_code, 202)
        self.assertEqual(second.status_code, 202)
        self.assertEqual(first.data["job_id"], second.data["job_id"])
        self.assertEqual(InstrumentExportJob.objects.count(), 1)
        self.mock_queue_export.assert_called_once()

    def test_status_retorna_processing_completed_failed_e_expired(self):
        job = self._create_job(status=InstrumentExportJob.Status.PROCESSING)
        url = f"/instrumentos/exportacoes/{job.id}/"

        processing = self.api.get(url)
        self.assertEqual(processing.status_code, 200)
        self.assertEqual(processing.data["status"], "processing")

        job.status = InstrumentExportJob.Status.COMPLETED
        job.file_name = "arquivo.csv"
        job.save(update_fields=("status", "file_name"))
        completed = self.api.get(url)
        self.assertEqual(completed.data["status"], "completed")
        self.assertIn("download_url", completed.data)

        job.status = InstrumentExportJob.Status.FAILED
        job.error_message = "Não foi possível gerar o relatório."
        job.save(update_fields=("status", "error_message"))
        failed = self.api.get(url)
        self.assertEqual(failed.data["status"], "failed")
        self.assertEqual(failed.data["error"], job.error_message)

        job.status = InstrumentExportJob.Status.QUEUED
        job.expires_at = timezone.now() - timedelta(seconds=1)
        job.save(update_fields=("status", "expires_at"))
        expired = self.api.get(url)
        self.assertEqual(expired.data["status"], "expired")

    def test_outro_usuario_nao_consulta_nem_baixa_job(self):
        job = self._create_job(status=InstrumentExportJob.Status.COMPLETED)
        other_user = User.objects.create_user(username="outro-job-user")
        other_user.groups.add(Group.objects.get_or_create(name="observador")[0])
        other_client = _make_cliente()
        other_user.clientes.add(other_client)
        self.api.force_authenticate(user=other_user)

        status_response = self.api.get(f"/instrumentos/exportacoes/{job.id}/")
        download_response = self.api.get(
            f"/instrumentos/exportacoes/{job.id}/download/"
        )

        self.assertEqual(status_response.status_code, 404)
        self.assertEqual(download_response.status_code, 404)

    def test_download_autenticado_e_arquivo_expirado(self):
        storage = get_instrument_export_storage()
        file_name = storage.save("teste/job.csv", ContentFile(b"TAG\nJOB-EXPORT-1"))
        job = self._create_job(
            status=InstrumentExportJob.Status.COMPLETED,
            file_name=file_name,
        )

        response = self.api.get(
            f"/instrumentos/exportacoes/{job.id}/download/"
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"JOB-EXPORT-1", b"".join(response.streaming_content))

        job.expires_at = timezone.now() - timedelta(seconds=1)
        job.save(update_fields=("expires_at",))
        expired_response = self.api.get(
            f"/instrumentos/exportacoes/{job.id}/download/"
        )
        self.assertEqual(expired_response.status_code, 410)
        self.assertFalse(storage.exists(file_name))

    def test_storage_local_cria_diretorio_automaticamente(self):
        local_path = os.path.join(self.private_export_dir.name, "novo-diretorio")
        with override_settings(
            PRIVATE_EXPORT_STORAGE="filesystem",
            PRIVATE_EXPORT_LOCAL_PATH=local_path,
        ):
            storage = get_instrument_export_storage()

        self.assertTrue(os.path.isdir(local_path))
        self.assertEqual(
            os.path.abspath(storage.location),
            os.path.abspath(local_path),
        )

    def test_download_de_arquivo_ausente_retorna_410_e_expira_job(self):
        job = self._create_job(
            status=InstrumentExportJob.Status.COMPLETED,
            file_name="arquivo-removido.csv",
        )

        result = self.api.get(
            f"/instrumentos/exportacoes/{job.id}/download/"
        )

        self.assertEqual(result.status_code, 410)
        self.assertEqual(
            result.data["detail"],
            "Este relatório não está mais disponível. Gere uma nova exportação.",
        )
        job.refresh_from_db()
        self.assertEqual(job.status, InstrumentExportJob.Status.EXPIRED)
        self.assertEqual(job.file_name, "")

    def test_download_trata_objeto_removido_entre_exists_e_open(self):
        job = self._create_job(
            status=InstrumentExportJob.Status.COMPLETED,
            file_name="objeto-removido.csv",
        )
        missing_object = ClientError(
            {"Error": {"Code": "NoSuchKey", "Message": "Not found"}},
            "GetObject",
        )
        storage = Mock()
        storage.exists.return_value = True
        storage.open.side_effect = missing_object

        with patch(
            "instrumentos.views.get_instrument_export_storage",
            return_value=storage,
        ), patch(
            "instrumentos.services.get_instrument_export_storage",
            return_value=storage,
        ):
            result = self.api.get(
                f"/instrumentos/exportacoes/{job.id}/download/"
            )

        self.assertEqual(result.status_code, 410)
        job.refresh_from_db()
        self.assertEqual(job.status, InstrumentExportJob.Status.EXPIRED)
        self.assertEqual(job.file_name, "")

    def test_task_usa_ids_congelados_e_somente_campos_selecionados(self):
        job = self._create_job(selected_fields=["tag"])
        InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=self.instrumento_base,
            tag="JOB-CRIADO-DEPOIS",
        )

        result = generate_instrument_export(str(job.id))

        self.assertEqual(result["status"], "completed")
        job.refresh_from_db()
        storage = get_instrument_export_storage()
        with storage.open(job.file_name, "rb") as export_file:
            csv_content = export_file.read().decode("utf-8")
        self.assertIn("JOB-EXPORT-1", csv_content)
        self.assertNotIn("JOB-CRIADO-DEPOIS", csv_content)
        self.assertIn("TAG", csv_content.splitlines()[0])
        self.assertNotIn("Setor", csv_content.splitlines()[0])

    def test_erro_da_task_atualiza_failed_sem_detalhe_interno(self):
        job = self._create_job()
        with patch(
            "instrumentos.tasks.InstrumentoExportResource.export",
            side_effect=RuntimeError("segredo interno"),
        ):
            result = generate_instrument_export(str(job.id))

        job.refresh_from_db()
        self.assertEqual(result["status"], "failed")
        self.assertEqual(job.status, InstrumentExportJob.Status.FAILED)
        self.assertNotIn("segredo", job.error_message)

    def test_cleanup_remove_arquivo_e_e_idempotente(self):
        storage = get_instrument_export_storage()
        file_name = storage.save("cleanup/job.csv", ContentFile(b"csv"))
        job = self._create_job(
            status=InstrumentExportJob.Status.COMPLETED,
            file_name=file_name,
            expires_at=timezone.now() - timedelta(seconds=1),
        )

        first = cleanup_expired_instrument_exports()
        second = cleanup_expired_instrument_exports()

        job.refresh_from_db()
        self.assertEqual(first["expired_jobs"], 1)
        self.assertEqual(second["expired_jobs"], 0)
        self.assertEqual(job.status, InstrumentExportJob.Status.EXPIRED)
        self.assertEqual(job.file_name, "")
        self.assertFalse(storage.exists(file_name))

    def test_cleanup_preserva_queued_dentro_do_timeout(self):
        job = self._create_job()
        InstrumentExportJob.objects.filter(id=job.id).update(
            created_at=timezone.now() - timedelta(
                minutes=INSTRUMENT_EXPORT_QUEUE_TIMEOUT_MINUTES - 1
            )
        )

        result = cleanup_expired_instrument_exports()

        job.refresh_from_db()
        self.assertEqual(job.status, InstrumentExportJob.Status.QUEUED)
        self.assertEqual(result["queued_jobs_failed"], 0)

    def test_cleanup_marca_queued_antigo_como_failed(self):
        job = self._create_job()
        InstrumentExportJob.objects.filter(id=job.id).update(
            created_at=timezone.now() - timedelta(
                minutes=INSTRUMENT_EXPORT_QUEUE_TIMEOUT_MINUTES + 1
            )
        )

        first = cleanup_expired_instrument_exports()
        second = cleanup_expired_instrument_exports()

        job.refresh_from_db()
        self.assertEqual(job.status, InstrumentExportJob.Status.FAILED)
        self.assertEqual(job.error_message, INSTRUMENT_EXPORT_NOT_STARTED_MESSAGE)
        self.assertIsNotNone(job.finished_at)
        self.assertEqual(first["queued_jobs_failed"], 1)
        self.assertEqual(second["queued_jobs_failed"], 0)

    def test_cleanup_preserva_processing_dentro_do_timeout(self):
        job = self._create_job(
            status=InstrumentExportJob.Status.PROCESSING,
            started_at=timezone.now() - timedelta(
                minutes=INSTRUMENT_EXPORT_PROCESSING_TIMEOUT_MINUTES - 1
            ),
        )

        result = cleanup_expired_instrument_exports()

        job.refresh_from_db()
        self.assertEqual(job.status, InstrumentExportJob.Status.PROCESSING)
        self.assertEqual(result["processing_jobs_failed"], 0)

    def test_cleanup_marca_processing_antigo_como_failed(self):
        job = self._create_job(
            status=InstrumentExportJob.Status.PROCESSING,
            started_at=timezone.now() - timedelta(
                minutes=INSTRUMENT_EXPORT_PROCESSING_TIMEOUT_MINUTES + 1
            ),
        )

        first = cleanup_expired_instrument_exports()
        second = cleanup_expired_instrument_exports()

        job.refresh_from_db()
        self.assertEqual(job.status, InstrumentExportJob.Status.FAILED)
        self.assertEqual(
            job.error_message,
            INSTRUMENT_EXPORT_PROCESSING_TIMEOUT_MESSAGE,
        )
        self.assertIsNotNone(job.finished_at)
        self.assertEqual(first["processing_jobs_failed"], 1)
        self.assertEqual(second["processing_jobs_failed"], 0)

    def test_cleanup_nao_altera_job_concluido_antes_do_ttl(self):
        job = self._create_job(
            status=InstrumentExportJob.Status.COMPLETED,
            finished_at=timezone.now() - timedelta(days=2),
        )

        result = cleanup_expired_instrument_exports()

        job.refresh_from_db()
        self.assertEqual(job.status, InstrumentExportJob.Status.COMPLETED)
        self.assertEqual(result["expired_jobs"], 0)
        self.assertEqual(result["queued_jobs_failed"], 0)
        self.assertEqual(result["processing_jobs_failed"], 0)

    def test_novo_request_id_permite_nova_tentativa_apos_job_orfao(self):
        stale_request_id = "70d294d8-3441-476c-8630-d32dd2c335e1"
        stale_job = self._create_job(request_id=stale_request_id)
        InstrumentExportJob.objects.filter(id=stale_job.id).update(
            created_at=timezone.now() - timedelta(
                minutes=INSTRUMENT_EXPORT_QUEUE_TIMEOUT_MINUTES + 1
            )
        )
        cleanup_expired_instrument_exports()

        stale_response = self._post_export(
            {"mode": "all_filtered", "filters": {}},
            request_id=stale_request_id,
        )
        retry_response = self._post_export(
            {"mode": "all_filtered", "filters": {}},
            request_id="b6548b7a-4a42-4ac4-a1e7-e18f9a82dad0",
        )

        self.assertEqual(stale_response.status_code, 202)
        self.assertEqual(stale_response.data["status"], "failed")
        self.assertEqual(retry_response.status_code, 202)
        self.assertEqual(retry_response.data["status"], "queued")
        self.assertNotEqual(stale_response.data["job_id"], retry_response.data["job_id"])
        self.assertEqual(InstrumentExportJob.objects.count(), 2)
        self.mock_queue_export.assert_called_once()

    def test_cleanup_arquivo_ja_ausente_e_e_idempotente(self):
        job = self._create_job(
            status=InstrumentExportJob.Status.COMPLETED,
            file_name="cleanup/arquivo-ausente.csv",
            expires_at=timezone.now() - timedelta(seconds=1),
        )

        first = cleanup_expired_instrument_exports()
        second = cleanup_expired_instrument_exports()

        job.refresh_from_db()
        self.assertEqual(first["expired_jobs"], 1)
        self.assertEqual(second["expired_jobs"], 0)
        self.assertEqual(job.status, InstrumentExportJob.Status.EXPIRED)
        self.assertEqual(job.file_name, "")

    def test_cleanup_continua_e_tenta_novamente_apos_erro_de_storage(self):
        retry_job = self._create_job(
            status=InstrumentExportJob.Status.COMPLETED,
            file_name="cleanup/tentar-novamente.csv",
            expires_at=timezone.now() - timedelta(seconds=1),
        )
        other_job = self._create_job(
            status=InstrumentExportJob.Status.COMPLETED,
            file_name="cleanup/arquivo-ausente.csv",
            expires_at=timezone.now() - timedelta(seconds=1),
            request_id="2ac95ba9-82de-41a9-a85f-22320ad7068f",
        )
        unavailable_storage = Mock()

        def storage_exists(file_name):
            if file_name == "cleanup/tentar-novamente.csv":
                raise OSError("indisponível")
            return False

        unavailable_storage.exists.side_effect = storage_exists

        with patch(
            "instrumentos.services.get_instrument_export_storage",
            return_value=unavailable_storage,
        ):
            result = cleanup_expired_instrument_exports()

        retry_job.refresh_from_db()
        other_job.refresh_from_db()
        self.assertEqual(result["expired_jobs"], 2)
        self.assertEqual(retry_job.status, InstrumentExportJob.Status.EXPIRED)
        self.assertEqual(retry_job.file_name, "cleanup/tentar-novamente.csv")
        self.assertEqual(other_job.status, InstrumentExportJob.Status.EXPIRED)
        self.assertEqual(other_job.file_name, "")

    @override_settings(
        PRIVATE_EXPORT_STORAGE="spaces",
        PRIVATE_EXPORT_LOCATION="exports/instrumentos",
        AWS_STORAGE_BUCKET_NAME="bucket-existente",
    )
    def test_storage_producao_usa_bucket_existente_prefixo_e_acl_privado(self):
        storage = get_instrument_export_storage()

        self.assertIsInstance(storage, InstrumentExportPrivateStorage)
        self.assertEqual(storage.bucket_name, "bucket-existente")
        self.assertEqual(storage.location, "exports/instrumentos")
        self.assertEqual(storage.default_acl, "private")
        self.assertIsNone(storage.custom_domain)

    def test_exportacao_usa_fila_celery_padrao(self):
        route = current_app.amqp.router.route(
            {},
            "instrumentos.tasks.generate_instrument_export",
        )

        self.assertEqual(route["queue"].name, "celery")


class NumeroUltimoCertificadoTest(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.user = User.objects.create_user(
            username="gerente-ultimo-certificado",
            password="pass",
        )
        self.user.groups.add(Group.objects.get_or_create(name="gerente")[0])
        self.cliente = _make_cliente()
        self.user.clientes.add(self.cliente)
        self.api.force_authenticate(user=self.user)
        self.instrumento_base = _make_instrumento_base()

    def _instrumento(self, tag):
        return InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=self.instrumento_base,
            tag=tag,
            numero_certificado="NAO-USAR",
        )

    def _calibracao(self, instrumento, data, checagem=False):
        return Calibracao.objects.create(
            instrumento=instrumento,
            data=data,
            checagem=checagem,
        )

    def _item_listagem(self, instrumento):
        response = self.api.get(
            "/instrumentos/",
            {"search": instrumento.tag, "page_size": 10},
        )
        self.assertEqual(response.status_code, 200, response.data)
        return next(
            item
            for item in response.data["results"]
            if item["id"] == instrumento.id
        )

    def _exportar(self, instrumento, campos):
        return self.api.post(
            "/instrumentos/exportar/",
            {
                "instrumentos_selecionados": [{"id": instrumento.id}],
                "campos_selecionados": campos,
            },
            format="json",
        )

    def test_instrumento_sem_calibracao_expoe_campo_vazio(self):
        instrumento = self._instrumento("SEM-CALIBRACAO")

        item = self._item_listagem(instrumento)

        self.assertIn("numero_ultimo_certificado", item)
        self.assertIsNone(item["numero_ultimo_certificado"])

    def test_uma_calibracao_retorna_seu_certificado(self):
        instrumento = self._instrumento("UMA-CALIBRACAO")
        calibracao = self._calibracao(instrumento, date(2026, 5, 20))
        Certificado.objects.create(calibracao=calibracao, numero="CERT-123")

        item = self._item_listagem(instrumento)

        self.assertEqual(item["numero_ultimo_certificado"], "CERT-123")

    def test_varias_calibracoes_usam_a_mais_recente(self):
        instrumento = self._instrumento("VARIAS-CALIBRACOES")
        antiga = self._calibracao(instrumento, date(2026, 5, 20))
        recente = self._calibracao(instrumento, date(2026, 9, 10))
        Certificado.objects.create(calibracao=antiga, numero="CERT-ANTIGO")
        Certificado.objects.create(calibracao=recente, numero="CERT-RECENTE")

        item = self._item_listagem(instrumento)

        self.assertEqual(item["numero_ultimo_certificado"], "CERT-RECENTE")

    def test_calibracao_mais_recente_sem_certificado_retorna_vazio(self):
        instrumento = self._instrumento("RECENTE-SEM-CERTIFICADO")
        antiga = self._calibracao(instrumento, date(2026, 5, 20))
        self._calibracao(instrumento, date(2026, 9, 10))
        Certificado.objects.create(calibracao=antiga, numero="CERT-ANTIGO")

        item = self._item_listagem(instrumento)

        self.assertIsNone(item["numero_ultimo_certificado"])

    def test_checagem_posterior_nao_e_considerada(self):
        instrumento = self._instrumento("IGNORA-CHECAGEM")
        calibracao = self._calibracao(instrumento, date(2026, 5, 20))
        checagem = self._calibracao(
            instrumento,
            date(2026, 9, 10),
            checagem=True,
        )
        Certificado.objects.create(calibracao=calibracao, numero="CERT-CAL")
        Certificado.objects.create(calibracao=checagem, numero="CERT-CHECAGEM")

        item = self._item_listagem(instrumento)

        self.assertEqual(item["numero_ultimo_certificado"], "CERT-CAL")

    def test_empate_de_data_usa_calibracao_com_maior_id(self):
        instrumento = self._instrumento("EMPATE-DATA")
        primeira = self._calibracao(instrumento, date(2026, 5, 20))
        segunda = self._calibracao(instrumento, date(2026, 5, 20))
        Certificado.objects.create(calibracao=primeira, numero="CERT-PRIMEIRO")
        Certificado.objects.create(calibracao=segunda, numero="CERT-SEGUNDO")

        item = self._item_listagem(instrumento)

        self.assertEqual(item["numero_ultimo_certificado"], "CERT-SEGUNDO")

    def test_data_nula_fica_depois_de_data_preenchida(self):
        instrumento = self._instrumento("DATA-NULA")
        datada = self._calibracao(instrumento, date(2026, 5, 20))
        sem_data = self._calibracao(instrumento, None)
        Certificado.objects.create(calibracao=datada, numero="CERT-DATADO")
        Certificado.objects.create(calibracao=sem_data, numero="CERT-SEM-DATA")

        item = self._item_listagem(instrumento)

        self.assertEqual(item["numero_ultimo_certificado"], "CERT-DATADO")

    def test_multiplos_certificados_sao_listados_por_id(self):
        instrumento = self._instrumento("MULTIPLOS-CERTIFICADOS")
        calibracao = self._calibracao(instrumento, date(2026, 5, 20))
        Certificado.objects.create(calibracao=calibracao, numero="CERT-A")
        Certificado.objects.create(calibracao=calibracao, numero="CERT-B")

        item = self._item_listagem(instrumento)

        self.assertEqual(
            item["numero_ultimo_certificado"],
            "CERT-A, CERT-B",
        )

    def test_exportacao_inclui_campo_quando_selecionado(self):
        instrumento = self._instrumento("EXPORTA-CERTIFICADO")
        calibracao = self._calibracao(instrumento, date(2026, 5, 20))
        Certificado.objects.create(calibracao=calibracao, numero="CERT-EXPORT")
        Certificado.objects.create(calibracao=calibracao, numero="CERT-EXPORT-2")

        response = self._exportar(
            instrumento,
            ["tag", "numeroUltimoCertificado"],
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertIn("Número do último certificado", response.data)
        self.assertIn("CERT-EXPORT, CERT-EXPORT-2", response.data)

    def test_exportacao_omite_campo_quando_nao_selecionado(self):
        instrumento = self._instrumento("NAO-EXPORTA-CERTIFICADO")
        calibracao = self._calibracao(instrumento, date(2026, 5, 20))
        Certificado.objects.create(calibracao=calibracao, numero="CERT-OCULTO")

        response = self._exportar(instrumento, ["tag"])

        self.assertEqual(response.status_code, 200, response.data)
        self.assertNotIn("Número do último certificado", response.data)
        self.assertNotIn("CERT-OCULTO", response.data)

    def test_exportacao_funciona_sem_certificado(self):
        instrumento = self._instrumento("EXPORTA-SEM-CERTIFICADO")

        response = self._exportar(
            instrumento,
            ["tag", "numeroUltimoCertificado"],
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertIn("Número do último certificado", response.data)
        self.assertIn("EXPORTA-SEM-CERTIFICADO", response.data)
        self.assertNotIn("None", response.data)

    def test_annotation_nao_faz_consultas_por_instrumento(self):
        instrumentos = []
        for indice in range(3):
            instrumento = self._instrumento(f"SEM-N-MAIS-UM-{indice}")
            calibracao = self._calibracao(
                instrumento,
                date(2026, 5, 20 + indice),
            )
            Certificado.objects.create(
                calibracao=calibracao,
                numero=f"CERT-{indice}",
            )
            instrumentos.append(instrumento)

        with self.assertNumQueries(1):
            resultados = list(
                annotate_numero_ultimo_certificado(
                    InstrumentoDoCliente.objects.filter(
                        id__in=[item.id for item in instrumentos]
                    )
                ).values_list("numero_ultimo_certificado", flat=True)
            )

        self.assertCountEqual(resultados, ["CERT-0", "CERT-1", "CERT-2"])


class BuscaInstrumentoPorCertificadoTest(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.user = User.objects.create_user(
            username="gerente-busca-certificado",
            password="pass",
        )
        self.user.groups.add(Group.objects.get_or_create(name="gerente")[0])
        self.cliente = _make_cliente()
        self.outro_cliente = _make_cliente()
        self.user.clientes.add(self.cliente)
        self.api.force_authenticate(user=self.user)

        self.instrumento_base = _make_instrumento_base()
        self.instrumento = self._instrumento(
            self.cliente,
            "TAG-BUSCA-CERTIFICADO",
        )
        self.outro_instrumento = self._instrumento(
            self.cliente,
            "TAG-OUTRO-CERTIFICADO",
        )
        self.instrumento_outro_cliente = self._instrumento(
            self.outro_cliente,
            "TAG-CERTIFICADO-OUTRO-CLIENTE",
        )

        self.calibracao_antiga = self._calibracao(
            self.instrumento,
            date(2025, 1, 10),
        )
        self.calibracao_recente = self._calibracao(
            self.instrumento,
            date(2026, 2, 15),
        )
        Certificado.objects.create(
            calibracao=self.calibracao_antiga,
            numero="CERT-2025-001",
        )
        Certificado.objects.create(
            calibracao=self.calibracao_recente,
            numero="CERT-2026-0152",
        )
        Certificado.objects.create(
            calibracao=self.calibracao_recente,
            numero="CERT-DUPLICADO-0152",
        )

        Certificado.objects.create(
            calibracao=self._calibracao(
                self.outro_instrumento,
                date(2026, 3, 1),
            ),
            numero="CERT-OUTRO-0152",
        )
        Certificado.objects.create(
            calibracao=self._calibracao(
                self.instrumento_outro_cliente,
                date(2026, 3, 1),
            ),
            numero="CERT-EXTERNO-0152",
        )

    def _instrumento(self, cliente, tag):
        return InstrumentoDoCliente.objects.create(
            cliente=cliente,
            instrumento=self.instrumento_base,
            tag=tag,
        )

    @staticmethod
    def _calibracao(instrumento, data):
        return Calibracao.objects.create(
            instrumento=instrumento,
            data=data,
            checagem=False,
        )

    def _buscar(self, termo, **params):
        return self.api.get(
            "/instrumentos/",
            {"search": termo, "page_size": 100, **params},
        )

    def test_busca_existente_por_tag_e_descricao_continua_funcionando(self):
        response_tag = self._buscar("TAG-BUSCA-CERTIFICADO")
        response_descricao = self._buscar("Termometro")

        self.assertEqual(response_tag.status_code, 200, response_tag.data)
        self.assertEqual(
            [item["id"] for item in response_tag.data["results"]],
            [self.instrumento.id],
        )
        self.assertIsNone(
            response_tag.data["results"][0]["matched_calibration_id"]
        )
        self.assertEqual(
            {
                self.instrumento.id,
                self.outro_instrumento.id,
            },
            {item["id"] for item in response_descricao.data["results"]},
        )

    def test_tag_tem_precedencia_quando_tambem_aparece_em_certificado(self):
        Certificado.objects.create(
            calibracao=self.calibracao_antiga,
            numero="TAG-BUSCA-CERTIFICADO",
        )

        response = self._buscar("TAG-BUSCA-CERTIFICADO")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertIsNone(
            response.data["results"][0]["matched_calibration_id"]
        )

    def test_descricao_tem_precedencia_quando_tambem_aparece_em_certificado(self):
        Certificado.objects.create(
            calibracao=self.calibracao_antiga,
            numero="Termometro",
        )

        response = self._buscar("Termometro")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(response.data["results"])
        self.assertTrue(all(
            item["matched_calibration_id"] is None
            for item in response.data["results"]
        ))

    def test_busca_encontra_certificados_de_calibracoes_antiga_e_recente(self):
        response_antigo = self._buscar("CERT-2025-001")
        response_recente = self._buscar("CERT-2026-0152")

        self.assertEqual(response_antigo.status_code, 200, response_antigo.data)
        self.assertEqual(response_recente.status_code, 200, response_recente.data)
        self.assertEqual(
            [item["id"] for item in response_antigo.data["results"]],
            [self.instrumento.id],
        )
        self.assertEqual(
            response_antigo.data["results"][0]["matched_calibration_id"],
            self.calibracao_antiga.id,
        )
        self.assertEqual(
            [item["id"] for item in response_recente.data["results"]],
            [self.instrumento.id],
        )
        self.assertEqual(
            response_recente.data["results"][0]["matched_calibration_id"],
            self.calibracao_recente.id,
        )

    def test_numero_repetido_escolhe_calibracao_mais_recente(self):
        Certificado.objects.create(
            calibracao=self.calibracao_antiga,
            numero="CERT-MESMO-NUMERO",
        )
        Certificado.objects.create(
            calibracao=self.calibracao_recente,
            numero="CERT-MESMO-NUMERO",
        )

        response = self._buscar("CERT-MESMO-NUMERO")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            response.data["results"][0]["matched_calibration_id"],
            self.calibracao_recente.id,
        )

    def test_busca_parcial_nao_duplica_instrumentos_e_respeita_cliente(self):
        response = self._buscar("0152")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["count"], 2)
        ids = [item["id"] for item in response.data["results"]]
        self.assertCountEqual(
            ids,
            [self.instrumento.id, self.outro_instrumento.id],
        )
        self.assertEqual(ids.count(self.instrumento.id), 1)
        self.assertNotIn(self.instrumento_outro_cliente.id, ids)

    def test_certificado_inexistente_nao_retorna_instrumentos(self):
        response = self._buscar("CERT-INEXISTENTE")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["count"], 0)
        self.assertEqual(response.data["results"], [])

    def test_busca_por_certificado_funciona_com_filtro_e_paginacao(self):
        primeira_pagina = self._buscar(
            "0152",
            tipo_instrumento=self.instrumento_base.tipo_de_instrumento_id,
            page=1,
            page_size=1,
        )
        segunda_pagina = self._buscar(
            "0152",
            tipo_instrumento=self.instrumento_base.tipo_de_instrumento_id,
            page=2,
            page_size=1,
        )

        self.assertEqual(
            primeira_pagina.status_code,
            200,
            primeira_pagina.data,
        )
        self.assertEqual(
            segunda_pagina.status_code,
            200,
            segunda_pagina.data,
        )
        self.assertEqual(primeira_pagina.data["count"], 2)
        self.assertEqual(segunda_pagina.data["count"], 2)
        ids = [
            primeira_pagina.data["results"][0]["id"],
            segunda_pagina.data["results"][0]["id"],
        ]
        self.assertCountEqual(
            ids,
            [self.instrumento.id, self.outro_instrumento.id],
        )


class InstrumentoDoClienteSetorPatchTest(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.cliente = _make_cliente()
        self.user = User.objects.create_user(username="gerente", password="pass")
        self.user.groups.add(Group.objects.get_or_create(name="gerente")[0])
        self.user.clientes.add(self.cliente)
        self.api.force_authenticate(user=self.user)

        self.instrumento_base = _make_instrumento_base()
        self.instrumento = InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=self.instrumento_base,
            tag="TAG-SEM-SETOR",
            setor=None,
        )
        self.setor = Setor.objects.create(nome="Laboratorio", cliente=self.cliente)
        self.outro_cliente = _make_cliente()
        self.setor_outro_cliente = Setor.objects.create(
            nome="Setor externo",
            cliente=self.outro_cliente,
        )

    def test_patch_adiciona_setor_quando_instrumento_estava_sem_setor(self):
        response = self.api.patch(
            f"/instrumentos/{self.instrumento.id}/",
            {"setor": self.setor.id},
            format="json",
        )

        self.assertEqual(response.status_code, 204, response.data)
        self.instrumento.refresh_from_db()
        self.assertEqual(self.instrumento.setor_id, self.setor.id)

        movimentacao = MovimentacaoSetorInstrumento.objects.get(
            instrumento=self.instrumento
        )
        self.assertEqual(movimentacao.antigo_setor, "")
        self.assertEqual(movimentacao.novo_setor, self.setor.nome)

    def test_patch_mesmo_setor_nao_cria_movimentacao_duplicada(self):
        self.instrumento.setor = self.setor
        self.instrumento.save(update_fields=["setor"])

        response = self.api.patch(
            f"/instrumentos/{self.instrumento.id}/",
            {"setor": self.setor.id},
            format="json",
        )

        self.assertEqual(response.status_code, 204, response.data)
        self.assertFalse(
            MovimentacaoSetorInstrumento.objects.filter(
                instrumento=self.instrumento
            ).exists()
        )

    def test_create_aceita_setor_do_cliente_autenticado(self):
        response = self.api.post(
            "/instrumentos/",
            {
                "cliente": self.cliente.id,
                "instrumento": self.instrumento_base.id,
                "tag": "TAG-SETOR-PROPRIO",
                "posicao": "I",
                "setor": self.setor.id,
                "criterios_aceitacao": [],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(
            InstrumentoDoCliente.objects.get(tag="TAG-SETOR-PROPRIO").setor_id,
            self.setor.id,
        )

    def test_create_rejeita_setor_inexistente(self):
        response = self.api.post(
            "/instrumentos/",
            {
                "cliente": self.cliente.id,
                "instrumento": self.instrumento_base.id,
                "tag": "TAG-SETOR-INEXISTENTE",
                "posicao": "I",
                "setor": 999999999,
                "criterios_aceitacao": [],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn("setor", response.data)
        self.assertFalse(
            InstrumentoDoCliente.objects.filter(tag="TAG-SETOR-INEXISTENTE").exists()
        )

    def test_create_rejeita_setor_de_outro_cliente(self):
        response = self.api.post(
            "/instrumentos/",
            {
                "cliente": self.cliente.id,
                "instrumento": self.instrumento_base.id,
                "tag": "TAG-SETOR-EXTERNO",
                "posicao": "I",
                "setor": self.setor_outro_cliente.id,
                "criterios_aceitacao": [],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn("não pertence", str(response.data["setor"][0]).lower())
        self.assertFalse(
            InstrumentoDoCliente.objects.filter(tag="TAG-SETOR-EXTERNO").exists()
        )

    def test_patch_rejeita_setor_de_outro_cliente(self):
        response = self.api.patch(
            f"/instrumentos/{self.instrumento.id}/",
            {"setor": self.setor_outro_cliente.id},
            format="json",
        )

        self.assertEqual(response.status_code, 400, response.data)
        self.instrumento.refresh_from_db()
        self.assertIsNone(self.instrumento.setor_id)


class SetorHierarchyConsistencyTest(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.cliente = _make_cliente()
        self.outro_cliente = _make_cliente()
        self.user = User.objects.create_user(
            username="observador-hierarquia",
            password="pass",
        )
        self.user.groups.add(Group.objects.get_or_create(name="observador")[0])
        self.user.clientes.add(self.cliente)
        self.api.force_authenticate(user=self.user)

    def test_hierarquia_reflete_exclusao_feita_fora_da_view(self):
        setor = Setor.objects.create(nome="Temporario", cliente=self.cliente)
        first_response = self.api.get(
            "/setores/hierarquia/",
            {"cliente_id": self.cliente.id},
        )
        self.assertEqual(first_response.status_code, 200, first_response.data)
        self.assertIn(setor.id, [item["id"] for item in first_response.data])

        Setor.objects.filter(pk=setor.pk).delete()

        second_response = self.api.get(
            "/setores/hierarquia/",
            {"cliente_id": self.cliente.id},
        )
        self.assertEqual(second_response.status_code, 200, second_response.data)
        self.assertNotIn(setor.id, [item["id"] for item in second_response.data])

    def test_cliente_nao_pode_consultar_hierarquia_de_outro_cliente(self):
        Setor.objects.create(nome="Externo", cliente=self.outro_cliente)

        response = self.api.get(
            "/setores/hierarquia/",
            {"cliente_id": self.outro_cliente.id},
        )

        self.assertEqual(response.status_code, 403, response.data)


class InstrumentoDoClienteSetorDuplicadoTest(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.cliente = _make_cliente()
        self.user = User.objects.create_user(
            username="admin-setor",
            password="pass",
            is_staff=True,
        )
        self.user.groups.add(Group.objects.get_or_create(name="gerente")[0])
        self.user.clientes.add(self.cliente)
        self.api.force_authenticate(user=self.user)

        self.instrumento_base = _make_instrumento_base()
        self.instrumento = InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=self.instrumento_base,
            tag="TAG-SETOR-DUP",
            setor=None,
        )

    def test_admin_patch_usa_setor_existente_quando_ha_apenas_um_correspondente(self):
        setor = Setor.objects.create(nome="Laboratorio", cliente=self.cliente)

        response = self.api.patch(
            f"/instrumentos/{self.instrumento.id}/",
            {"setor": "Laboratorio"},
            format="json",
        )

        self.assertEqual(response.status_code, 204, response.data)
        self.instrumento.refresh_from_db()
        self.assertEqual(self.instrumento.setor_id, setor.id)
        self.assertEqual(
            Setor.objects.filter(nome="Laboratorio", cliente=self.cliente).count(),
            1,
        )

    def test_admin_patch_com_setor_duplicado_usa_primeiro_id_e_nao_cria_terceiro(self):
        setor_mais_antigo = Setor.objects.create(nome="Laboratorio", cliente=self.cliente)
        Setor.objects.create(nome="Laboratorio", cliente=self.cliente)

        response = self.api.patch(
            f"/instrumentos/{self.instrumento.id}/",
            {"setor": "Laboratorio"},
            format="json",
        )

        self.assertEqual(response.status_code, 204, response.data)
        self.instrumento.refresh_from_db()
        self.assertEqual(self.instrumento.setor_id, setor_mais_antigo.id)
        self.assertEqual(
            Setor.objects.filter(nome="Laboratorio", cliente=self.cliente).count(),
            2,
        )

    def test_admin_patch_cria_setor_novo_quando_nao_existe(self):
        response = self.api.patch(
            f"/instrumentos/{self.instrumento.id}/",
            {"setor": "Producao/Linha 1"},
            format="json",
        )

        self.assertEqual(response.status_code, 204, response.data)
        setor_raiz = Setor.objects.get(nome="Producao", cliente=self.cliente)
        setor_filho = Setor.objects.get(
            nome="Linha 1",
            cliente=self.cliente,
            setor_pai=setor_raiz,
        )
        self.instrumento.refresh_from_db()
        self.assertEqual(self.instrumento.setor_id, setor_filho.id)

    def test_setor_serializer_nao_permite_criar_duplicado_no_mesmo_pai(self):
        setor_pai = Setor.objects.create(nome="Predio A", cliente=self.cliente)
        Setor.objects.create(
            nome="Laboratorio",
            cliente=self.cliente,
            setor_pai=setor_pai,
        )

        serializer = SetorSerializer(data={
            "nome": "Laboratorio",
            "cliente": self.cliente.id,
            "setor_pai_id": setor_pai.id,
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn("nome", serializer.errors)

    def test_setor_serializer_permite_mesmo_nome_em_pais_diferentes(self):
        setor_pai = Setor.objects.create(nome="Predio A", cliente=self.cliente)
        outro_pai = Setor.objects.create(nome="Predio B", cliente=self.cliente)
        Setor.objects.create(
            nome="Laboratorio",
            cliente=self.cliente,
            setor_pai=setor_pai,
        )

        serializer = SetorSerializer(data={
            "nome": "Laboratorio",
            "cliente": self.cliente.id,
            "setor_pai_id": outro_pai.id,
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_setor_serializer_permite_multiplos_setores_temporarios_com_nome_vazio(self):
        Setor.objects.create(nome="", cliente=self.cliente)

        serializer = SetorSerializer(data={
            "nome": "",
            "cliente": self.cliente.id,
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)
        setor = serializer.save()
        self.assertEqual(setor.nome, "")

    def test_setor_serializer_permite_multiplos_setores_temporarios_com_nome_em_branco(self):
        Setor.objects.create(nome="   ", cliente=self.cliente)

        serializer = SetorSerializer(data={
            "nome": "   ",
            "cliente": self.cliente.id,
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_setor_serializer_bloqueia_editar_setor_temporario_para_nome_real_duplicado(self):
        Setor.objects.create(nome="Laboratorio", cliente=self.cliente)
        setor_temporario = Setor.objects.create(nome="", cliente=self.cliente)

        serializer = SetorSerializer(
            setor_temporario,
            data={"nome": "Laboratorio", "cliente": self.cliente.id},
            partial=True,
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("nome", serializer.errors)

    def test_setor_serializer_remove_espacos_de_nome_real_ao_salvar(self):
        serializer = SetorSerializer(data={
            "nome": "  Laboratorio  ",
            "cliente": self.cliente.id,
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)
        setor = serializer.save()
        self.assertEqual(setor.nome, "Laboratorio")


class CalibracaoResultadoHistoricoTest(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.cliente = _make_cliente()
        self.user = User.objects.create_user(username="gerente-cal", password="pass")
        self.user.groups.add(Group.objects.get_or_create(name="gerente")[0])
        self.user.clientes.add(self.cliente)
        self.api.force_authenticate(user=self.user)

        self.instrumento_base = _make_instrumento_base()
        self.instrumento = InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=self.instrumento_base,
            tag="TAG-CAL-001",
        )
        self.criterio = CriterioAceitacao.objects.create(
            instrumento=self.instrumento,
            tipo="Calibracao",
            criterio_de_aceitacao=Decimal("0.025"),
            unidade="mm",
        )

    def _post_calibracao(self, maior_erro="0.003", incerteza="0.002"):
        return self.api.post(
            "/calibracoes/",
            {
                "instrumento": self.instrumento.id,
                "local": "P",
                "data": "2026-05-28",
                "ordem_de_servico": "os 222222223",
                "observacoes": "",
                "maior_erro": maior_erro,
                "incerteza": incerteza,
                "criterio": self.criterio.id,
                "checagem": False,
            },
            format="json",
        )

    def test_cria_resultado_calibracao_com_decimais_pequenos(self):
        response = self._post_calibracao()

        self.assertEqual(response.status_code, 201, response.data)
        resultado = ResultadoCalibracao.objects.get(
            calibracao_id=response.data["id"]
        )
        self.assertEqual(resultado.criterio_id, self.criterio.id)
        self.assertEqual(resultado.maior_erro, Decimal("0.003"))
        self.assertEqual(resultado.incerteza, Decimal("0.002"))
        self.assertEqual(resultado.status, CalibracaoStatus.APROVADO)

    def test_cria_calibracao_com_multiplos_resultados(self):
        criterio_2 = CriterioAceitacao.objects.create(
            instrumento=self.instrumento,
            tipo="Calibracao 2",
            criterio_de_aceitacao=Decimal("0.010"),
            unidade="mm",
        )

        response = self.api.post(
            "/calibracoes/",
            {
                "instrumento": self.instrumento.id,
                "local": "P",
                "data": "2026-05-28",
                "ordem_de_servico": "OS-MULTI",
                "resultados": [
                    {
                        "criterio": self.criterio.id,
                        "maior_erro": "0.003",
                        "incerteza": "0.002",
                    },
                    {
                        "criterio": criterio_2.id,
                        "maior_erro": "0.004",
                        "incerteza": "0.001",
                    },
                ],
                "checagem": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        resultados = ResultadoCalibracao.objects.filter(
            calibracao_id=response.data["id"]
        ).order_by("id")
        self.assertEqual(resultados.count(), 2)
        self.assertEqual(resultados[0].criterio_id, self.criterio.id)
        self.assertEqual(resultados[0].maior_erro, Decimal("0.003"))
        self.assertEqual(resultados[0].incerteza, Decimal("0.002"))
        self.assertEqual(resultados[1].criterio_id, criterio_2.id)
        self.assertEqual(resultados[1].maior_erro, Decimal("0.004"))
        self.assertEqual(resultados[1].incerteza, Decimal("0.001"))

    def test_cria_calibracao_com_resultados_vazios(self):
        response = self.api.post(
            "/calibracoes/",
            {
                "instrumento": self.instrumento.id,
                "local": "P",
                "data": "2026-05-28",
                "ordem_de_servico": "OS-SEM-RESULTADOS",
                "resultados": [],
                "checagem": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertTrue(
            Calibracao.objects.filter(id=response.data["id"]).exists()
        )
        self.assertEqual(
            ResultadoCalibracao.objects.filter(
                calibracao_id=response.data["id"]
            ).count(),
            0,
        )

    def test_cria_calibracao_sem_enviar_resultados(self):
        response = self.api.post(
            "/calibracoes/",
            {
                "instrumento": self.instrumento.id,
                "local": "P",
                "data": "2026-05-28",
                "ordem_de_servico": "OS-SEM-CAMPO-RESULTADOS",
                "checagem": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertTrue(
            Calibracao.objects.filter(id=response.data["id"]).exists()
        )
        self.assertEqual(
            ResultadoCalibracao.objects.filter(
                calibracao_id=response.data["id"]
            ).count(),
            0,
        )

    def test_cria_checagem_com_resultados_vazios(self):
        response = self.api.post(
            "/calibracoes/",
            {
                "instrumento": self.instrumento.id,
                "local": "P",
                "data": "2026-05-28",
                "ordem_de_servico": "OS-CHECAGEM-VAZIA",
                "resultados": [],
                "checagem": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        calibracao = Calibracao.objects.get(id=response.data["id"])
        self.assertTrue(calibracao.checagem)
        self.assertEqual(calibracao.resultados.count(), 0)

    def test_resultado_incompleto_continua_falhando_com_mensagem_clara(self):
        response = self.api.post(
            "/calibracoes/",
            {
                "instrumento": self.instrumento.id,
                "local": "P",
                "data": "2026-05-28",
                "ordem_de_servico": "OS-RESULTADO-INCOMPLETO",
                "resultados": [
                    {
                        "criterio": self.criterio.id,
                        "incerteza": "0.002",
                    }
                ],
                "checagem": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data["resultados[0].maior_erro"][0],
            "Informe o maior erro.",
        )

    def test_calibracao_rejeita_criterio_de_outro_instrumento(self):
        outro_instrumento = InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=self.instrumento_base,
            tag="TAG-CAL-OUTRO",
        )
        criterio_outro = CriterioAceitacao.objects.create(
            instrumento=outro_instrumento,
            tipo="Outro",
            criterio_de_aceitacao=Decimal("0.010"),
            unidade="mm",
        )

        response = self.api.post(
            "/calibracoes/",
            {
                "instrumento": self.instrumento.id,
                "local": "P",
                "data": "2026-05-28",
                "ordem_de_servico": "OS-INVALIDA",
                "resultados": [
                    {
                        "criterio": criterio_outro.id,
                        "maior_erro": "0.003",
                        "incerteza": "0.002",
                    }
                ],
                "checagem": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(ResultadoCalibracao.objects.count(), 0)

    def test_calibracao_rejeita_criterio_duplicado_na_mesma_calibracao(self):
        response = self.api.post(
            "/calibracoes/",
            {
                "instrumento": self.instrumento.id,
                "local": "P",
                "data": "2026-05-28",
                "ordem_de_servico": "OS-DUP",
                "resultados": [
                    {
                        "criterio": self.criterio.id,
                        "maior_erro": "0.003",
                        "incerteza": "0.002",
                    },
                    {
                        "criterio": self.criterio.id,
                        "maior_erro": "0.004",
                        "incerteza": "0.001",
                    },
                ],
                "checagem": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(ResultadoCalibracao.objects.count(), 0)

    def test_calibracao_faz_rollback_se_um_resultado_for_invalido(self):
        criterio_2 = CriterioAceitacao.objects.create(
            instrumento=self.instrumento,
            tipo="Calibracao 2",
            criterio_de_aceitacao=Decimal("0.010"),
            unidade="mm",
        )

        response = self.api.post(
            "/calibracoes/",
            {
                "instrumento": self.instrumento.id,
                "local": "P",
                "data": "2026-05-28",
                "ordem_de_servico": "OS-ROLLBACK",
                "resultados": [
                    {
                        "criterio": self.criterio.id,
                        "maior_erro": "0.003",
                        "incerteza": "0.002",
                    },
                    {
                        "criterio": criterio_2.id,
                        "maior_erro": "valor invalido",
                        "incerteza": "0.001",
                    },
                ],
                "checagem": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(Calibracao.objects.filter(ordem_de_servico="OS-ROLLBACK").exists())
        self.assertEqual(ResultadoCalibracao.objects.count(), 0)

    def test_patch_multiplos_resultados_sem_alterar_nao_apaga_nenhum(self):
        criterio_2 = CriterioAceitacao.objects.create(
            instrumento=self.instrumento,
            tipo="Calibracao 2",
            criterio_de_aceitacao=Decimal("0.010"),
            unidade="mm",
        )
        calibracao = Calibracao.objects.create(
            instrumento=self.instrumento,
            local="P",
            data="2026-05-28",
            ordem_de_servico="OS-PATCH-KEEP",
            checagem=False,
        )
        resultado_1 = ResultadoCalibracao.objects.create(
            calibracao=calibracao,
            criterio=self.criterio,
            maior_erro=Decimal("0.003"),
            incerteza=Decimal("0.002"),
            status=CalibracaoStatus.APROVADO,
        )
        resultado_2 = ResultadoCalibracao.objects.create(
            calibracao=calibracao,
            criterio=criterio_2,
            maior_erro=Decimal("0.004"),
            incerteza=Decimal("0.001"),
            status=CalibracaoStatus.APROVADO,
        )

        response = self.api.patch(
            f"/calibracoes/{calibracao.id}/",
            {
                "instrumento": self.instrumento.id,
                "resultados": [
                    {
                        "id": resultado_1.id,
                        "criterio": self.criterio.id,
                        "maior_erro": "0.003",
                        "incerteza": "0.002",
                    },
                    {
                        "id": resultado_2.id,
                        "criterio": criterio_2.id,
                        "maior_erro": "0.004",
                        "incerteza": "0.001",
                    },
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertCountEqual(
            list(calibracao.resultados.values_list("id", flat=True)),
            [resultado_1.id, resultado_2.id],
        )

    def test_patch_adiciona_resultado_sem_apagar_resultados_antigos(self):
        criterio_2 = CriterioAceitacao.objects.create(
            instrumento=self.instrumento,
            tipo="Calibracao 2",
            criterio_de_aceitacao=Decimal("0.010"),
            unidade="mm",
        )
        calibracao = Calibracao.objects.create(
            instrumento=self.instrumento,
            local="P",
            data="2026-05-28",
            ordem_de_servico="OS-PATCH-ADD",
            checagem=False,
        )
        resultado_1 = ResultadoCalibracao.objects.create(
            calibracao=calibracao,
            criterio=self.criterio,
            maior_erro=Decimal("0.003"),
            incerteza=Decimal("0.002"),
            status=CalibracaoStatus.APROVADO,
        )

        response = self.api.patch(
            f"/calibracoes/{calibracao.id}/",
            {
                "instrumento": self.instrumento.id,
                "resultados": [
                    {
                        "id": resultado_1.id,
                        "criterio": self.criterio.id,
                        "maior_erro": "0.003",
                        "incerteza": "0.002",
                    },
                    {
                        "criterio": criterio_2.id,
                        "maior_erro": "0.004",
                        "incerteza": "0.001",
                    },
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(ResultadoCalibracao.objects.filter(id=resultado_1.id).exists())
        self.assertEqual(calibracao.resultados.count(), 2)
        self.assertTrue(calibracao.resultados.filter(criterio=criterio_2).exists())

    def test_patch_atualiza_resultado_existente_pelo_id(self):
        calibracao = Calibracao.objects.create(
            instrumento=self.instrumento,
            local="P",
            data="2026-05-28",
            ordem_de_servico="OS-PATCH-UPDATE",
            checagem=False,
        )
        resultado = ResultadoCalibracao.objects.create(
            calibracao=calibracao,
            criterio=self.criterio,
            maior_erro=Decimal("0.003"),
            incerteza=Decimal("0.002"),
            status=CalibracaoStatus.APROVADO,
        )

        response = self.api.patch(
            f"/calibracoes/{calibracao.id}/",
            {
                "instrumento": self.instrumento.id,
                "resultados": [
                    {
                        "id": resultado.id,
                        "criterio": self.criterio.id,
                        "maior_erro": "0.006",
                        "incerteza": "0.003",
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)
        resultado.refresh_from_db()
        self.assertEqual(resultado.maior_erro, Decimal("0.006"))
        self.assertEqual(resultado.incerteza, Decimal("0.003"))
        self.assertEqual(calibracao.resultados.count(), 1)

    def test_patch_multiplos_resultados_rejeita_criterio_duplicado(self):
        calibracao = Calibracao.objects.create(
            instrumento=self.instrumento,
            local="P",
            data="2026-05-28",
            ordem_de_servico="OS-PATCH-DUP",
            checagem=False,
        )

        response = self.api.patch(
            f"/calibracoes/{calibracao.id}/",
            {
                "instrumento": self.instrumento.id,
                "resultados": [
                    {
                        "criterio": self.criterio.id,
                        "maior_erro": "0.003",
                        "incerteza": "0.002",
                    },
                    {
                        "criterio": self.criterio.id,
                        "maior_erro": "0.004",
                        "incerteza": "0.001",
                    },
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(calibracao.resultados.count(), 0)

    def test_resultado_historico_sobrevive_ao_patch_de_criterios_vazio(self):
        response = self._post_calibracao()
        self.assertEqual(response.status_code, 201, response.data)
        resultado_id = ResultadoCalibracao.objects.get(
            calibracao_id=response.data["id"]
        ).id

        patch_response = self.api.patch(
            f"/instrumentos/{self.instrumento.id}/",
            {"criterios_aceitacao": []},
            format="json",
        )

        self.assertEqual(patch_response.status_code, 204, patch_response.data)
        resultado = ResultadoCalibracao.objects.get(id=resultado_id)
        self.assertEqual(resultado.criterio_id, self.criterio.id)
        self.assertEqual(resultado.maior_erro, Decimal("0.003"))
        self.assertEqual(resultado.incerteza, Decimal("0.002"))

    def test_resultado_historico_fica_sem_criterio_quando_criterio_e_deletado_explicitamente(self):
        response = self._post_calibracao()
        self.assertEqual(response.status_code, 201, response.data)
        resultado_id = ResultadoCalibracao.objects.get(
            calibracao_id=response.data["id"]
        ).id

        self.criterio.delete()

        resultado = ResultadoCalibracao.objects.get(id=resultado_id)
        self.assertIsNone(resultado.criterio_id)
        self.assertEqual(resultado.maior_erro, Decimal("0.003"))
        self.assertEqual(resultado.incerteza, Decimal("0.002"))

    def test_calibracao_rejeita_decimal_invalido(self):
        response = self._post_calibracao(maior_erro="abc")

        self.assertEqual(response.status_code, 400)
        self.assertIn("maior_erro", response.data)


class CalibracaoFileStorageErrorTest(TransactionTestCase):
    def setUp(self):
        self.api = APIClient()
        self.cliente = _make_cliente()
        self.user = User.objects.create_user(
            username="gerente-cal-storage",
            password="pass",
        )
        self.user.groups.add(Group.objects.get_or_create(name="gerente")[0])
        self.user.clientes.add(self.cliente)
        self.api.force_authenticate(user=self.user)

        instrumento_base = _make_instrumento_base()
        self.instrumento = InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=instrumento_base,
            tag="TAG-CAL-STORAGE",
        )
        self.calibracao = Calibracao.objects.create(
            instrumento=self.instrumento,
            local="P",
            data="2026-08-17",
            ordem_de_servico="OS-STORAGE",
            checagem=False,
        )

    def _uploaded_file(self, name="certificado.pdf"):
        return SimpleUploadedFile(
            name,
            b"conteudo do arquivo",
            content_type="application/pdf",
        )

    def assert_file_storage_error(self, response):
        self.assertEqual(response.status_code, 503, response.data)
        self.assertEqual(
            response.data,
            {
                "error": "file_storage_error",
                "message": "Erro de armazenamento de arquivos.",
            },
        )

    def test_adicionar_certificado_retorna_503_quando_storage_falha(self):
        storage = Certificado._meta.get_field("arquivo").storage

        with patch.object(storage, "save", side_effect=_make_storage_client_error()):
            with self.assertLogs("instrumentos.views", level="ERROR") as logs:
                response = self.api.post(
                    f"/calibracoes/{self.calibracao.id}/adicionar_certificado/",
                    {
                        "numero": "CERT-STORAGE",
                        "arquivo": self._uploaded_file(),
                    },
                    format="multipart",
                )

        self.assert_file_storage_error(response)
        self.assertFalse(
            Certificado.objects.filter(calibracao=self.calibracao).exists()
        )
        self.assertIn("operation=adicionar_certificado", logs.output[0])
        self.assertIn(f"calibracao_id={self.calibracao.id}", logs.output[0])
        self.assertIn("HeadObject", logs.output[0])

    def test_anexar_retorna_503_quando_storage_falha(self):
        certificado = Certificado.objects.create(
            numero="CERT-ANEXO",
            calibracao=self.calibracao,
        )
        storage = Anexo._meta.get_field("anexo").storage

        with patch.object(storage, "save", side_effect=_make_storage_client_error()):
            with self.assertLogs("instrumentos.views", level="ERROR") as logs:
                response = self.api.patch(
                    "/calibracoes/anexar/",
                    {
                        "certificado": certificado.id,
                        "anexo": self._uploaded_file("anexo.pdf"),
                    },
                    format="multipart",
                )

        self.assert_file_storage_error(response)
        self.assertFalse(Anexo.objects.filter(certificado=certificado).exists())
        self.assertIn("operation=anexar_certificado", logs.output[0])
        self.assertIn(f"certificado_id={certificado.id}", logs.output[0])

    def test_atualizar_certificado_retorna_503_quando_storage_falha(self):
        certificado = Certificado.objects.create(
            numero="CERT-ATUALIZAR",
            calibracao=self.calibracao,
        )
        storage = Certificado._meta.get_field("arquivo").storage

        with patch.object(storage, "save", side_effect=_make_storage_client_error()):
            response = self.api.patch(
                f"/calibracoes/{self.calibracao.id}/atualizar_certificado/",
                {
                    "certificado_id": certificado.id,
                    "arquivo": self._uploaded_file("certificado-atualizado.pdf"),
                },
                format="multipart",
            )

        self.assert_file_storage_error(response)

    def test_erro_de_programacao_nao_e_convertido_em_erro_de_storage(self):
        with patch(
            "instrumentos.views.Certificado.objects.create",
            side_effect=ValueError("erro inesperado"),
        ):
            with self.assertRaises(ValueError):
                self.api.post(
                    f"/calibracoes/{self.calibracao.id}/adicionar_certificado/",
                    {
                        "numero": "CERT-ERRO",
                        "arquivo": self._uploaded_file(),
                    },
                    format="multipart",
                )


class InstrumentoRelacionamentosIncrementaisTest(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.cliente = _make_cliente()
        self.user = User.objects.create_user(username="gerente-rel", password="pass")
        self.user.groups.add(Group.objects.get_or_create(name="gerente")[0])
        self.user.clientes.add(self.cliente)
        self.api.force_authenticate(user=self.user)

        self.instrumento_base = _make_instrumento_base()
        self.instrumento = InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=self.instrumento_base,
            tag="TAG-REL-001",
        )

    def test_create_instrumento_cria_pontos_e_criterios(self):
        response = self.api.post(
            "/instrumentos/",
            {
                "cliente": self.cliente.id,
                "instrumento": self.instrumento_base.id,
                "tag": "TAG-REL-002",
                "posicao": "U",
                "pontos_de_calibracao": ["P1", "P2"],
                "criterios_aceitacao": [
                    {
                        "tipo": "Calibracao",
                        "criterio_de_aceitacao": "0.025",
                        "unidade": "mm",
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        instrumento = InstrumentoDoCliente.objects.get(tag="TAG-REL-002")
        self.assertEqual(instrumento.pontos_de_calibracao.count(), 2)
        self.assertEqual(instrumento.criterios_aceitacao.count(), 1)

    def test_update_adiciona_pontos_sem_apagar_antigos_e_sem_duplicar(self):
        self.instrumento.pontos_de_calibracao.create(nome="P1")

        response = self.api.patch(
            f"/instrumentos/{self.instrumento.id}/",
            {"pontos_de_calibracao": ["P1", "P2", "P2"]},
            format="json",
        )

        self.assertEqual(response.status_code, 204, response.data)
        self.assertCountEqual(
            list(self.instrumento.pontos_de_calibracao.values_list("nome", flat=True)),
            ["P1", "P2"],
        )

    def test_read_instrumento_retorna_id_dos_pontos_de_calibracao(self):
        ponto = self.instrumento.pontos_de_calibracao.create(nome="P1")

        response = self.api.get(f"/instrumentos/{self.instrumento.id}/")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["pontos_de_calibracao"][0]["id"], ponto.id)
        self.assertEqual(response.data["pontos_de_calibracao"][0]["nome"], "P1")

    def test_update_reenvia_ponto_com_id_sem_duplicar(self):
        ponto = self.instrumento.pontos_de_calibracao.create(nome="P1")

        response = self.api.patch(
            f"/instrumentos/{self.instrumento.id}/",
            {"pontos_de_calibracao": [{"id": ponto.id, "nome": "P1"}]},
            format="json",
        )

        self.assertEqual(response.status_code, 204, response.data)
        self.assertEqual(self.instrumento.pontos_de_calibracao.count(), 1)

    def test_update_adiciona_criterio_sem_apagar_antigo(self):
        criterio_antigo = CriterioAceitacao.objects.create(
            instrumento=self.instrumento,
            tipo="Calibracao",
            criterio_de_aceitacao=Decimal("0.025"),
            unidade="mm",
        )

        response = self.api.patch(
            f"/instrumentos/{self.instrumento.id}/",
            {
                "criterios_aceitacao": [
                    {
                        "tipo": "Checagem",
                        "criterio_de_aceitacao": "0.010",
                        "unidade": "mm",
                    }
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, 204, response.data)
        self.assertTrue(
            CriterioAceitacao.objects.filter(id=criterio_antigo.id).exists()
        )
        self.assertEqual(self.instrumento.criterios_aceitacao.count(), 2)

    def test_update_reenvia_criterio_existente_sem_duplicar(self):
        criterio = CriterioAceitacao.objects.create(
            instrumento=self.instrumento,
            tipo="Calibracao",
            criterio_de_aceitacao=Decimal("0.025"),
            unidade="mm",
        )

        response = self.api.patch(
            f"/instrumentos/{self.instrumento.id}/",
            {
                "criterios_aceitacao": [
                    {
                        "tipo": criterio.tipo,
                        "criterio_de_aceitacao": "0.025",
                        "unidade": criterio.unidade,
                    }
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, 204, response.data)
        self.assertEqual(self.instrumento.criterios_aceitacao.count(), 1)

    def test_update_criterio_com_id_atualiza_sem_recriar(self):
        criterio = CriterioAceitacao.objects.create(
            instrumento=self.instrumento,
            tipo="Calibracao",
            criterio_de_aceitacao=Decimal("0.025"),
            unidade="mm",
        )

        response = self.api.patch(
            f"/instrumentos/{self.instrumento.id}/",
            {
                "criterios_aceitacao": [
                    {
                        "id": criterio.id,
                        "tipo": "Calibracao",
                        "criterio_de_aceitacao": "0.030",
                        "unidade": "mm",
                    }
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, 204, response.data)
        criterio.refresh_from_db()
        self.assertEqual(criterio.criterio_de_aceitacao, Decimal("0.030"))
        self.assertEqual(self.instrumento.criterios_aceitacao.count(), 1)

    def test_serializers_normal_e_admin_usam_funcao_compartilhada(self):
        class Request:
            user = self.user

        with patch("instrumentos.serializers.atualizar_relacionamentos_instrumento") as service_mock:
            InstrumentoDoClienteWriteSerializer(context={"request": Request()}).update(
                self.instrumento,
                {},
            )
            InstrumentoDoClienteWriteAdminSerializer(context={"request": Request()}).update(
                self.instrumento,
                {},
            )

        self.assertEqual(service_mock.call_count, 2)


class InstrumentoRemocaoRelacionamentosEndpointTest(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.cliente = _make_cliente()
        self.user = User.objects.create_user(username="gerente-rem", password="pass")
        self.user.groups.add(Group.objects.get_or_create(name="gerente")[0])
        self.user.clientes.add(self.cliente)
        self.api.force_authenticate(user=self.user)

        self.instrumento_base = _make_instrumento_base()
        self.instrumento = InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=self.instrumento_base,
            tag="TAG-REM-001",
        )

    def test_remove_normativo_apenas_da_associacao_do_instrumento(self):
        outro_instrumento = InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=self.instrumento_base,
            tag="TAG-REM-002",
        )
        normativo = Normativo.objects.create(nome="ISO 17025", cliente=self.cliente)
        self.instrumento.normativos.add(normativo)
        outro_instrumento.normativos.add(normativo)

        response = self.api.delete(
            f"/instrumentos/{self.instrumento.id}/normativos/{normativo.id}/"
        )

        self.assertEqual(response.status_code, 204)
        self.assertTrue(Normativo.objects.filter(id=normativo.id).exists())
        self.assertFalse(self.instrumento.normativos.filter(id=normativo.id).exists())
        self.assertTrue(outro_instrumento.normativos.filter(id=normativo.id).exists())

    def test_remove_ponto_de_calibracao_do_instrumento(self):
        ponto = PontoDeCalibracao.objects.create(
            instrumento=self.instrumento,
            nome="P1",
        )

        response = self.api.delete(
            f"/instrumentos/{self.instrumento.id}/pontos-calibracao/{ponto.id}/"
        )

        self.assertEqual(response.status_code, 204)
        self.assertFalse(PontoDeCalibracao.objects.filter(id=ponto.id).exists())

    def test_nao_remove_ponto_de_outro_instrumento(self):
        outro_instrumento = InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=self.instrumento_base,
            tag="TAG-REM-003",
        )
        ponto = PontoDeCalibracao.objects.create(
            instrumento=outro_instrumento,
            nome="P1",
        )

        response = self.api.delete(
            f"/instrumentos/{self.instrumento.id}/pontos-calibracao/{ponto.id}/"
        )

        self.assertEqual(response.status_code, 404)
        self.assertTrue(PontoDeCalibracao.objects.filter(id=ponto.id).exists())

    def test_remove_criterio_sem_apagar_resultado_historico(self):
        criterio = CriterioAceitacao.objects.create(
            instrumento=self.instrumento,
            tipo="Calibracao",
            criterio_de_aceitacao=Decimal("0.025"),
            unidade="mm",
        )
        calibracao_response = self.api.post(
            "/calibracoes/",
            {
                "instrumento": self.instrumento.id,
                "local": "P",
                "data": "2026-05-28",
                "ordem_de_servico": "OS-REM-001",
                "maior_erro": "0.003",
                "incerteza": "0.002",
                "criterio": criterio.id,
                "checagem": False,
            },
            format="json",
        )
        self.assertEqual(calibracao_response.status_code, 201, calibracao_response.data)
        resultado = ResultadoCalibracao.objects.get(
            calibracao_id=calibracao_response.data["id"]
        )

        response = self.api.delete(
            f"/instrumentos/{self.instrumento.id}/criterios-aceitacao/{criterio.id}/"
        )

        self.assertEqual(response.status_code, 204)
        self.assertFalse(CriterioAceitacao.objects.filter(id=criterio.id).exists())
        resultado.refresh_from_db()
        self.assertIsNone(resultado.criterio_id)
        self.assertEqual(resultado.maior_erro, Decimal("0.003"))
        self.assertEqual(resultado.incerteza, Decimal("0.002"))


class NormativoDuplicidadeTest(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.cliente = _make_cliente()
        self.user = User.objects.create_user(username="usuario-normas", password="pass")
        self.user.groups.add(Group.objects.get_or_create(name="gerente")[0])
        self.user.clientes.add(self.cliente)
        self.api.force_authenticate(user=self.user)

        self.instrumento_base = _make_instrumento_base()
        self.instrumento = InstrumentoDoCliente.objects.create(
            cliente=self.cliente,
            instrumento=self.instrumento_base,
            tag="TAG-NORMAS",
        )

    def test_normas_padrao_nao_duplicam_quando_signal_roda_mais_de_uma_vez(self):
        criar_normas_padrao(sender=Cliente, instance=self.cliente, created=True)
        criar_normas_padrao(sender=Cliente, instance=self.cliente, created=True)

        for nome in NORMAS_PADRAO:
            self.assertEqual(
                Normativo.objects.filter(cliente=self.cliente, nome__iexact=nome).count(),
                1,
            )

    def test_cliente_com_multiplos_usuarios_nao_recebe_normas_padrao_duplicadas(self):
        outro_usuario = User.objects.create_user(username="outro-usuario", password="pass")
        outro_usuario.clientes.add(self.cliente)
        criar_normas_padrao(sender=Cliente, instance=self.cliente, created=False)

        for nome in NORMAS_PADRAO:
            self.assertEqual(
                Normativo.objects.filter(cliente=self.cliente, nome__iexact=nome).count(),
                1,
            )

    def test_post_normativo_manual_com_mesmo_nome_reutiliza_existente(self):
        existente = Normativo.objects.filter(
            cliente=self.cliente,
            nome__iexact="ISO 9001",
        ).order_by("id").first()
        existente.nome = "ISO  9001"
        existente.save(update_fields=["nome"])

        response = self.api.post(
            "/normativos/",
            {"cliente": self.cliente.id, "nome": "  iso 9001  "},
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["id"], existente.id)
        self.assertEqual(
            [
                normativo for normativo in Normativo.objects.filter(cliente=self.cliente)
                if " ".join(normativo.nome.split()).casefold() == "iso 9001"
            ],
            [existente],
        )

    def test_listagem_deduplica_normativos_com_espacos_extras(self):
        canonico = Normativo.objects.filter(
            cliente=self.cliente,
            nome__iexact="ISO 9001",
        ).order_by("id").first()
        Normativo.objects.create(cliente=self.cliente, nome="ISO  9001")

        response = self.api.get("/normativos/", {"cliente": self.cliente.id})

        self.assertEqual(response.status_code, 200, response.data)
        iso_9001 = [
            normativo for normativo in response.data
            if " ".join(normativo["nome"].split()).casefold() == "iso 9001"
        ]
        self.assertEqual(len(iso_9001), 1)
        self.assertEqual(iso_9001[0]["id"], canonico.id)

    def test_listagem_admin_retorna_normativos_unicos_por_cliente(self):
        self.user.is_staff = True
        self.user.save(update_fields=["is_staff"])
        canonico = Normativo.objects.filter(
            cliente=self.cliente,
            nome__iexact="ISO 9001",
        ).order_by("id").first()
        Normativo.objects.create(cliente=self.cliente, nome="iso 9001")

        response = self.api.get("/normativos/", {"cliente": self.cliente.id})

        self.assertEqual(response.status_code, 200, response.data)
        iso_9001 = [
            normativo for normativo in response.data
            if normativo["nome"].casefold() == "iso 9001"
        ]
        self.assertEqual(len(iso_9001), 1)
        self.assertEqual(iso_9001[0]["id"], canonico.id)

    def test_listagem_usuario_comum_retorna_normativos_unicos(self):
        canonico = Normativo.objects.filter(
            cliente=self.cliente,
            nome__iexact="ISO 9001",
        ).order_by("id").first()
        Normativo.objects.create(cliente=self.cliente, nome="ISO 9001")

        response = self.api.get("/normativos/", {"cliente": self.cliente.id})

        self.assertEqual(response.status_code, 200, response.data)
        iso_9001 = [
            normativo for normativo in response.data
            if normativo["nome"].casefold() == "iso 9001"
        ]
        self.assertEqual(len(iso_9001), 1)
        self.assertEqual(iso_9001[0]["id"], canonico.id)

    def test_edicao_instrumento_associa_normativo_canonico_com_duplicados_historicos(self):
        canonico = Normativo.objects.filter(
            cliente=self.cliente,
            nome__iexact="ISO 9001",
        ).order_by("id").first()
        duplicado = Normativo.objects.create(cliente=self.cliente, nome="iso 9001")

        response = self.api.patch(
            f"/instrumentos/{self.instrumento.id}/",
            {"normativos": [{"id": duplicado.id, "nome": duplicado.nome}]},
            format="json",
        )

        self.assertEqual(response.status_code, 204, response.data)
        self.assertTrue(self.instrumento.normativos.filter(id=canonico.id).exists())
        self.assertFalse(self.instrumento.normativos.filter(id=duplicado.id).exists())
        self.assertTrue(Normativo.objects.filter(id=duplicado.id).exists())
