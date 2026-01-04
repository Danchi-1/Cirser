FROM python:3.10-slim

WORKDIR /app

# Install system deps (including libpq-dev for Postgres)
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Explicitly expose the port (Helps Render detect it)
EXPOSE 8000

# Bind to 0.0.0.0 on Port 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
