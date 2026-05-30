# security.py
from passlib.context import CryptContext

# Tell passlib to use the bcrypt algorithm
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Takes a plain text password and returns a secure hash."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Checks if a plain text password matches the scrambled hash in the DB."""
    return pwd_context.verify(plain_password, hashed_password)
