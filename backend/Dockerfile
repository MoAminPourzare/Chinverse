FROM python:3.11.15-slim-bookworm AS builder

ARG POETRY_VERSION=2.4.1

ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_CREATE=true \
    POETRY_VIRTUALENVS_IN_PROJECT=true

WORKDIR /home/user/app

RUN python -m venv /opt/poetry \
    && /opt/poetry/bin/pip install --no-cache-dir --upgrade pip "poetry==${POETRY_VERSION}"

ENV PATH="/opt/poetry/bin:${PATH}"

COPY pyproject.toml poetry.lock ./
RUN poetry sync --only main --no-root --no-ansi


FROM python:3.11.15-slim-bookworm AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    VIRTUAL_ENV=/home/user/app/.venv \
    PATH="/home/user/app/.venv/bin:${PATH}" \
    PORT=7860

RUN useradd -m -u 1000 user

WORKDIR /home/user/app

COPY --from=builder --chown=user:user /home/user/app/.venv ./.venv
COPY --chown=user:user . .

RUN mkdir -p uploads/avatars uploads/videos uploads/thumbnails static/uploads/gallery static/uploads/services \
    && chown -R user:user /home/user/app

USER user

EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:' + __import__('os').environ.get('PORT', '7860') + '/health/ready', timeout=4)"

CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
