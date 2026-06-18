import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, CheckCircle, AlertTriangle, Cpu } from 'lucide-react';
import { Theorem } from '../store/useMathStore';

interface LeanStudioProps {
  selectedTheorem: Theorem | null;
  onProofSuccess: () => void;
}

export const LeanStudio: React.FC<LeanStudioProps> = ({ selectedTheorem, onProofSuccess }) => {
  const [code, setCode] = useState<string>('-- Write your Lean4 proof script here\nimport Mathlib\n\n');
  const [status, setStatus] = useState<string>('unverified');
  const [log, setLog] = useState<string>('');
  const [verifying, setVerifying] = useState<boolean>(false);

  // Set starter code when theorem changes
  React.useEffect(() => {
    if (selectedTheorem) {
      setCode(
        `-- Lean4 Proof Studio\nimport Mathlib\n\ntheorem ${selectedTheorem.id} : ${
          selectedTheorem.formal_statement_lean || 'True'
        } := by\n  sorry\n`
      );
      setStatus('unverified');
      setLog('');
    }
  }, [selectedTheorem]);

  const runProofCompiler = async () => {
    if (!selectedTheorem) return;
    setVerifying(true);
    setStatus('verifying');
    setLog('Submitting proof to background compiler worker queue...');
    
    try {
      const res = await fetch('http://localhost:8000/api/v1/proofs/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theorem_id: selectedTheorem.id,
          proof_text: 'Informal proof parsed during formal compilation.',
          lean_code: code
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        // Poll for proof verification status
        pollStatus(data.id);
      } else {
        setStatus('error');
        setLog('Server error submitting proof compiler job.');
        setVerifying(false);
      }
    } catch (e: any) {
      setStatus('error');
      setLog(`Error connecting: ${e.message}`);
      setVerifying(false);
    }
  };

  const pollStatus = async (proofId: number) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`http://localhost:8000/api/v1/proofs/${proofId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.verification_status !== 'verifying') {
            setStatus(data.verification_status);
            setLog(data.verification_log || 'Proof completed.');
            setVerifying(false);
            clearInterval(interval);
            if (data.verification_status === 'verified_formal') {
              onProofSuccess();
            }
          }
        }
      } catch (e) {
        // Ignored
      }
      
      if (attempts > 30) {
        clearInterval(interval);
        setStatus('timeout');
        setLog('Timeout exceeded waiting for Lean compiler check.');
        setVerifying(false);
      }
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full bg-math-dark text-slate-100 rounded-xl overflow-hidden border border-math-border">
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-math-card px-6 py-4 border-b border-math-border">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Cpu className="text-math-accent w-5 h-5" />
            Lean4 Proof Studio
          </h2>
          <p className="text-xs text-slate-400">
            {selectedTheorem ? `Editing proof for: ${selectedTheorem.title}` : 'Select a theorem from Explorer to begin'}
          </p>
        </div>
        
        <button
          onClick={runProofCompiler}
          disabled={!selectedTheorem || verifying}
          className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all duration-300 ${
            !selectedTheorem
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : verifying
              ? 'bg-yellow-600 text-white animate-pulse'
              : 'glow-btn text-white'
          }`}
        >
          <Play className="w-4 h-4" />
          {verifying ? 'Compiling...' : 'Verify Proof'}
        </button>
      </div>

      <div className="flex flex-1 divide-x divide-math-border min-h-[400px]">
        {/* Editor Side */}
        <div className="w-2/3 h-full relative">
          <Editor
            height="100%"
            defaultLanguage="lean"
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              automaticLayout: true
            }}
          />
        </div>

        {/* Compiler Goals & Logs Side */}
        <div className="w-1/3 p-6 flex flex-col gap-6 bg-slate-900/60 overflow-y-auto">
          {/* Status Badge */}
          <div className="bg-math-card p-4 rounded-lg border border-math-border flex items-center justify-between">
            <span className="text-sm text-slate-400">Proof Verification Status</span>
            <div className="flex items-center gap-2">
              {status === 'verified_formal' && (
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Verified Formal
                </span>
              )}
              {status === 'failed' && (
                <span className="bg-rose-950 text-rose-400 border border-rose-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Gaps Detected
                </span>
              )}
              {status === 'verifying' && (
                <span className="bg-yellow-950 text-yellow-400 border border-yellow-800 px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
                  Running Compiler...
                </span>
              )}
              {status === 'unverified' && (
                <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-xs">
                  Unverified
                </span>
              )}
              {status === 'dry_run_unverified' && (
                <span className="bg-sky-950 text-sky-400 border border-sky-800 px-3 py-1 rounded-full text-xs font-semibold">
                  Dry Run Ok
                </span>
              )}
            </div>
          </div>

          {/* Goal Window */}
          <div className="flex-1 flex flex-col">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Compiler Output & Tactic State
            </h3>
            <div className="flex-1 bg-math-dark p-4 rounded-lg border border-math-border overflow-y-auto text-xs text-slate-300 font-mono whitespace-pre-wrap">
              {log || 'Lean compiler state is idle. Click "Verify Proof" to compile.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LeanStudio;
