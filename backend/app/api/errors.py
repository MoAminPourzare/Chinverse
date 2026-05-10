from fastapi import HTTPException, status


def bad_request(detail: str = "Bad request") -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


def unauthorized(detail: str = "Could not validate credentials") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def forbidden(detail: str = "Not enough permissions") -> HTTPException:
    return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


def not_found(resource: str = "Resource") -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{resource} not found")


def conflict(detail: str = "Conflict") -> HTTPException:
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)


def too_many_requests(retry_after_seconds: int) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail="Too many requests. Please try again later.",
        headers={"Retry-After": str(max(retry_after_seconds, 1))},
    )
