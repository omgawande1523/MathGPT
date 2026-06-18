import React, { useState, useEffect } from 'react';
import ReactFlow, { MiniMap, Controls, Background, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { Search, Plus, Network, HelpCircle } from 'lucide-react';
import { Theorem } from '../store/useMathStore';

interface TheoremExplorerProps {
  theorems: Theorem[];
  activeProjectId: number;
  onCreateTheorem: (thm: any) => Promise<void>;
  onSelectTheorem: (thm: Theorem) => void;
}

export const TheoremExplorer: React.FC<TheoremExplorerProps> = ({
  theorems,
  activeProjectId,
  onCreateTheorem,
  onSelectTheorem
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedThm, setSelectedThm] = useState<Theorem | null>(null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  
  // Add Theorem Form Fields
  const [newId, setNewId] = useState<string>('');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newStatement, setNewStatement] = useState<string>('');
  const [newLean, setNewLean] = useState<string>('');
  const [newDomain, setNewDomain] = useState<string>('Algebra');

  // React Flow graph nodes
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Load graph relationships from backend
  useEffect(() => {
    if (selectedThm) {
      fetchGraph(selectedThm.id);
    }
  }, [selectedThm]);

  const fetchGraph = async (theoremId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/theorems/graph?theorem_id=${theoremId}`);
      if (res.ok) {
        const data = await res.json();
        
        // Map to React Flow nodes/edges
        const flowNodes = data.nodes.map((n: any, idx: number) => ({
          id: n.id,
          data: { label: `${n.label} (${n.domain})` },
          position: { x: 150 * (idx % 3), y: 100 * Math.floor(idx / 3) },
          style: {
            background: n.id === theoremId ? '#1e293b' : '#0f172a',
            color: '#fff',
            border: n.id === theoremId ? '1.5px solid #38bdf8' : '1px solid #30363d',
            borderRadius: '8px',
            fontSize: '11px',
            padding: '10px',
            width: 140
          }
        }));

        const flowEdges = data.edges.map((e: any, idx: number) => ({
          id: `e-${idx}`,
          source: e.source,
          target: e.target,
          label: e.type,
          type: 'smoothstep',
          style: { stroke: '#38bdf8' },
          animated: true
        }));

        setNodes(flowNodes);
        setEdges(flowEdges);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId || !newTitle || !newStatement) return;
    
    await onCreateTheorem({
      id: newId,
      title: newTitle,
      statement: newStatement,
      formal_statement_lean: newLean,
      domain: newDomain,
      project_id: activeProjectId
    });

    // Reset Form
    setNewId('');
    setNewTitle('');
    setNewStatement('');
    setNewLean('');
    setShowAddForm(false);
  };

  const filteredTheorems = theorems.filter(thm =>
    thm.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thm.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full gap-6 bg-math-dark p-2 text-slate-100 min-h-[500px]">
      {/* Search and Catalog Side panel */}
      <div className="w-1/3 bg-math-card rounded-xl border border-math-border p-5 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Network className="text-math-accent w-5 h-5" />
            Theorem Explorer
          </h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-math-accent transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {showAddForm ? (
          <form onSubmit={handleAddSubmit} className="flex flex-col gap-3 bg-slate-900/60 p-4 rounded-lg border border-math-border">
            <h3 className="text-xs font-semibold uppercase text-slate-400">Add New Theorem</h3>
            
            <input
              type="text"
              placeholder="Unique slug (e.g. thm_pythagoras)"
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              className="bg-math-dark text-sm px-3 py-1.5 rounded border border-math-border focus:outline-none focus:border-math-accent text-slate-200"
            />
            <input
              type="text"
              placeholder="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="bg-math-dark text-sm px-3 py-1.5 rounded border border-math-border focus:outline-none focus:border-math-accent text-slate-200"
            />
            <textarea
              placeholder="LaTeX Statement"
              value={newStatement}
              onChange={(e) => setNewStatement(e.target.value)}
              className="bg-math-dark text-sm px-3 py-1.5 rounded border border-math-border focus:outline-none focus:border-math-accent text-slate-200 h-16 font-mono"
            />
            <textarea
              placeholder="Lean4 formal statement (optional)"
              value={newLean}
              onChange={(e) => setNewLean(e.target.value)}
              className="bg-math-dark text-sm px-3 py-1.5 rounded border border-math-border focus:outline-none focus:border-math-accent text-slate-200 h-16 font-mono"
            />
            <select
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              className="bg-math-dark text-sm px-3 py-1.5 rounded border border-math-border text-slate-200 focus:outline-none"
            >
              <option value="Number Theory">Number Theory</option>
              <option value="Algebra">Algebra</option>
              <option value="Calculus">Calculus / Analysis</option>
              <option value="Topology">Topology</option>
            </select>
            
            <div className="flex gap-2 justify-end mt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-xs bg-sky-600 hover:bg-sky-500 rounded text-white font-medium"
              >
                Register
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="relative">
              <input
                type="text"
                placeholder="Search catalog by domain or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-math-dark text-sm pl-9 pr-4 py-2 rounded-lg border border-math-border focus:outline-none focus:border-math-accent text-slate-200"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2">
              {filteredTheorems.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm flex flex-col items-center gap-2">
                  <HelpCircle className="w-8 h-8 opacity-40" />
                  No theorems registered. Click '+' to add.
                </div>
              ) : (
                filteredTheorems.map(thm => (
                  <div
                    key={thm.id}
                    onClick={() => {
                      setSelectedThm(thm);
                      onSelectTheorem(thm);
                    }}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedThm?.id === thm.id
                        ? 'bg-slate-800/80 border-math-accent/50'
                        : 'bg-math-dark/40 border-math-border hover:bg-math-card hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs text-math-purple font-semibold bg-math-purple/10 px-2 py-0.5 rounded">
                        {thm.domain}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        thm.status === 'formal_verified' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                      }`}>
                        {thm.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-slate-100">{thm.title}</h3>
                    <code className="text-[10px] text-slate-400 block truncate mt-1">{thm.statement}</code>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Visual Dependency graph panel */}
      <div className="flex-1 bg-math-card rounded-xl border border-math-border p-5 flex flex-col relative overflow-hidden min-h-[400px]">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>Dependency Visualizer</span>
          {selectedThm && (
            <span className="text-xs normal-case text-slate-300 font-medium bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
              Active node: {selectedThm.title}
            </span>
          )}
        </h2>

        {selectedThm ? (
          <div className="flex-1 rounded-lg bg-math-dark border border-math-border overflow-hidden">
            <ReactFlow nodes={nodes} edges={edges} fitView>
              <Background color="#334155" gap={16} />
              <Controls />
              <MiniMap nodeStrokeColor="#1e293b" nodeColor="#0f172a" />
            </ReactFlow>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-slate-500 gap-2">
            <Network className="w-12 h-12 opacity-20" />
            <p className="text-sm">Select a theorem from the list to display its implication topology.</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default TheoremExplorer;
