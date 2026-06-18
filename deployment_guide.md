# MathGPT Enterprise Deployment Guide

This guide describes the procedures for launching the MathGPT Enterprise Neuro-Symbolic Mathematical Research Platform in local developments and production Kubernetes clusters.

---

## 1. System Requirements
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Kubernetes Cluster**: v1.24+ (for production manifest deployments)
- **Minimum Specifications**: 4 CPU cores, 8GB RAM (Lean4 compiler tasks are CPU intensive)

---

## 2. Setting Up Environment Variables

Verify that the `.env` configuration file exists in the root folder. You can configure model APIs (Gemini, Claude, DeepSeek Math) inside it:

```bash
# Example env entries
DATABASE_URL=postgresql://mathgpt_admin:mathgpt_secure_pass_9988@postgres:5432/mathgpt_prod
CELERY_BROKER_URL=redis://redis:6379/0
QDRANT_HOST=qdrant
NEO4J_URI=bolt://neo4j:7687
```

---

## 3. Local Development Deployment (Docker Compose)

Spin up all microservices (PostgreSQL, Redis, Qdrant, Neo4j, backend, celery worker, Vite frontend):

```bash
# Build and launch stack
docker-compose up --build -d
```

### Seeding Initial Datasets
Once the containers are running, execute the mathematical database seeder script to populate initial users, theorems (Fermat, Euler, Pythagoras), and graph links:

```bash
# Execute seeder inside the backend container
docker-compose exec backend python scripts/seed_data.py
```

---

## 4. Verifying Services
- **FastAPI Documentation Console**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Vite Web Dashboard**: [http://localhost:5173](http://localhost:5173)
- **Neo4j Browser Dashboard**: [http://localhost:7474](http://localhost:7474) (credentials: `neo4j` / `neo4j_secure_pass_7788`)
- **Qdrant Dashboard**: [http://localhost:6333/dashboard](http://localhost:6333/dashboard)

---

## 5. Kubernetes Production Deployment

For deploying into a production Kubernetes cluster:

```bash
# 1. Apply storage claims and databases
kubectl apply -f kubernetes/postgres-deployment.yaml
kubectl apply -f kubernetes/redis-deployment.yaml
kubectl apply -f kubernetes/qdrant-deployment.yaml
kubectl apply -f kubernetes/neo4j-deployment.yaml

# 2. Deploy backend APIs and worker engines
kubectl apply -f kubernetes/backend-deployment.yaml

# 3. Deploy client Single Page Application
kubectl apply -f kubernetes/frontend-deployment.yaml
```

Check pods status:
```bash
kubectl get pods -w
```
