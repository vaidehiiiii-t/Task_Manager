# Use official Python runtime as a parent image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies and Node.js (Required for Prisma Client Generation)
RUN apt-get update && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Generate Prisma Client
RUN prisma generate

# Expose port (Fallback, Railway provides PORT env var)
EXPOSE 8000

# Start command (Railway will likely override this using railway.toml startCommand)
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
