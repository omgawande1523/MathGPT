from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Authentication Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: Optional[str] = "researcher"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Project Schemas
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Theorem Explorer Schemas
class TheoremCreate(BaseModel):
    id: str = Field(..., description="Unique slug ID like thm_goldbach")
    title: str
    statement: str
    formal_statement_lean: Optional[str] = None
    domain: str
    project_id: int

class TheoremResponse(BaseModel):
    id: str
    title: str
    statement: str
    formal_statement_lean: Optional[str] = None
    domain: str
    status: str
    project_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class TheoremRelationshipCreate(BaseModel):
    from_theorem_id: str
    to_theorem_id: str
    relationship_type: str # implies, depends_on, extends, generalizes, contradicts

# Proof Validator Schemas
class ProofSubmit(BaseModel):
    theorem_id: str
    proof_text: str
    lean_code: Optional[str] = None

class ProofResponse(BaseModel):
    id: int
    theorem_id: str
    proof_text: str
    lean_code: Optional[str] = None
    verification_status: str
    verification_log: Optional[str] = None
    confidence_score: float
    created_at: datetime

    class Config:
        from_attributes = True

# Conjecture Generator Schemas
class ConjectureCreate(BaseModel):
    title: str
    statement: str
    symbolic_representation: Optional[str] = None
    domain: str
    project_id: int

class ConjectureResponse(BaseModel):
    id: int
    title: str
    statement: str
    symbolic_representation: Optional[str] = None
    domain: str
    confidence_score: float
    support_evidence: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Symbolic Solver Schemas
class SolverQuery(BaseModel):
    expression: str
    operation: str # integrate, differentiate, solve, simplify, factor, matrix_det, matrix_inv
    variables: List[str] = ["x"]

class SolverResponse(BaseModel):
    expression: str
    operation: str
    result: str
    latex_result: str
    success: bool
    error: Optional[str] = None

# Mathematical Coding Schemas
class CodeGenRequest(BaseModel):
    language: str # python, matlab, julia, sagemath
    task_description: str
    context_code: Optional[str] = None

class CodeGenResponse(BaseModel):
    language: str
    generated_code: str
    explanation: str
    success: bool

# Research Literature Schemas
class PaperResponse(BaseModel):
    id: str
    title: str
    authors: Optional[str] = None
    abstract: Optional[str] = None
    pdf_url: Optional[str] = None
    published_year: Optional[int] = None
    extracted_theorems: Optional[str] = None

    class Config:
        from_attributes = True

class PaperSearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 5

# Formula Search Schemas
class FormulaSearchRequest(BaseModel):
    latex_formula: str

class FormulaSearchResultItem(BaseModel):
    theorem_id: str
    title: str
    statement: str
    similarity: float

class FormulaSearchResponse(BaseModel):
    query: str
    matches: List[FormulaSearchResultItem]

# Explainable AI Neuro-Symbolic Engine
class NeuroSymbolicRequest(BaseModel):
    project_id: int
    prompt: str

class NeuroSymbolicResponse(BaseModel):
    answer: str
    reasoning_trace: List[str]
    symbolic_verification_result: str
    proof_status: str
    confidence_score: float
    references: List[str]
    knowledge_graph_links: List[Dict[str, Any]]
