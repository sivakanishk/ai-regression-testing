import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertOctagon, 
  AlertTriangle, 
  Sparkles, 
  Copy, 
  Check, 
  Clock, 
  Gauge, 
  TrendingUp, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { TestCase } from '../types/regression.js';

interface DiffInspectorModalProps {
  test: TestCase | null;
  onClose: () => void;
  onApplyPromptPatch?: (patchedPrompt: string) => void;
}

export const DiffInspectorModal: React.FC<DiffInspectorModalProps> = ({
  test,
  onClose,
  onApplyPromptPatch,
}) => {
  const [copied, setCopied] = useState(false);
  const [isHealing, setIsHealing] = useState(false);
  const [healResult, setHealResult] = useState<{
    improvedSystemPrompt?: string;
    explanation?: string;
    recommendedGuardrails?: string[];
  } | null>(null);

  if (!test) return null;

  const run = test.lastRun;
  const baseline = test.baselineOutput || '';
  const candidate = run?.candidateOutput || 'No candidate run recorded yet.';
  const isPassed = run?.status === 'passed';

  const handleCopyPatch = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAutoHeal = async () => {
    setIsHealing(true);
    try {
      const res = await fetch('/api/gemini/auto-heal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testName: test.name,
          systemPrompt: test.systemPrompt,
          inputPrompt: test.inputPrompt,
          baselineOutput: baseline,
          candidateOutput: candidate,
          differences: run?.reasons || [],
        }),
      });
      const data = await res.json();
      setHealResult(data);
    } catch (err) {
      console.error('Auto-heal request failed:', err);
    } finally {
      setIsHealing(false);
    }
  };

  // Simple token count approximation
  const baselineTokens = baseline.split(/\s+/).filter(Boolean).length;
  const candidateTokens = candidate.split(/\s+/).filter(Boolean).length;
  const tokenDelta = candidateTokens - baselineTokens;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-7 space-y-6 my-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white tracking-tight">{test.name}</h2>
              {run && (
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    isPassed
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {run.status}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">{test.description}</p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metric Cards Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Semantic Match</span>
            <span className={`text-xl font-mono font-bold ${isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
              {run?.semanticScore ?? '—'}%
            </span>
            <span className="text-[10px] text-slate-500 block">Threshold: {test.semanticThreshold}%</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Semantic Drift</span>
            <span className="text-xl font-mono font-bold text-cyan-400">
              {run?.driftPercentage ?? '—'}%
            </span>
            <span className="text-[10px] text-slate-500 block">Variance from baseline</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Latency</span>
            <span className="text-xl font-mono font-bold text-amber-400">
              {run?.latencyMs ?? '—'} ms
            </span>
            <span className="text-[10px] text-slate-500 block">Model inference time</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Token Delta</span>
            <span className="text-xl font-mono font-bold text-purple-400">
              {tokenDelta > 0 ? `+${tokenDelta}` : tokenDelta} tokens
            </span>
            <span className="text-[10px] text-slate-500 block">{baselineTokens} vs {candidateTokens} words</span>
          </div>
        </div>

        {/* Input Prompt Context */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
            Input Trigger / User Prompt
          </span>
          <p className="text-xs text-slate-200 font-mono leading-relaxed">{test.inputPrompt}</p>
        </div>

        {/* Side-by-Side Diff Inspector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Baseline Output */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden flex flex-col">
            <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Golden Baseline (Expected)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{baselineTokens} words</span>
            </div>
            <div className="p-4 flex-1 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed select-text">
              {baseline}
            </div>
          </div>

          {/* Candidate Output */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden flex flex-col">
            <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Gauge className="w-3.5 h-3.5" />
                <span>Candidate Version (Actual)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{candidateTokens} words</span>
            </div>
            <div className="p-4 flex-1 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed select-text">
              {candidate}
            </div>
          </div>
        </div>

        {/* Root Cause & Detected Differences */}
        {run?.reasons && run.reasons.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-300 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Semantic Drift & Regression Analysis</span>
            </span>
            <ul className="space-y-1.5">
              {run.reasons.map((r, i) => (
                <li key={i} className="text-xs text-slate-400 flex items-start space-x-2">
                  <span className="text-rose-400 mt-0.5">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Auto-Heal & Patch Assistant */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-950 border border-indigo-500/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">AI Auto-Healing & Prompt Patch</h3>
              </div>
              <p className="text-xs text-slate-400">
                Let Gemini diagnose the root cause and propose an updated system prompt to eliminate this regression.
              </p>
            </div>

            <button
              onClick={handleAutoHeal}
              disabled={isHealing}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-2 transition-all shadow-md shadow-indigo-600/30 active:scale-95 disabled:opacity-50"
            >
              {isHealing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Diagnosing & Patching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Auto-Heal Patch</span>
                </>
              )}
            </button>
          </div>

          {healResult && (
            <div className="space-y-3 pt-3 border-t border-indigo-500/20">
              {healResult.explanation && (
                <div className="text-xs text-indigo-200 bg-indigo-950/50 p-3 rounded-lg border border-indigo-500/30">
                  <strong>Diagnosis:</strong> {healResult.explanation}
                </div>
              )}

              {healResult.improvedSystemPrompt && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Proposed System Prompt Patch:</span>
                    <button
                      onClick={() => handleCopyPatch(healResult.improvedSystemPrompt!)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy Patch'}</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 whitespace-pre-wrap">
                    {healResult.improvedSystemPrompt}
                  </pre>
                </div>
              )}

              {healResult.recommendedGuardrails && healResult.recommendedGuardrails.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-300">Recommended Guardrails:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {healResult.recommendedGuardrails.map((g, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        + {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
