FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared code and pricing service
COPY backend/app/services/loan_pricing_service.py ./app/services/loan_pricing_service.py
COPY backend/microservices/shared ./shared
COPY backend/microservices/pricing_service ./pricing_service

ENV PYTHONPATH="/app:/app/shared"
ENV PORT=8003

EXPOSE 8003

CMD ["uvicorn", "pricing_service.main:app", "--host", "0.0.0.0", "--port", "8003"]
