# Backend - B&F Laboratório de Metrologia

Este diretório contém o código-fonte do backend para o site de gestão de instrumentos pela empresa B&F Laboratório de Metrologia.

## Descrição

O backend foi construído usando Django Rest Framework e oferece uma API para suportar as funcionalidades do frontend. Além disso, foi integrado o serviço de envio de e-mails utilizando o SendGrid.

## Armazenamento temporário das exportações de instrumentos

Em desenvolvimento, configure `PRIVATE_EXPORT_STORAGE=filesystem` e
`PRIVATE_EXPORT_LOCAL_PATH=/tmp/instrument-exports`. O Docker Compose monta um
volume nomeado nesse caminho somente nos serviços `web` e `celery_worker`, para
que o worker gere o CSV e o endpoint autenticado consiga baixá-lo. O volume não
é um bind mount e pode ser removido; perder esses arquivos em desenvolvimento é
esperado. Um arquivo removido é tratado como relatório expirado, sem erro 500.

Em produção, configure `PRIVATE_EXPORT_STORAGE=spaces`. As exportações usam as
credenciais e o `AWS_STORAGE_BUCKET_NAME` já existentes, sempre como objetos
privados sob `PRIVATE_EXPORT_LOCATION=exports/instrumentos`. Nenhuma URL pública
é retornada: o download passa pelo endpoint autenticado. Os arquivos expiram em
24 horas e a limpeza é agendada pelo Celery Beat.

### Funcionalidades Principais

- API para gerenciar pedidos de calibração e informações de instrumentos.
- Integração com o serviço SendGrid para envio de e-mails automatizados.

## Tecnologias Utilizadas

- Django
- Django Rest Framework
