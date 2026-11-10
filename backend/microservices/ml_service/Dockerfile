FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy ML models and code
COPY backend/ml ./ml
COPY backend/microservices/shared ./shared
COPY backend/microservices/ml_service ./ml_service

ENV PYTHONPATH="/app:/app/ml:/app/shared"
ENV PORT=8001

EXPOSE 8001

CMD ["uvicorn", "ml_service.main:app", "--host", "0.0.0.0", "--port", "8001"]
