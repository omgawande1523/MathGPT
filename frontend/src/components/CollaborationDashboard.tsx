import React, { useState } from 'react';
import { Users, FileText, Send, CheckCircle2 } from 'lucide-react';
import { Project } from '../store/useMathStore';

interface CollaborationDashboardProps {
  activeProject: Project | null;
}

export const CollaborationDashboard: React.FC<CollaborationDashboardProps> = ({ activeProject }) => {
  const [comment, setComment] = useState<string>('');
  const [comments, setComments] = useState<any[]>([
    { id: 1, author: 'Edward Witten', role: 'Reviewer', text: 'This Lean code looks complete. I verified the algebraic identity in SymPy as well.', time: '2 hours ago' },
    { id: 2, author: 'Terence Tao', role: 'Researcher', text: 'I updated the main statement for the prime bounds to reflect the logarithmic scaling constraints.', time: '1 day ago' }
  ]);

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment) return;
    setComments(prev => [...prev, {
      id: prev.length + 1,
      author: 'You',
      role: 'Researcher',
      text: comment,
      time: 'Just now'
    }]);
    setComment('');
  };

  return (
    <div className="flex h-full gap-6 bg-math-dark p-2 text-slate-100 min-h-[500px]">
      {/* Team settings card */}
      <div className="w-1/3 bg-math-card rounded-xl border border-math-border p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="text-math-accent w-5 h-5" />
            Project Members
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Current researchers and peer reviewers assigned to this workspace.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between p-3 bg-math-dark/60 rounded-lg border border-math-border">
            <div>
              <span className="text-sm font-semibold block text-slate-200">Edward Witten</span>
              <span className="text-[10px] uppercase text-math-purple font-bold">Reviewer</span>
            </div>
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-math-dark/60 rounded-lg border border-math-border">
            <div>
              <span className="text-sm font-semibold block text-slate-200">Terence Tao</span>
              <span className="text-[10px] uppercase text-math-purple font-bold">Researcher</span>
            </div>
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-math-dark/60 rounded-lg border border-math-border">
            <div>
              <span className="text-sm font-semibold block text-slate-200">Richard Borcherds</span>
              <span className="text-[10px] uppercase text-slate-500 font-bold">Observer</span>
            </div>
            <span className="text-xs text-slate-500">Offline</span>
          </div>
        </div>

        <div className="pt-4 border-t border-math-border">
          <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 text-xs font-semibold transition-colors">
            Invite Researcher
          </button>
        </div>
      </div>

      {/* Discussion Board and comments */}
      <div className="flex-1 bg-math-card rounded-xl border border-math-border p-6 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4.5 h-4.5 text-math-accent" />
          Review & Comment Feed
        </h2>

        {/* Comment Thread */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 bg-math-dark/40 border border-math-border rounded-lg p-4 max-h-[300px]">
          {comments.map(c => (
            <div key={c.id} className="bg-math-dark border border-math-border p-3.5 rounded-lg">
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-slate-200">{c.author}</span>
                  <span className="text-[9px] uppercase text-math-purple font-bold tracking-wider">{c.role}</span>
                </div>
                <span className="text-[10px] text-slate-500">{c.time}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{c.text}</p>
            </div>
          ))}
        </div>

        {/* Comment submit bar */}
        <form onSubmit={handleSendComment} className="flex gap-2">
          <input
            type="text"
            placeholder="Type comment or peer-review review feedback..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="flex-1 bg-math-dark text-xs px-4 py-2.5 rounded-lg border border-math-border focus:outline-none focus:border-math-accent text-slate-200"
          />
          <button
            type="submit"
            className="px-4 bg-sky-600 hover:bg-sky-500 rounded-lg text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" /> Send
          </button>
        </form>
      </div>
    </div>
  );
};
export default CollaborationDashboard;
