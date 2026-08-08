from typing import Optional
from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    mfa_verified: bool = False
    requires_verification: bool = False

class TokenPayload(BaseModel):
    sub: Optional[int] = None
    sid: Optional[str] = None
    type: Optional[str] = None
    role: str = "user"
    mfa: bool = False
