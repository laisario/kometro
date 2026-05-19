import jwt


SENSITIVE_FIELD_NAMES = {"password", "token", "access", "refresh", "secret"}


def mask_sensitive_data(value):
    if isinstance(value, dict):
        return {
            key: "***MASKED***" if _is_sensitive_key(key) else mask_sensitive_data(item)
            for key, item in value.items()
        }

    if isinstance(value, (list, tuple)):
        return [mask_sensitive_data(item) for item in value]

    return value


def get_authorization_metadata(request):
    authorization = request.META.get("HTTP_AUTHORIZATION", "")
    parts = authorization.split()
    raw_token = parts[1] if len(parts) > 1 else ""

    return {
        "has_authorization_header": bool(authorization),
        "authorization_prefix": parts[0] if parts else None,
        "token_type": get_unverified_token_type(raw_token),
    }


def get_unverified_token_type(raw_token):
    if not raw_token:
        return None

    try:
        payload = jwt.decode(raw_token, options={"verify_signature": False})
    except jwt.PyJWTError:
        return None

    return payload.get("token_type") or payload.get("type")


def get_user_log_data(user):
    return {
        "user_id": getattr(user, "id", None),
        "email": getattr(user, "email", None),
        "username": getattr(user, "username", None),
        "is_staff": getattr(user, "is_staff", None),
        "is_authenticated": getattr(user, "is_authenticated", False),
    }


def _is_sensitive_key(key):
    normalized_key = str(key).lower()
    return any(sensitive_name in normalized_key for sensitive_name in SENSITIVE_FIELD_NAMES)
