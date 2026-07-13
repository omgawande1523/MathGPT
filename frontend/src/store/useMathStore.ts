import { useState, useEffect } from 'react';

export interface Project {
  id: number;
  name: string;
  description: string;
}

export interface Theorem {
  id: string;
  title: string;
  statement: string;
  formal_statement_lean?: string;
  domain: string;
  status: string;
  project_id: number;
}

export interface Proof {
  id: number;
  theorem_id: string;
  proof_text: string;
  lean_code?: string;
  verification_status: string;
  verification_log?: string;
  confidence_score: number;
}

export interface Conjecture {
  id: number;
  title: string;
  statement: string;
  symbolic_representation?: string;
  domain: string;
  confidence_score: number;
  support_evidence?: string;
  status: string;
}

export interface Paper {
  id: string;
  title: string;
  authors?: string;
  abstract?: string;
  pdf_url?: string;
  published_year?: number;
}

const API_BASE_URL = 'http://localhost:8000/api/v1';

// ─────────────────────────────────────────────────────────────────────────────
// DEMO-MODE MOCK DATA  (used as fallback when backend is unavailable)
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_PROJECTS: Project[] = [
  { id: 1, name: 'Algebraic Structures Research',  description: 'Exploring ring theory, group homomorphisms, and field extensions.' },
  { id: 2, name: 'Number Theory Workspace',        description: 'Prime distribution, Riemann hypothesis connections, and modular arithmetic.' },
  { id: 3, name: 'Topological Analysis',           description: 'Manifold theory, compactness proofs, and metric space completeness.' },
];

const MOCK_THEOREMS: Theorem[] = [
  {
    id: 'thm-001', title: 'Fundamental Theorem of Algebra', project_id: 1,
    statement: 'Every non-zero single-variable polynomial with complex coefficients has at least one complex root.',
    formal_statement_lean: 'theorem fundamental_theorem_algebra (p : Polynomial \u2102) (hp : p \u2260 0) :\n  \u2203 z : \u2102, p.eval z = 0 := by\n  exact Polynomial.IsAlgClosed.exists_eval_eq_zero \u2102 p hp',
    domain: 'Complex Analysis', status: 'formal_verified',
  },
  {
    id: 'thm-002', title: "Fermat's Last Theorem", project_id: 2,
    statement: 'No three positive integers a, b, c satisfy a\u207F + b\u207F = c\u207F for any integer n > 2.',
    formal_statement_lean: 'theorem fermats_last_theorem (n : \u2115) (hn : n > 2) (a b c : \u2115) :\n  a^n + b^n \u2260 c^n := fermatLastTheorem n hn a b c',
    domain: 'Number Theory', status: 'formal_verified',
  },
  {
    id: 'thm-003', title: "Cauchy's Integral Theorem", project_id: 1,
    statement: 'If f is holomorphic on a simply connected open set U, then for any closed curve \u03b3 in U, \u222e_\u03b3 f(z) dz = 0.',
    domain: 'Complex Analysis', status: 'symbolic_verified',
  },
  {
    id: 'thm-004', title: 'Bolzano\u2013Weierstrass Theorem', project_id: 3,
    statement: 'Every bounded sequence in \u211d\u207F has a convergent subsequence.',
    domain: 'Real Analysis', status: 'proof_pending',
  },
  {
    id: 'thm-005', title: "Sylow's First Theorem", project_id: 1,
    statement: 'If p is prime and p^k divides |G|, then G has a subgroup of order p^k.',
    domain: 'Group Theory', status: 'formal_verified',
  },
  {
    id: 'thm-006', title: 'Prime Number Theorem', project_id: 2,
    statement: 'The number of primes less than x is asymptotically equivalent to x / ln(x) as x \u2192 \u221e.',
    domain: 'Number Theory', status: 'symbolic_verified',
  },
];

const MOCK_CONJECTURES: Conjecture[] = [
  {
    id: 1, title: 'Twin Prime Conjecture', domain: 'Number Theory', confidence_score: 0.72,
    statement: 'There are infinitely many pairs of prime numbers that differ by 2.',
    symbolic_representation: '\u2200 N \u2208 \u2115, \u2203 p > N : p prime \u2227 (p+2) prime',
    support_evidence: "Zhang's theorem shows bounded gaps (\u2264 246). Verified computationally up to 10^18.",
    status: 'open',
  },
  {
    id: 2, title: 'Collatz Conjecture', domain: 'Number Theory', confidence_score: 0.65,
    statement: 'For any positive integer n, repeated application of f(n) = n/2 (even) or 3n+1 (odd) eventually reaches 1.',
    symbolic_representation: '\u2200 n \u2208 \u2115\u207a, \u2203 k \u2208 \u2115 : f^k(n) = 1',
    support_evidence: 'Verified computationally for all n < 2^68. Statistical heuristics strongly support convergence.',
    status: 'open',
  },
  {
    id: 3, title: "Goldbach's Conjecture", domain: 'Number Theory', confidence_score: 0.89,
    statement: 'Every even integer greater than 2 can be expressed as the sum of two primes.',
    symbolic_representation: '\u2200 n \u2208 2\u2115, n > 2 \u2192 \u2203 p, q prime : n = p + q',
    support_evidence: 'Verified for all even numbers up to 4 \u00d7 10^18.',
    status: 'open',
  },
  {
    id: 4, title: 'Riemann Hypothesis', domain: 'Complex Analysis', confidence_score: 0.81,
    statement: 'All non-trivial zeros of the Riemann zeta function have real part equal to 1/2.',
    symbolic_representation: '\u03b6(s) = 0 \u2227 0 < Re(s) < 1 \u2192 Re(s) = 1/2',
    support_evidence: 'First 10^13 zeros verified. Deep connections to prime distribution.',
    status: 'open',
  },
];

