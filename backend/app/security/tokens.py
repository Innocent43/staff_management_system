import hashlib
import secrets
from datetime import datetime,timezone,timedelta

import jwt

from app.core.config import settings

ALGORITHM ="HS256"

def create_access_token(user_id: int,membership_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(settings.access_token_expire_minute)

    payload = {
        "sub": str(user_id),
        "mid": membership_id,
        "exp": expire
    }

    return jwt.encode(payload,settings.secret_key,algorithm=ALGORITHM)



def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None



def hash_invite_token(raw_token: str)-> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()


def generate_invite_token()-> tuple[str,str]:
    raw_token = secrets.token_urlsafe(32)
    return raw_token, hash_invite_token(raw_token)