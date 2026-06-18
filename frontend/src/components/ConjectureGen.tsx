import React, { useState } from 'react';
import { Lightbulb, Cpu, TrendingUp, Check } from 'lucide-react';
import { Conjecture } from '../store/useMathStore';

interface ConjectureGenProps {
  conjectures: Conjecture[];
  activeProjectId: number;
  onGenerate: (expression: string, domain: string) => Promise<void>;
}

export const ConjectureGen: React.FC<ConjectureGenProps> = ({
  conjectures,
  activeProjectId,
  onGenerate
}) => {
  const [expression, setExpression] = useState<string>('n**2 + n + 41');
  const [domain, setDomain] = useState<string>('Number Theory');
  const [mining, setMining] = useState<boolean>(false);

  const triggerMining = async () => {
    setMining(true);
    await onGenerate(expression, domain);
    setMining(false);
  };

  return (
    <div className="flex h-full gap-6 bg-math-dark p-2 text-slate-100 min-h-[500px]">
      {/* Control panel card */}
      <div className="w-1/3 bg-math-card rounded-xl border border-math-border p-6 flex flex-col gap-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Lightbulb className="text-math-accent w-5 h-5" />
          Conjecture Generator
        </h2>
        <p className="text-xs text-slate-400">
          Mine mathematical patterns, prime density functions, and equations to generate structured candidate conjectures.
        </p>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-400 uppercase">Generating Expression</label>
          <input
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            className="bg-math-dark text-sm px-3 py-2 rounded-lg border border-math-border focus:outline-none focus:border-math-accent text-slate-200 font-mono"
            placeholder="e.g. n**2 - n + 17"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-400 uppercase">Target Domain</label>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="bg-math-dark text-sm px-3 py-2 rounded-lg border border-math-border text-slate-200 focus:outline-none"
          >
            <option value="Number Theory">Number Theory</option>
            <option value="Combinatorics">Combinatorics</option>
            <option value="Abstract Algebra">Abstract Algebra</option>
          </select>
        </div>

        <button
          onClick={triggerMining}
          disabled={mining}
          className="mt-2 w-full py-2.5 rounded-lg text-white font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 glow-btn"
        >
          <Cpu className={`w-4 h-4 ${mining ? 'animate-spin' : ''}`} />
          {mining ? 'Mining Patterns...' : 'Mine Conjecture'}
        </button>
      </div>

      {/* Generated Conjectures panel card */}
      <div className="flex-1 bg-math-card rounded-xl border border-math-border p-6 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4.5 h-4.5 text-math-accent" />
          Candidate Conjectures
        </h2>

        <div className="flex-1 overflow-y-auto flex flex-col gap-4">
          {conjectures.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-slate-500 text-sm gap-2">
              <Lightbulb className="w-12 h-12 opacity-25" />
              <span>No conjectures generated yet. Configure sequence constraints to mine.</span>
            </div>
          ) : (
            conjectures.map(conj => (
              <div
                key={conj.id}
                className="bg-math-dark/80 border border-math-border p-5 rounded-lg hover:border-slate-700 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-math-purple bg-math-purple/10 px-2 py-0.5 rounded">
                    {conj.domain}
                  </span>
                  
                  {/* Confidence scoring ring */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Confidence:</span>
                    <span className="text-xs font-bold text-math-accent">
                      {Math.round(conj.confidence_score * 100)}%
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-slate-100">{conj.title}</h3>
                <p className="text-xs text-slate-300 mt-2 font-mono bg-slate-950 p-2.5 rounded border border-slate-900 leading-relaxed">
                  {conj.statement}
                </p>

                {conj.support_evidence && (
                  <div className="mt-3 bg-slate-900/40 p-3 rounded border border-slate-800 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300 uppercase tracking-wider block mb-1">Computational Support</span>
                    {conj.support_evidence}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
export default ConjectureGen;
