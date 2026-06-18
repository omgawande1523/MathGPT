import React, { useState } from 'react';
import {
  useMathStore,
  Theorem
} from './store/useMathStore';
import { TheoremExplorer } from './components/TheoremExplorer';
import { SolverWorkspace } from './components/SolverWorkspace';
import { ConjectureGen } from './components/ConjectureGen';
import { ResearchAnalyzer } from './components/ResearchAnalyzer';
import { LeanStudio } from './components/LeanStudio';
import { CollaborationDashboard } from './components/CollaborationDashboard';
import {
  Compass,
  Sigma,
  Lightbulb,
  BookOpen,
  Cpu,
  Users,
  MessageSquare,
  BarChart2,
  TrendingUp,
  Settings,
  Shield,
  Activity,
  CheckCircle,
  Plus
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const App: React.FC = () => {
  const store = useMathStore();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedThm, setSelectedThm] = useState<Theorem | null>(null);

  // Auth local state inputs
  const [email, setEmail] = useState<string>('scientist@mathgpt.io');
  const [password, setPassword] = useState<string>('quantum_field_theory_9988');
  const [loggedIn, setLoggedIn] = useState<boolean>(!!store.token);

  // Neuro-symbolic pipeline chat local inputs
  const [chatPrompt, setChatPrompt] = useState<string>('Verify if algebraic identity (x - 2) * (x + 2) equals x^2 - 4.');
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [chatResponse, setChatResponse] = useState<any | null>(null);

  // Project creator input modal
  const [showProjModal, setShowProjModal] = useState<boolean>(false);
  const [projName, setProjName] = useState<string>('');
  const [projDesc, setProjDesc] = useState<string>('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await store.loginUser(email, password);
    if (ok) setLoggedIn(true);
  };

  const handleCreateProj = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName) return;
    await store.createProject(projName, projDesc);
    setProjName('');
    setProjDesc('');
    setShowProjModal(false);
  };

  const executeChatQuery = async () => {
    if (!chatPrompt || !store.activeProject) return;
    setChatLoading(true);
    setChatResponse(null);
    try {
      const res = await fetch('http://localhost:8000/api/v1/reasoning/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: store.activeProject.id,
          prompt: chatPrompt
        })
      });
      if (res.ok) {
        setChatResponse(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChatLoading(false);
    }
  };

  // Sample analytics data for the research monitoring dashboard charts
  const analyticsData = [
    { name: 'Jan', proofs: 10, latency: 1200, cost: 0.15 },
    { name: 'Feb', proofs: 25, latency: 950, cost: 0.32 },
    { name: 'Mar', proofs: 42, latency: 800, cost: 0.54 },
    { name: 'Apr', proofs: 55, latency: 750, cost: 0.68 },
    { name: 'May', proofs: 78, latency: 680, cost: 0.92 }
  ];

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-math-dark flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
        {/* Glow circles backdrop */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-900/10 rounded-full blur-3xl" />

        <div className="w-full max-w-md bg-math-card border border-math-border rounded-2xl p-8 z-10 shadow-2xl relative">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight gradient-text mb-2">MathGPT Enterprise</h1>
            <p className="text-sm text-slate-400">Neuro-Symbolic Mathematical Research Workspace</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Research Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-math-dark px-4 py-3 rounded-lg border border-math-border text-sm text-slate-200 focus:outline-none focus:border-math-accent"
                required
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Access Token / Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-math-dark px-4 py-3 rounded-lg border border-math-border text-sm text-slate-200 focus:outline-none focus:border-math-accent"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 mt-2 rounded-lg font-semibold text-sm text-white glow-btn flex justify-center items-center gap-1.5"
            >
              <Shield className="w-4 h-4" /> Initialize Session
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-math-dark text-slate-100 flex flex-col font-sans">
      {/* Top Header bar */}
      <header className="h-16 bg-math-card border-b border-math-border flex items-center justify-between px-8 z-20">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-sky-400 to-purple-500 bg-clip-text text-transparent">
            MathGPT Enterprise
          </span>
          <span className="bg-slate-800 text-[10px] text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-slate-700">
            Neuro-Symbolic v1
          </span>
        </div>

        {/* Project Picker dropdown */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active Workspace</span>
            <div className="flex gap-2">
              <select
                value={store.activeProject?.id || ''}
                onChange={(e) => {
                  const p = store.projects.find(x => x.id === Number(e.target.value));
                  if (p) store.setActiveProject(p);
                }}
                className="bg-math-dark text-xs px-3 py-1.5 rounded-lg border border-math-border text-slate-200 focus:outline-none"
              >
                {store.projects.map(proj => (
                  <option key={proj.id} value={proj.id}>{proj.name}</option>
                ))}
              </select>
              <button
                onClick={() => setShowProjModal(true)}
                className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 text-math-accent"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content body grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav menu */}
        <nav className="w-64 bg-math-card border-r border-math-border p-4 flex flex-col gap-2">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-3 mb-2 block">
            Mathematical Workspace
          </span>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-sky-600/10 text-math-accent border-l-2 border-math-accent'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <BarChart2 className="w-4.5 h-4.5" /> Operations Dashboard
          </button>

          <button
            onClick={() => setActiveTab('explorer')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'explorer'
                ? 'bg-sky-600/10 text-math-accent border-l-2 border-math-accent'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Compass className="w-4.5 h-4.5" /> Theorem Explorer
          </button>

          <button
            onClick={() => setActiveTab('solver')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'solver'
                ? 'bg-sky-600/10 text-math-accent border-l-2 border-math-accent'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Sigma className="w-4.5 h-4.5" /> Symbolic Solver
          </button>

          <button
            onClick={() => setActiveTab('conjecture')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'conjecture'
                ? 'bg-sky-600/10 text-math-accent border-l-2 border-math-accent'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Lightbulb className="w-4.5 h-4.5" /> Conjecture Miner
          </button>

          <button
            onClick={() => setActiveTab('research')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'research'
                ? 'bg-sky-600/10 text-math-accent border-l-2 border-math-accent'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <BookOpen className="w-4.5 h-4.5" /> Research Intelligence
          </button>

          <button
            onClick={() => setActiveTab('lean')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'lean'
                ? 'bg-sky-600/10 text-math-accent border-l-2 border-math-accent'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Cpu className="w-4.5 h-4.5" /> Lean4 Proof Studio
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-sky-600/10 text-math-accent border-l-2 border-math-accent'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <MessageSquare className="w-4.5 h-4.5" /> Neuro-Symbolic Agent Chat
          </button>

          <button
            onClick={() => setActiveTab('collaboration')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'collaboration'
                ? 'bg-sky-600/10 text-math-accent border-l-2 border-math-accent'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Users className="w-4.5 h-4.5" /> Peer Collaboration
          </button>
        </nav>

        {/* Tab pages containers */}
        <main className="flex-1 p-8 overflow-y-auto bg-slate-950/40">
          
          {/* Active project modal creator */}
          {showProjModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
              <div className="bg-math-card border border-math-border p-6 rounded-xl w-full max-w-sm flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-slate-200">Create Research Workspace</h3>
                <form onSubmit={handleCreateProj} className="flex flex-col gap-4">
                  <input
                    type="text"
                    placeholder="Workspace Name"
                    value={projName}
                    onChange={(e) => setProjName(e.target.value)}
                    className="bg-math-dark text-xs px-3 py-2 rounded border border-math-border text-slate-200 focus:outline-none"
                    required
                  />
                  <textarea
                    placeholder="Brief description"
                    value={projDesc}
                    onChange={(e) => setProjDesc(e.target.value)}
                    className="bg-math-dark text-xs px-3 py-2 rounded border border-math-border text-slate-200 focus:outline-none h-16"
                  />
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setShowProjModal(false)} className="text-xs text-slate-400">Cancel</button>
                    <button type="submit" className="bg-sky-600 px-3 py-1.5 rounded text-white text-xs font-semibold">Create</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-6">
              {/* Metrics cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="math-card-glow p-6 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold">Total Proven Theorems</span>
                    <h2 className="text-3xl font-bold mt-1 text-slate-100">
                      {store.theorems.filter(t => t.status === 'formal_verified').length}
                    </h2>
                  </div>
                  <CheckCircle className="w-10 h-10 text-emerald-500 opacity-80 animate-pulse" />
                </div>

                <div className="math-card-glow p-6 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold">Active Conjectures</span>
                    <h2 className="text-3xl font-bold mt-1 text-slate-100">{store.conjectures.length}</h2>
                  </div>
                  <Lightbulb className="w-10 h-10 text-math-purple opacity-80" />
                </div>

                <div className="math-card-glow p-6 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold">Indexed Literatures</span>
                    <h2 className="text-3xl font-bold mt-1 text-slate-100">{store.papers.length}</h2>
                  </div>
                  <BookOpen className="w-10 h-10 text-math-accent opacity-80" />
                </div>
              </div>

              {/* Area graph metrics */}
              <div className="bg-math-card border border-math-border p-6 rounded-xl flex flex-col gap-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-math-accent" /> Prove Performance Statistics
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                      <YAxis stroke="#9ca3af" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} />
                      <Area type="monotone" dataKey="proofs" stroke="#38bdf8" fillOpacity={0.15} fill="url(#colorProofs)" />
                      <defs>
                        <linearGradient id="colorProofs" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'explorer' && (
            <TheoremExplorer
              theorems={store.theorems}
              activeProjectId={store.activeProject?.id || 1}
              onCreateTheorem={store.createTheorem}
              onSelectTheorem={(thm) => {
                setSelectedThm(thm);
                setActiveTab('lean');
              }}
            />
          )}

          {activeTab === 'solver' && <SolverWorkspace />}

          {activeTab === 'conjecture' && (
            <ConjectureGen
              conjectures={store.conjectures}
              activeProjectId={store.activeProject?.id || 1}
              onGenerate={async (exp, dom) => {
                await fetch('http://localhost:8000/api/v1/conjectures/generate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    project_id: store.activeProject?.id || 1,
                    expression: exp,
                    domain: dom
                  })
                });
                store.refreshConjectures();
              }}
            />
          )}

          {activeTab === 'research' && (
            <ResearchAnalyzer
              papers={store.papers}
              loading={store.loading}
              onSearch={store.searchPapers}
            />
          )}

          {activeTab === 'lean' && (
            <LeanStudio
              selectedTheorem={selectedThm}
              onProofSuccess={() => {
                store.refreshTheorems();
              }}
            />
          )}

          {activeTab === 'chat' && (
            <div className="flex h-full gap-6 bg-math-dark p-2 text-slate-100 min-h-[500px]">
              {/* Chat Input panel */}
              <div className="w-1/3 bg-math-card rounded-xl border border-math-border p-6 flex flex-col gap-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="text-math-accent w-5 h-5" />
                  Agent Graph Chat
                </h2>
                <p className="text-xs text-slate-400">
                  Submit proof claims. The LangGraph agent orchestrator will plan reasoning steps, run SymPy checkers, compile Lean codes, and trace dependencies.
                </p>

                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Input Claim / Proof Target</label>
                  <textarea
                    value={chatPrompt}
                    onChange={(e) => setChatPrompt(e.target.value)}
                    className="flex-1 bg-math-dark text-xs px-3 py-2 rounded-lg border border-math-border focus:outline-none focus:border-math-accent text-slate-200 h-24 font-mono leading-relaxed"
                  />
                </div>

                <button
                  onClick={executeChatQuery}
                  disabled={chatLoading}
                  className="w-full py-2.5 rounded-lg text-white font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 glow-btn"
                >
                  <Cpu className={`w-4 h-4 ${chatLoading ? 'animate-spin' : ''}`} />
                  {chatLoading ? 'Executing Graph Workflow...' : 'Execute Pipeline'}
                </button>
              </div>

              {/* Chat Trace result panel */}
              <div className="flex-1 bg-math-card rounded-xl border border-math-border p-6 flex flex-col gap-4 overflow-y-auto">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  Explainable AI Reasonings
                </h2>

                {chatLoading && (
                  <div className="flex-1 flex flex-col justify-center items-center gap-3 text-slate-400 py-12">
                    <div className="w-6 h-6 border-2 border-math-accent border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Orchestrating multi-agent graph nodes...</span>
                  </div>
                )}

                {!chatLoading && !chatResponse && (
                  <div className="flex-1 flex justify-center items-center text-slate-500 text-sm">
                    Submit a query to inspect the step-by-step reasoning trace.
                  </div>
                )}

                {!chatLoading && chatResponse && (
                  <div className="flex flex-col gap-6">
                    {/* Final Answer */}
                    <div className="p-5 bg-math-dark border border-math-border rounded-lg">
                      <span className="text-xs text-math-purple uppercase font-bold tracking-wider block mb-1">Final Result</span>
                      <p className="text-sm text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">{chatResponse.answer}</p>
                    </div>

                    {/* Step log trace */}
                    <div>
                      <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider block mb-2">
                        Reasoning Execution Log
                      </span>
                      <div className="flex flex-col gap-2 font-mono text-[11px] text-slate-400">
                        {chatResponse.reasoning_trace.map((step: string, idx: number) => (
                          <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded flex gap-3">
                            <span className="text-math-accent font-bold">[{idx + 1}]</span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'collaboration' && (
            <CollaborationDashboard activeProject={store.activeProject} />
          )}

        </main>
      </div>
    </div>
  );
};
export default App;
