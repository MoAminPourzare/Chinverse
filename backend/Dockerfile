FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=7860

RUN useradd -m -u 1000 user

WORKDIR /home/user/app

RUN pip install --no-cache-dir --upgrade pip poetry

COPY --chown=user pyproject.toml ./
RUN poetry config virtualenvs.create false \
    && poetry install --only main --no-root --no-interaction --no-ansi

COPY --chown=user . .

RUN mkdir -p uploads/avatars uploads/videos uploads/thumbnails static/uploads/gallery static/uploads/services \
    && chown -R user:user /home/user/app

USER user

EXPOSE 7860

CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
