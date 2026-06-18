import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Table, Float
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from sqlalchemy.sql import func
from app.config import settings

# Try to connect to PostgreSQL. If it fails, fallback to a local SQLite database for standalone local execution.
try:
    engine = create_engine(settings.DATABASE_URL, connect_args={"connect_timeout": 2} if "postgresql" in settings.DATABASE_URL else {})
    with engine.connect() as conn:
        pass
except Exception:
    import os
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sqlite_path = os.path.join(base_dir, "mathgpt_dev.db")
    print(f"PostgreSQL connection failed. Falling back to local SQLite database: {sqlite_path}")
    engine = create_engine(f"sqlite:///{sqlite_path}", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Many-to-many relationship helper table for paper citations
paper_citations = Table(
    'paper_citations',
    Base.metadata,
    Column('paper_id', String(50), ForeignKey('research_papers.id'), primary_key=True),
    Column('cited_paper_id', String(50), ForeignKey('research_papers.id'), primary_key=True)
)

# Many-to-many relationship helper table for project members
project_members = Table(
    'project_members',
    Base.metadata,
    Column('project_id', Integer, ForeignKey('projects.id'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default="researcher") # administrator, researcher, reviewer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())

    projects = relationship("Project", secondary=project_members, back_populates="members")
    created_projects = relationship("Project", back_populates="owner")
    comments = relationship("Comment", back_populates="author")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    owner = relationship("User", back_populates="created_projects")
    members = relationship("User", secondary=project_members, back_populates="projects")
    theorems = relationship("Theorem", back_populates="project")
    conjectures = relationship("Conjecture", back_populates="project")
    workflows = relationship("WorkflowRun", back_populates="project")

class Theorem(Base):
    __tablename__ = "theorems"

    id = Column(String(100), primary_key=True, index=True) # E.g., "thm_fermat_last"
    title = Column(String(255), nullable=False)
    statement = Column(Text, nullable=False) # LaTeX formatted mathematical statement
    formal_statement_lean = Column(Text, nullable=True) # Lean4 statement declaration
    domain = Column(String(100), index=True) # "Number Theory", "Topology", etc.
    status = Column(String(50), default="unproven") # unproven, proven, disproven, formal_verified
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    project = relationship("Project", back_populates="theorems")
    proofs = relationship("Proof", back_populates="theorem")
    versions = relationship("TheoremVersion", back_populates="theorem")

class Proof(Base):
    __tablename__ = "proofs"

    id = Column(Integer, primary_key=True, index=True)
    theorem_id = Column(String(100), ForeignKey("theorems.id"), nullable=False)
    proof_text = Column(Text, nullable=False) # Informal math proof write-up
    lean_code = Column(Text, nullable=True) # Formal Lean4 proof script
    verification_status = Column(String(50), default="unverified") # unverified, verified_symbolic, verified_formal, failed
    verification_log = Column(Text, nullable=True) # Compiler output or error trace
    confidence_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    theorem = relationship("Theorem", back_populates="proofs")
    comments = relationship("Comment", back_populates="proof")

class Conjecture(Base):
    __tablename__ = "conjectures"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    statement = Column(Text, nullable=False)
    symbolic_representation = Column(Text, nullable=True)
    domain = Column(String(100), index=True)
    confidence_score = Column(Float, default=0.0)
    support_evidence = Column(Text, nullable=True) # SymPy evaluation or numerical tests
    status = Column(String(50), default="candidate") # candidate, verified, rejected
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    created_at = Column(DateTime, default=func.now())

    project = relationship("Project", back_populates="conjectures")

class ResearchPaper(Base):
    __tablename__ = "research_papers"

    id = Column(String(50), primary_key=True, index=True) # arXiv ID or DOI
    title = Column(String(500), nullable=False)
    authors = Column(Text, nullable=True)
    abstract = Column(Text, nullable=True)
    pdf_url = Column(String(500), nullable=True)
    published_year = Column(Integer, nullable=True)
    extracted_theorems = Column(Text, nullable=True) # JSON stored theorems list
    created_at = Column(DateTime, default=func.now())

    cited_by = relationship(
        "ResearchPaper",
        secondary=paper_citations,
        primaryjoin="ResearchPaper.id==paper_citations.c.paper_id",
        secondaryjoin="ResearchPaper.id==paper_citations.c.cited_paper_id",
        backref="citations"
    )

class WorkflowRun(Base):
    __tablename__ = "workflows"

    id = Column(String(100), primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    workflow_type = Column(String(100), nullable=False) # e.g. "proof_generation", "conjecture_mining"
    status = Column(String(50), default="pending") # pending, running, completed, failed
    trigger_payload = Column(Text, nullable=True) # JSON settings
    results = Column(Text, nullable=True) # JSON output
    created_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime, nullable=True)

    project = relationship("Project", back_populates="workflows")
    agent_logs = relationship("AgentLog", back_populates="workflow_run")

class AgentLog(Base):
    __tablename__ = "agent_logs"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(String(100), ForeignKey("workflows.id"), nullable=False)
    agent_name = Column(String(100), nullable=False) # Reasoning, Symbolic, Formal, etc.
    step_description = Column(Text, nullable=False)
    input_payload = Column(Text, nullable=True)
    output_payload = Column(Text, nullable=True)
    latency_ms = Column(Integer, nullable=True)
    cost = Column(Float, default=0.0)
    created_at = Column(DateTime, default=func.now())

    workflow_run = relationship("WorkflowRun", back_populates="agent_logs")

class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    role = Column(String(50), nullable=False) # user, assistant, system
    content = Column(Text, nullable=False)
    model_name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=func.now())

class TheoremVersion(Base):
    __tablename__ = "theorem_versions"

    id = Column(Integer, primary_key=True, index=True)
    theorem_id = Column(String(100), ForeignKey("theorems.id"), nullable=False)
    statement = Column(Text, nullable=False)
    formal_statement_lean = Column(Text, nullable=True)
    version = Column(Integer, nullable=False)
    updated_by_id = Column(Integer, ForeignKey("users.id"))
    updated_at = Column(DateTime, default=func.now())

    theorem = relationship("Theorem", back_populates="versions")

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    proof_id = Column(Integer, ForeignKey("proofs.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())

    proof = relationship("Proof", back_populates="comments")
    author = relationship("User", back_populates="comments")

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
