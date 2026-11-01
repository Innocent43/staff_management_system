import secrets
from datetime import datetime,timedelta,timezone

import jwt

QR_TOKEN_SECONDS =60
ALGORITHM = "HS256"

def generate_workplace_secret()->str:
    return secrets.token_hex(32)

def create_qr_token(workplace_id: int,secret: str)->str:
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=QR_TOKEN_SECONDS)
    payload = {
        "wid": workplace_id,"exp":expires_at
    }
    return jwt.encode(payload,secret,algorithm=ALGORITHM)


def read_workplace_id(token: str)->int | None:
    try:
        claims = jwt.decode(token, options={"verify_signature": False})
        return int(claims["wid"])
    except (jwt.PyJWTError,KeyError,TypeError,ValueError):
        return None


def is_qr_token_valid(token: str,secret: str)->bool:
    try:
        jwt.decode(token,secret,algorithms=[ALGORITHM])
        return True
    except jwt.PyJWTError:
        return False

    