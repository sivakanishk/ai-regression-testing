import React, { useState } from 'react';
import { 
  History, 
  Download, 
  CheckCircle2, 
  AlertOctagon, 
  Clock, 
  Calendar, 
  FileText, 
  FileCode, 
  ChevronRight,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { TestRunResult } from '../types/regression.js';

interface HistoryViewProps {
  runs: TestRunResult[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({ runs }) => {
  const [selectedRun, setSelectedRun] = useState<TestRunResult | null>(runs[0] || null);

  const exportJSON = (run: TestRunResult) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(run, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `regression-run-${run.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportMarkdown = (run: TestRunResult) => {
    let md = `# AI Regression Test Report\n\n`;
    md += `**Suite:** ${run.suiteName} (${run.suiteId})\n`;
    md += `**Timestamp:** ${new Date(run.runAt).toUTCString()}\n`;
    md += `**Summary:** ${run.passed}/${run.totalTests} Passed | ${run.regressed} Regressed | Avg Drift: ${run.averageDrift}%\n\n`;
    md += `| Test Case | Status | Semantic Match | Drift % | Latency |\n`;
    md += `|---|---|---|---|---|\n`;

    for (const d of run.details) {
      md += `| ${d.testName} | ${d.status.toUpperCase()} | ${d.semanticScore}% | ${d.driftPercentage}% | ${d.latencyMs}ms |\n`;
    }

    const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(md);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `regression-run-${run.id}.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Run History & CI/CD Reports</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Audit past regression executions, inspect drift metrics over time, and export JUnit or Markdown summaries.
        </p>
      </div>

      {runs.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <History className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No Regression Runs Recorded Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Run a regression test suite in the Test Runner to record your first execution audit trail.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Runs List */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recorded Executions</h2>
            {runs.map((r) => {
              const isSelected = selectedRun?.id === r.id;
              const isAllPassed = r.regressed === 0 && r.failed === 0;

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRun(r)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-indigo-500/80 shadow-md shadow-indigo-500/10'
                      : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-white">{r.suiteName}</span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        isAllPassed
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-rose-500/15 text-rose-400'
                      }`}
                    >
                      {isAllPassed ? 'Passed' : `${r.regressed} Regressed`}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>{new Date(r.runAt).toLocaleTimeString()}</span>
                    <span>
                      {r.passed}/{r.totalTests} passed ({r.durationMs}ms)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Selected Run Details & Export */}
          {selectedRun && (
            <div className="lg:col-span-2 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedRun.suiteName}</h3>
                  <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(selectedRun.runAt).toLocaleString()}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{selectedRun.durationMs} ms total runtime</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => exportJSON(selectedRun)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center space-x-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </button>
                  <button
                    onClick={() => exportMarkdown(selectedRun)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center space-x-1.5 transition-all shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Markdown</span>
                  </button>
                </div>
              </div>

              {/* KPI Badges */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Pass Rate</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    {Math.round((selectedRun.passed / selectedRun.totalTests) * 100)}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Avg Semantic Match</span>
                  <span className="text-xl font-bold font-mono text-indigo-400">
                    {selectedRun.averageSemanticScore}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Avg Drift</span>
                  <span className="text-xl font-bold font-mono text-cyan-400">
                    {selectedRun.averageDrift}%
                  </span>
                </div>
              </div>

              {/* Run Test Results Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Detailed Test Assertions
                </h4>

                <div className="space-y-2">
                  {selectedRun.details.map((d) => (
                    <div
                      key={d.testId}
                      className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-white">{d.testName}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              d.status === 'passed'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-rose-500/15 text-rose-400'
                            }`}
                          >
                            {d.status}
                          </span>
                        </div>
                        {d.notes && <p className="text-xs text-slate-400 line-clamp-1">{d.notes}</p>}
                      </div>

                      <div className="text-right flex-shrink-0 font-mono text-xs">
                        <span className="text-slate-300 font-bold">{d.semanticScore}% match</span>
                        <span className="text-slate-500 block text-[11px]">{d.latencyMs}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
