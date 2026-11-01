from pwdlib import PasswordHash

hasher = PasswordHash.recommended()

def hash_password(password: str) -> str:
    return hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str)-> bool:
    return hasher.verify(plain_password,hashed_password)