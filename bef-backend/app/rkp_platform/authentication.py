import logging

from rest_framework_simplejwt.authentication import JWTAuthentication

from clientes.logging_utils import get_authorization_metadata

logger = logging.getLogger(__name__)


class LoggingJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except Exception as exc:
            auth_log_data = get_authorization_metadata(request)
            logger.warning(
                "[JWT_AUTHENTICATION_FAILED] method=%s path=%s has_authorization_header=%s "
                "authorization_prefix=%s token_type=%s error=%s",
                request.method,
                request.path,
                auth_log_data["has_authorization_header"],
                auth_log_data["authorization_prefix"],
                auth_log_data["token_type"],
                exc,
            )
            raise
