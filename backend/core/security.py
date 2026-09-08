import os
import secrets
from dataclasses import dataclass
from typing import Literal

from fastapi import Depends, HTTPException, Request, status


Role = Literal["viewer", "operator", "admin"]

ROLE_RANK: dict[Role, int] = {
    "viewer": 1,
    "operator": 2,
    "admin": 3,
}

TOKEN_ENV_BY_ROLE: dict[Role, str] = {
    "viewer": "PLATFORM_VIEWER_TOKEN",
    "operator": "PLATFORM_OPERATOR_TOKEN",
    "admin": "PLATFORM_ADMIN_TOKEN",
}


@dataclass(frozen=True)
class Principal:
    role: Role


def configured_tokens() -> dict[Role, str]:
    tokens: dict[Role, str] = {}

    for role, env_name in TOKEN_ENV_BY_ROLE.items():
        token = os.getenv(env_name, "").strip()

        if token:
            tokens[role] = token

    return tokens


def unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="PlatformPilot authentication failed.",
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )


def authenticate_request(
    request: Request,
) -> Principal:
    tokens = configured_tokens()

    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "PlatformPilot API authentication "
                "is not configured."
            ),
        )

    authorization = request.headers.get(
        "authorization",
        "",
    )

    scheme, _, supplied_token = authorization.partition(
        " "
    )

    supplied_token = supplied_token.strip()

    if (
        scheme.lower() != "bearer"
        or not supplied_token
    ):
        raise unauthorized()

    for role, expected_token in tokens.items():
        if secrets.compare_digest(
            supplied_token,
            expected_token,
        ):
            return Principal(role=role)

    raise unauthorized()


def require_role(
    minimum_role: Role,
):
    def dependency(
        principal: Principal = Depends(
            authenticate_request
        ),
    ) -> Principal:
        if (
            ROLE_RANK[principal.role]
            < ROLE_RANK[minimum_role]
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "PlatformPilot role is not "
                    "authorized for this operation."
                ),
            )

        return principal

    return dependency
