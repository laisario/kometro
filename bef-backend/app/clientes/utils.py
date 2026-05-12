import jwt
import uuid
from django.conf import settings
from django.utils import timezone


def gerar_token_convite(grupo_id, criado_por_id, cliente_id):
    """Generate a JWT invite token for client/user invitation.
    
    Args:
        grupo_id: The group ID to assign the invited user to
        criado_por_id: The ID of the user creating the invite
        cliente_id: The client ID
    
    Returns:
        tuple: (token, jti) where token is the JWT string and jti is the unique identifier
    """
    jti = str(uuid.uuid4())
    payload = {
        "jti": jti,
        "grupo_id": grupo_id,
        "criado_por": criado_por_id,
        "cliente_id": cliente_id,
        "type": "invite",
        "exp": timezone.now() + timezone.timedelta(days=7)
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    return token, jti


def get_invite_url(token):
    """Build the full invite URL from a token.
    
    Args:
        token: The JWT invite token
    
    Returns:
        str: The complete invite URL
    """
    site = getattr(settings, 'SITE', 'http://localhost:5173')
    return f"{site}/#/register/invite/{token}"