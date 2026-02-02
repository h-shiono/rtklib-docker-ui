# Multi-stage Dockerfile for RTKLIB Web UI
# Stage 1: Build frontend
# Stage 2: Build backend with uv
# Stage 3: Runtime

# ================================
# Stage 1: Build Frontend
# ================================
FROM node:22-slim AS frontend-builder

WORKDIR /app/frontend

# Copy frontend source
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ================================
# Stage 2: Build Backend with uv
# ================================
FROM ghcr.io/astral-sh/uv:python3.12-bookworm AS backend-builder

WORKDIR /app

# Copy pyproject.toml and lock file
COPY pyproject.toml uv.lock* ./

# Install dependencies (frozen if lock exists)
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev || uv sync --no-dev

# Copy backend source
COPY src/ ./src/

# ================================
# Stage 3: Runtime
# ================================
FROM python:3.12-slim-bookworm AS runtime

WORKDIR /app

# Install RTKLIB binaries
# Note: In production, you would build or copy RTKLIB binaries here
# For now, we create placeholder directories
RUN mkdir -p /usr/local/bin && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
        libgfortran5 \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from backend builder
COPY --from=backend-builder /app/.venv /app/.venv

# Copy backend source
COPY --from=backend-builder /app/src /app/src

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist /app/static

# Set PATH to use venv
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app/src"

# Create workspace directory for bind mount
RUN mkdir -p /workspace

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "rtklib_web_ui.main:app", "--host", "0.0.0.0", "--port", "8000"]
