# MathGPT Enterprise
### Neuro-Symbolic Mathematical Research Assistant.

MathGPT Enterprise is an advanced, production-grade enterprise platform that combines Generative AI, Formal Theorem Proving (Lean4), Symbolic Mathematics (SymPy), Automated Reasoning (LangGraph agents), and Research Paper Intelligence (ArXiv).

Every mathematical output is traceable, explainable, and verifiable.

---

## Key Capabilities
- **Theorem Explorer**: Discover theorems, search equivalent equations, and view dependency graphs via Neo4j and React Flow.
- **Automated Conjecture Generator**: Mine computational number patterns and suggest sequence hypothesis with confidence scoring.
- **Lean4 Proof Studio**: Write, inspect, compile, and debug formal proofs in Monaco Editor.
- **Symbolic Solver Workspace**: Perform exact algebraic simplification, integration, and matrix solver routines via SymPy.
- **Research Literature Analyzer**: Crawl and parse arXiv XML metadata, extracting theorem definitions and building citation lists.
- **Neuro-Symbolic Agent Graph**: LangGraph state machine coordinating reasoning, symbolic validation, compiler tests, and KG relationships.

---

## Directory Structure
```
MathGPT_Enterprise/
├── backend/                  # FastAPI, Celery, LangGraph workflows, MCP server
│   ├── app/
│   │   ├── agents/           # Reasoning, Symbolic, Formal, Coding, Research, KG agents
│   │   ├── mcp/              # MCP Server and tools registry
│   │   ├── main.py           # FastAPI entrypoint
│   │   ├── database.py       # PostgreSQL schemas & SQLAlchemy connection
│   │   ├── vector_store.py   # Qdrant indexing & queries
│   │   ├── graph_store.py    # Neo4j connections & graph queries
│   │   └── tasks.py          # Celery background workers
│   └── tests/                # Unit test suites (api and agents)
├── frontend/                 # React, TS, Tailwind CSS, Monaco, React Flow
│   ├── src/
│   │   ├── components/       # LeanStudio, TheoremExplorer, Solver, ConjectureGen, Research
│   │   ├── store/            # Zustund/Context global state
│   │   └── App.tsx           # Dashboard workspace view manager
├── kubernetes/               # PostgreSQL, Redis, Qdrant, Neo4j, Backend, Frontend manifests
├── scripts/                  # Seeding script and Lean4 installation compiler setup
├── docker-compose.yml        # Local orchestrations
└── deployment_guide.md       # Quick start commands and configurations
```

---

## Quick Start (Docker Compose)
1. Launch all services:
   ```bash
   docker-compose up --build -d
   ```
2. Populate sample mathematical records:
   ```bash
   docker-compose exec backend python scripts/seed_data.py
   ```
3. Open Web Client:
   Go to [http://localhost:5173](http://localhost:5173) and log in using:
   - **Email**: `scientist@mathgpt.io`
   - **Password**: `quantum_field_theory_9988`
