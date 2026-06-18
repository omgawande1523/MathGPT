FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install elan (Lean Version Manager) and Lean4
ENV ELAN_HOME=/usr/local/elan
ENV PATH=$ELAN_HOME/bin:$PATH
RUN curl https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh -sSf | sh -s -- -y --default-toolchain leanprover/lean4:stable

# Setup workdir
WORKDIR /backend

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY . .

# Expose port
EXPOSE 8000

# Run FastAPI app by default
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
