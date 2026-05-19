import logging

from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated, PermissionDenied
from rest_framework.views import exception_handler

from clientes.logging_utils import get_authorization_metadata, get_user_log_data

logger = logging.getLogger(__name__)


def logging_exception_handler(exc, context):
    request = context.get("request")
    view = context.get("view")

    if request and isinstance(exc, (AuthenticationFailed, NotAuthenticated, PermissionDenied)):
        auth_log_data = get_authorization_metadata(request)
        user_log_data = get_user_log_data(getattr(request, "user", None))
        logger.warning(
            "[DRF_AUTH_PERMISSION_EXCEPTION] exception_class=%s method=%s path=%s view=%s "
            "user_id=%s email=%s username=%s is_staff=%s is_authenticated=%s "
            "has_authorization_header=%s authorization_prefix=%s token_type=%s detail=%s",
            exc.__class__.__name__,
            request.method,
            request.path,
            view.__class__.__name__ if view else None,
            user_log_data["user_id"],
            user_log_data["email"],
            user_log_data["username"],
            user_log_data["is_staff"],
            user_log_data["is_authenticated"],
            auth_log_data["has_authorization_header"],
            auth_log_data["authorization_prefix"],
            auth_log_data["token_type"],
            exc,
        )

    return exception_handler(exc, context)
