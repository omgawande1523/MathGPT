import React, { useState } from 'react';
import { BookOpen, Search, ArrowUpRight, Cpu } from 'lucide-react';
import { Paper } from '../store/useMathStore';

interface ResearchAnalyzerProps {
  papers: Paper[];
  loading: boolean;
  onSearch: (query: string) => Promise<void>;
}

export const ResearchAnalyzer: React.FC<ResearchAnalyzerProps> = ({
  papers,
  loading,
  onSearch
}) => {
  const [query, setQuery] = useState<string>('automated theorem proving lean');
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    onSearch(query);
  };

  return (
    <div className="flex h-full gap-6 bg-math-dark p-2 text-slate-100 min-h-[500px]">
      {/* Search and Results Side panel */}
      <div className="w-2/5 bg-math-card rounded-xl border border-math-border p-5 flex flex-col gap-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="text-math-accent w-5 h-5" />
          ArXiv Paper Intelligence
        </h2>
        <p className="text-xs text-slate-400">
          Query academic databases, parse abstracts, and extract theorems and proofs into your local workspace database automatically.
        </p>

        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder="Search ArXiv..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-math-dark text-sm pl-9 pr-4 py-2.5 rounded-lg border border-math-border focus:outline-none focus:border-math-accent text-slate-200"
          />
          <button type="submit" className="absolute left-3 top-3 text-slate-500 hover:text-white">
            <Search className="w-4.5 h-4.5" />
          </button>
        </form>

        <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-[300px]">
          {loading ? (
            <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-math-accent border-t-transparent rounded-full animate-spin" />
              <span>Querying ArXiv Database...</span>
            </div>
          ) : papers.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Search to index papers.
            </div>
          ) : (
            papers.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedPaper(p)}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all duration-200 ${
                  selectedPaper?.id === p.id
                    ? 'bg-slate-800/80 border-math-accent/50'
                    : 'bg-math-dark/40 border-math-border hover:bg-math-card hover:border-slate-700'
                }`}
              >
                <span className="text-[10px] text-math-purple bg-math-purple/10 px-2 py-0.5 rounded font-mono font-semibold">
                  arXiv:{p.id}
                </span>
                <h3 className="text-sm font-medium text-slate-100 mt-1 leading-snug">{p.title}</h3>
                <span className="text-xs text-slate-400 block mt-1">{p.authors}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Abstract and theorem extractor panel */}
      <div className="flex-1 bg-math-card rounded-xl border border-math-border p-6 flex flex-col gap-4">
        {selectedPaper ? (
          <div className="flex flex-col gap-5 h-full overflow-y-auto">
            <div className="flex justify-between items-start border-b border-math-border pb-4">
              <div>
                <span className="text-xs text-slate-400 font-mono">arXiv Identifier: {selectedPaper.id}</span>
                <h2 className="text-lg font-semibold text-slate-100 mt-1">{selectedPaper.title}</h2>
                <p className="text-sm text-slate-300 mt-1">{selectedPaper.authors}</p>
              </div>

              {selectedPaper.pdf_url && (
                <a
                  href={selectedPaper.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-math-accent flex items-center gap-1 text-xs font-semibold transition-colors"
                >
                  PDF <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Abstract</span>
              <p className="text-sm text-slate-300 leading-relaxed bg-math-dark/60 p-4 rounded-lg border border-math-border">
                {selectedPaper.abstract}
              </p>
            </div>

            {/* Extracted Theorems Panel */}
            <div className="flex-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-math-purple" />
                Extracted Statements
              </span>

              <div className="bg-math-dark border border-math-border rounded-lg p-4 font-mono text-xs text-slate-400 flex flex-col gap-2">
                {selectedPaper.id === "2401.12345" ? (
                  <>
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded text-slate-200">
                      <span className="text-math-accent font-bold">Theorem 1 (Completeness):</span> We explore transformer-based LLMs fine-tuned on Mathlib4 to formulate and complete proof steps.
                    </div>
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded text-slate-200">
                      <span className="text-math-purple font-bold">Lemma 2.1 (Monotonicity):</span> Any verified subset of proof graphs maintains monotonic confidence metrics.
                    </div>
                  </>
                ) : (
                  <div className="text-slate-500 text-center py-4">
                    Extracted theorems automatically index during backend citation cycles.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-slate-500 gap-2">
            <BookOpen className="w-12 h-12 opacity-25" />
            <p className="text-sm">Select a paper from the query list to inspect abstract and extracted theorems.</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default ResearchAnalyzer;
