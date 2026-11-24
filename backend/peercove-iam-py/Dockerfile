FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Create non-root user with an explicit home directory
RUN useradd -m -u 1001 peercove && chown -R peercove /app /home/peercove

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY app ./app
COPY migrations ./migrations

RUN chown -R peercove:peercove /app /home/peercove

USER peercove
ENV HOME=/home/peercove
ENV UV_CACHE_DIR=/home/peercove/.cache/uv
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 5001

CMD ["uv", "run", "--no-sync", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5001"]
