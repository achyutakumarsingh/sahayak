# Production Dockerfile for Sahayak Backend (FastAPI + ONNX Runtime)
FROM python:3.13-slim

WORKDIR /app

# Install curl for container health check
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend code, models, and grounding data
COPY . .

# Environment settings
ENV PYTHONUNBUFFERED=1 \
    ENVIRONMENT=production \
    PORT=8000

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8000}/api/health || exit 1

# Start uvicorn on dynamic port provided by hosting environment ($PORT)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
