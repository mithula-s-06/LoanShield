FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared models and application service code
COPY backend/microservices/shared ./shared
COPY backend/microservices/application_service ./application_service

ENV PYTHONPATH="/app:/app/shared"
ENV PORT=8002

EXPOSE 8002

CMD ["uvicorn", "application_service.main:app", "--host", "0.0.0.0", "--port", "8002"]
