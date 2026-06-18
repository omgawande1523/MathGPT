import React, { useState, useRef, useEffect } from 'react';
import katex from 'katex';
import { Sigma, Binary, Play } from 'lucide-react';

export const SolverWorkspace: React.FC = () => {
  const [expression, setExpression] = useState<string>('x**2 + 3*x - sin(x)');
  const [operation, setOperation] = useState<string>('integrate');
  const [variables, setVariables] = useState<string>('x');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string>('');
  const [latexResult, setLatexResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const katexContainerRef = useRef<HTMLDivElement>(null);

  // Render LaTeX result whenever it changes
  useEffect(() => {
    if (katexContainerRef.current && latexResult) {
      try {
        katex.render(latexResult, katexContainerRef.current, {
          throwOnError: false,
          displayMode: true
        });
      } catch (err) {
        console.error(err);
      }
    }
  }, [latexResult]);

  const handleSolve = async () => {
    setLoading(true);
    setError('');
    setResult('');
    setLatexResult('');

    try {
      const res = await fetch('http://localhost:8000/api/v1/solver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expression,
          operation,
          variables: variables.split(',').map(v => v.trim())
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setResult(data.result);
          setLatexResult(data.latex_result);
        } else {
          setError(data.error || 'Computation failed.');
        }
      } else {
        setError('Server returned an error status.');
      }
    } catch (e: any) {
      setError(`Failed to connect: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full gap-6 bg-math-dark p-2 text-slate-100 min-h-[500px]">
      {/* Control panel card */}
      <div className="w-1/3 bg-math-card rounded-xl border border-math-border p-6 flex flex-col gap-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sigma className="text-math-accent w-5 h-5" />
          Symbolic Workspace
        </h2>
        <p className="text-xs text-slate-400">
          Execute exact calculus, linear algebra, and differential equations utilizing a backend SymPy kernel.
        </p>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-400 uppercase">Math Expression</label>
          <input
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder="e.g. x**2 + sin(x)"
            className="bg-math-dark text-sm px-3 py-2 rounded-lg border border-math-border focus:outline-none focus:border-math-accent text-slate-200 font-mono"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-400 uppercase">Operation</label>
          <select
            value={operation}
            onChange={(e) => setOperation(e.target.value)}
            className="bg-math-dark text-sm px-3 py-2 rounded-lg border border-math-border text-slate-200 focus:outline-none"
          >
            <option value="integrate">Definite/Indefinite Integration</option>
            <option value="differentiate">Partial Differentiation</option>
            <option value="simplify">Simplification</option>
            <option value="factor">Polynomial Factoring</option>
            <option value="solve">Equation Solving</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-400 uppercase">Variables</label>
          <input
            type="text"
            value={variables}
            onChange={(e) => setVariables(e.target.value)}
            placeholder="e.g. x, y"
            className="bg-math-dark text-sm px-3 py-2 rounded-lg border border-math-border focus:outline-none focus:border-math-accent text-slate-200 font-mono"
          />
        </div>

        <button
          onClick={handleSolve}
          disabled={loading}
          className="mt-2 w-full py-2.5 rounded-lg text-white font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 glow-btn"
        >
          <Play className="w-4 h-4" />
          {loading ? 'Evaluating...' : 'Solve Symbolic'}
        </button>
      </div>

      {/* Math rendering panel card */}
      <div className="flex-1 bg-math-card rounded-xl border border-math-border p-6 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Binary className="w-4.5 h-4.5 text-math-accent" />
          Computational Outputs
        </h2>

        <div className="flex-1 bg-math-dark border border-math-border rounded-lg p-6 flex flex-col justify-center items-center overflow-auto min-h-[300px]">
          {error && (
            <div className="text-rose-400 border border-rose-950 bg-rose-950/20 px-4 py-3 rounded-lg text-xs font-mono max-w-md text-center">
              Error evaluating expression: {error}
            </div>
          )}

          {!error && !result && (
            <div className="text-slate-500 text-sm flex flex-col items-center gap-1">
              <span>Ready for computations.</span>
              <span className="text-xs opacity-75">Click "Solve Symbolic" to verify equations.</span>
            </div>
          )}

          {!error && result && (
            <div className="w-full flex flex-col gap-6 items-center">
              {/* LaTeX rendering container */}
              <div className="p-4 bg-slate-900/40 rounded-lg w-full max-w-xl flex justify-center border border-slate-800">
                <div ref={katexContainerRef} className="text-2xl overflow-x-auto text-slate-100 py-4" />
              </div>

              {/* Raw console result */}
              <div className="w-full">
                <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Raw Output</span>
                <pre className="bg-slate-900 p-4 rounded border border-slate-800 text-xs text-math-accent font-mono w-full overflow-x-auto">
                  {result}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default SolverWorkspace;