const MOCK_PAPERS: Paper[] = [
  {
    id: 'arxiv-2401.001',
    title: 'Neuro-Symbolic Approaches to Automated Theorem Proving',
    authors: 'Chen, L., Patel, R., Nguyen, T.', published_year: 2024,
    abstract: 'We present a hybrid framework combining large language models with formal proof assistants for automated mathematical reasoning. Our approach achieves 73% success rate on competition-level theorems.',
    pdf_url: 'https://arxiv.org/abs/2401.00001',
  },
  {
    id: 'arxiv-2312.002',
    title: 'LeanGPT: Formal Verification via Transformer-Based Proof Generation',
    authors: 'Wang, M., Kumar, S.', published_year: 2023,
    abstract: 'We fine-tune a GPT-4 class model on the Lean4 theorem proving corpus, achieving state-of-the-art results on MiniF2F benchmark with 58.1% accuracy.',
    pdf_url: 'https://arxiv.org/abs/2312.00002',
  },
  {
    id: 'arxiv-2405.003',
    title: 'Graph-Structured Mathematical Knowledge Bases for AI Reasoning',
    authors: 'Liu, X., Thompson, B., Sato, K.', published_year: 2024,
    abstract: 'We introduce MathKG, a knowledge graph of 2.3M mathematical theorems, lemmas, and definitions structured for AI consumption, enabling dependency-aware proof search.',
    pdf_url: 'https://arxiv.org/abs/2405.00003',
  },
];

// ─────────────────────────────────────────────────────────────────────────────

export function useMathStore() {
  const [projects,      setProjects]      = useState<Project[]>(MOCK_PROJECTS);
  const [activeProject, setActiveProject] = useState<Project | null>(MOCK_PROJECTS[0]);
  const [theorems,      setTheorems]      = useState<Theorem[]>(MOCK_THEOREMS);
  const [conjectures,   setConjectures]   = useState<Conjecture[]>(MOCK_CONJECTURES);
  const [papers,        setPapers]        = useState<Paper[]>(MOCK_PAPERS);
  const [loading,       setLoading]       = useState<boolean>(false);
  const [token,         setToken]         = useState<string | null>('demo-mode-token');

  // When active project changes, filter theorems to match
  useEffect(() => {
    if (activeProject) {
      const filtered = MOCK_THEOREMS.filter(t => t.project_id === activeProject.id);
      setTheorems(filtered.length > 0 ? filtered : MOCK_THEOREMS);
    }
  }, [activeProject]);

  // ── helpers ────────────────────────────────────────────────────────────────

  async function createProject(name: string, description: string): Promise<void> {
    try {
      const res = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, description }),
      });
      if (res.ok) {
        const newProj = (await res.json()) as Project;
        setProjects(prev => [...prev, newProj]);
        setActiveProject(newProj);
        return;
      }
    } catch {
      /* fall-through to demo mode */
    }
    // Demo fallback — simulate server response
    const newProj: Project = { id: Date.now(), name, description };
    setProjects(prev => [...prev, newProj]);
    setActiveProject(newProj);
  }

  async function createTheorem(thm: Omit<Theorem, 'status'>): Promise<void> {
    try {
      const res = await fetch(`${API_BASE_URL}/theorems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(thm),
      });
      if (res.ok) {
        const newThm = (await res.json()) as Theorem;
        setTheorems(prev => [...prev, newThm]);
        return;
      }
    } catch {
      /* fall-through to demo mode */
    }
    const newThm: Theorem = { ...thm, status: 'proof_pending', id: `thm-${Date.now()}` };
    setTheorems(prev => [...prev, newThm]);
  }

  async function searchPapers(query: string): Promise<void> {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/research/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (res.ok) {
        const data = (await res.json()) as Paper[];
        setPapers(data);
        setLoading(false);
        return;
      }
    } catch {
      /* fall-through to demo mode */
    }
    // Demo fallback — filter mock papers by query
    const q = query.toLowerCase();
    const results = MOCK_PAPERS.filter(
      p =>
        p.title.toLowerCase().includes(q) ||
        (p.abstract ?? '').toLowerCase().includes(q) ||
        (p.authors ?? '').toLowerCase().includes(q),
    );
    setPapers(results.length > 0 ? results : MOCK_PAPERS);
    setLoading(false);
  }

  async function loginUser(_email: string, _pass: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: _email, password: _pass }),
      });
      if (res.ok) {
        const data = (await res.json()) as { access_token: string };
        localStorage.setItem('mathgpt_token', data.access_token);
        setToken(data.access_token);
        return true;
      }
    } catch {
      /* fall-through to demo mode */
    }
    // Demo mode — accept any credentials
    setToken('demo-mode-token');
    return true;
  }

  function refreshTheorems(): void {
    if (activeProject) {
      const filtered = MOCK_THEOREMS.filter(t => t.project_id === activeProject.id);
      setTheorems(filtered.length > 0 ? filtered : MOCK_THEOREMS);
    }
  }

  function refreshConjectures(): void {
    setConjectures(MOCK_CONJECTURES);
  }

  return {
    projects,
    activeProject,
    setActiveProject,
    theorems,
    conjectures,
    papers,
    loading,
    token,
    createProject,
    createTheorem,
    searchPapers,
    loginUser,
    refreshTheorems,
    refreshConjectures,
  };
}
