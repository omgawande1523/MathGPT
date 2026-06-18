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

// Global configuration value
const API_BASE_URL = 'http://localhost:8000/api/v1';

export function useMathStore() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [theorems, setTheorems] = useState<Theorem[]>([]);
  const [conjectures, setConjectures] = useState<Conjecture[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(localStorage.getItem('mathgpt_token'));

  // Load projects on startup
  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, [token]);

  // Load project details when activeProject changes
  useEffect(() => {
    if (activeProject) {
      fetchTheorems(activeProject.id);
      fetchConjectures(activeProject.id);
    }
  }, [activeProject]);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0 && !activeProject) {
          setActiveProject(data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTheorems = async (projId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/theorems?project_id=${projId}`);
      if (res.ok) {
        setTheorems(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchConjectures = async (projId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/conjectures?project_id=${projId}`);
      if (res.ok) {
        setConjectures(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const createProject = async (name: string, description: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description })
      });
      if (res.ok) {
        const newProj = await res.json();
        setProjects(prev => [...prev, newProj]);
        setActiveProject(newProj);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const createTheorem = async (thm: Omit<Theorem, 'status'>) => {
    try {
      const res = await fetch(`${API_BASE_URL}/theorems`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(thm)
      });
      if (res.ok) {
        const newThm = await res.json();
        setTheorems(prev => [...prev, newThm]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const searchPapers = async (query: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/research/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (res.ok) {
        setPapers(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('mathgpt_token', data.access_token);
        setToken(data.access_token);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

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
    refreshTheorems: () => activeProject && fetchTheorems(activeProject.id),
    refreshConjectures: () => activeProject && fetchConjectures(activeProject.id)
  };
}
