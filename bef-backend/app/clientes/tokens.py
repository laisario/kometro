import jwt
from django.conf import settings
from datetime import datetime, timedelta
from rest_framework.exceptions import ValidationError

def generate_invite_token(group_id, created_by_id):
    payload = {
        "group_id": group_id,
        "created_by": created_by_id,
        "exp": datetime.utcnow() + timedelta(days=7),
        "type": "invite"
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

def decode_invite_token(token):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "invite":
            raise ValidationError("Token inválido")
        return payload
    except jwt.ExpiredSignatureError:
        raise ValidationError("O convite expirou")
    except jwt.InvalidTokenError:
        raise ValidationError("Token inválido")
