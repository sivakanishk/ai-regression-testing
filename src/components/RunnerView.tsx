import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertOctagon, 
  AlertTriangle, 
  Clock, 
  Cpu, 
  Sliders, 
  GitCompare, 
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { TestSuite, TestCase, RunStatus, TestRunResult, RegressionSeverity } from '../types/regression.js';

interface RunnerViewProps {
  suites: TestSuite[];
  selectedSuiteId?: string;
  onRunComplete: (runResult: TestRunResult) => void;
  onInspectTest: (test: TestCase) => void;
}

export const RunnerView: React.FC<RunnerViewProps> = ({
  suites,
  selectedSuiteId,
  onRunComplete,
  onInspectTest,
}) => {
  const [activeSuiteId, setActiveSuiteId] = useState<string>(
    selectedSuiteId || suites[0]?.id || ''
  );
  const [isRunning, setIsRunning] = useState(false);
  const [currentRunningIndex, setCurrentRunningIndex] = useState<number>(-1);
  const [candidateSystemPromptOverride, setCandidateSystemPromptOverride] = useState('');
  const [usePromptOverride, setUsePromptOverride] = useState(false);
  const [resultsMap, setResultsMap] = useState<Record<string, TestCase['lastRun']>>({});

  const activeSuite = suites.find((s) => s.id === activeSuiteId) || suites[0];

  const handleRunSuite = async () => {
    if (!activeSuite || isRunning) return;

    setIsRunning(true);
    const newResults: Record<string, TestCase['lastRun']> = {};
    const runDetails: TestRunResult['details'] = [];
    const startTime = Date.now();

    let passedCount = 0;
    let regressedCount = 0;
    let failedCount = 0;
    let totalScore = 0;
    let totalDrift = 0;

    for (let i = 0; i < activeSuite.tests.length; i++) {
      setCurrentRunningIndex(i);
      const test = activeSuite.tests[i];
      const testStartTime = Date.now();

      try {
        // Step 1: Execute candidate prompt via server Gemini proxy
        const sysPrompt = usePromptOverride && candidateSystemPromptOverride.trim()
          ? candidateSystemPromptOverride.trim()
          : test.systemPrompt;

        const candidateRes = await fetch('/api/gemini/run-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemPrompt: sysPrompt,
            inputPrompt: test.inputPrompt,
            model: activeSuite.targetModelOrUrl || 'gemini-3.8-flash',
          }),
        });

        const candidateData = await candidateRes.json();
        const candidateOutput = candidateData.output || candidateData.error || '';
        const latencyMs = candidateData.latencyMs || (Date.now() - testStartTime);

        // Step 2: Evaluate regression vs baseline
        const evalRes = await fetch('/api/gemini/evaluate-regression', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            baselineOutput: test.baselineOutput,
            candidateOutput,
            inputPrompt: test.inputPrompt,
            systemPrompt: sysPrompt,
            semanticThreshold: test.semanticThreshold,
            expectedKeywords: test.expectedKeywords,
            unexpectedKeywords: test.unexpectedKeywords,
          }),
        });

        const evalData = await evalRes.json();

        const status: RunStatus = evalData.status || (evalData.similarityScore >= test.semanticThreshold ? 'passed' : 'regressed');
        const severity: RegressionSeverity = evalData.severity || (status === 'passed' ? 'none' : 'moderate');
        const score = evalData.similarityScore ?? 80;
        const drift = evalData.driftPercentage ?? 20;

        totalScore += score;
        totalDrift += drift;

        if (status === 'passed') passedCount++;
        else regressedCount++;

        const lastRunData: TestCase['lastRun'] = {
          timestamp: new Date().toISOString(),
          candidateOutput,
          status,
          semanticScore: score,
          driftPercentage: drift,
          latencyMs,
          severity,
          reasons: evalData.differences || [evalData.explanation || 'Evaluated'],
          suggestedFix: evalData.suggestedPromptPatch,
        };

        newResults[test.id] = lastRunData;
        setResultsMap({ ...newResults });

        runDetails.push({
          testId: test.id,
          testName: test.name,
          status,
          severity,
          semanticScore: score,
          driftPercentage: drift,
          baselineOutput: test.baselineOutput,
          candidateOutput,
          latencyMs,
          notes: evalData.explanation || '',
          suggestedFix: evalData.suggestedPromptPatch,
        });
      } catch (err: any) {
        console.error('Error running test case:', test.name, err);
        failedCount++;
        const failedRunData: TestCase['lastRun'] = {
          timestamp: new Date().toISOString(),
          candidateOutput: `Execution error: ${err.message}`,
          status: 'failed',
          semanticScore: 0,
          driftPercentage: 100,
          latencyMs: Date.now() - testStartTime,
          severity: 'critical',
          reasons: [err.message || 'Execution failed'],
        };
        newResults[test.id] = failedRunData;
        setResultsMap({ ...newResults });
      }
    }

    const durationMs = Date.now() - startTime;
    const totalCount = activeSuite.tests.length;

    const runResult: TestRunResult = {
      id: `run-${Date.now()}`,
      suiteId: activeSuite.id,
      suiteName: activeSuite.name,
      runAt: new Date().toISOString(),
      totalTests: totalCount,
      passed: passedCount,
      failed: failedCount,
      regressed: regressedCount,
      durationMs,
      averageSemanticScore: totalCount > 0 ? Math.round(totalScore / totalCount) : 0,
      averageDrift: totalCount > 0 ? Math.round(totalDrift / totalCount) : 0,
      details: runDetails,
    };

    onRunComplete(runResult);
    setIsRunning(false);
    setCurrentRunningIndex(-1);
  };

  return (
    <div className="space-y-6">
      {/* Header & Suite Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Regression Runner Matrix</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Compare candidate outputs in real time against golden baselines and evaluate semantic drift.
          </p>
        </div>

        {/* Suite Selector Dropdown */}
        <div className="flex items-center space-x-3">
          <select
            value={activeSuiteId}
            onChange={(e) => setActiveSuiteId(e.target.value)}
            disabled={isRunning}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            {suites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.tests.length} tests)
              </option>
            ))}
          </select>

          <button
            onClick={handleRunSuite}
            disabled={isRunning || !activeSuite || activeSuite.tests.length === 0}
            className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-md ${
              isRunning
                ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 active:scale-95'
            }`}
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
                <span>Running ({currentRunningIndex + 1}/{activeSuite?.tests.length})...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run This Suite</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Candidate Prompt Configuration Card (for verifying prompt tweaks without regressions) */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Candidate Iteration & Prompt Comparison</h2>
          </div>
          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={usePromptOverride}
              onChange={(e) => setUsePromptOverride(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
            />
            <span>Test Candidate System Prompt Override</span>
          </label>
        </div>

        {usePromptOverride && (
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <p className="text-xs text-slate-400">
              Provide your updated candidate prompt below. The runner will execute all suite test cases using this candidate prompt, then verify whether any regressions or drift were introduced compared to baseline.
            </p>
            <textarea
              rows={3}
              placeholder="Paste updated system prompt candidate here to verify no regressions..."
              value={candidateSystemPromptOverride}
              onChange={(e) => setCandidateSystemPromptOverride(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Progress Bar when running */}
      {isRunning && (
        <div className="rounded-xl bg-indigo-950/40 border border-indigo-500/30 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-indigo-300">
            <span className="font-semibold">Executing Regression Tests...</span>
            <span className="font-mono">{currentRunningIndex + 1} of {activeSuite.tests.length}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-300"
              style={{
                width: `${Math.round(((currentRunningIndex + 1) / activeSuite.tests.length) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Test Matrix Results Table */}
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GitCompare className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">
              Suite Test Matrix: {activeSuite?.name}
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            {activeSuite?.tests.length} Test Cases Configured
          </span>
        </div>

        <div className="divide-y divide-slate-800/70">
          {activeSuite?.tests.map((test, idx) => {
            const run = resultsMap[test.id] || test.lastRun;
            const isCurrentlyEvaluating = isRunning && currentRunningIndex === idx;

            return (
              <div
                key={test.id}
                className={`p-4 sm:p-5 transition-all ${
                  isCurrentlyEvaluating ? 'bg-indigo-950/30' : 'hover:bg-slate-900/40'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left: Test Details & Status */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-100 text-sm">{test.name}</span>
                      {test.tags.map((t) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          #{t}
                        </span>
                      ))}

                      {/* Status Badge */}
                      {isCurrentlyEvaluating ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium animate-pulse">
                          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping mr-1" />
                          Evaluating with Gemini...
                        </span>
                      ) : run ? (
                        <span
                          className={`inline-flex items-center space-x-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                            run.status === 'passed'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {run.status === 'passed' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <AlertOctagon className="w-3.5 h-3.5" />
                          )}
                          <span>{run.status}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-500">
                          Unrun
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400">{test.description}</p>

                    {/* Side-by-Side Snippets */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {/* Baseline */}
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                            Golden Baseline
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">Target Threshold: {test.semanticThreshold}%</span>
                        </div>
                        <p className="text-xs text-slate-300 font-mono line-clamp-3 leading-relaxed">
                          {test.baselineOutput}
                        </p>
                      </div>

                      {/* Candidate Output */}
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                            Candidate Output (New Version)
                          </span>
                          {run && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {run.latencyMs}ms
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 font-mono line-clamp-3 leading-relaxed">
                          {run ? run.candidateOutput : <span className="text-slate-600 italic">Click "Run This Suite" to generate candidate output</span>}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Metrics & Diff Button */}
                  <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-3 flex-shrink-0 pt-2 lg:pt-0">
                    {run ? (
                      <div className="text-left lg:text-right space-y-1">
                        <div className="flex items-center lg:justify-end space-x-1.5">
                          <span className="text-xs text-slate-400">Match:</span>
                          <span
                            className={`font-mono font-bold text-sm ${
                              run.semanticScore >= test.semanticThreshold
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {run.semanticScore}%
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          Drift: <span className="text-slate-300">{run.driftPercentage}%</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600 font-mono">—</span>
                    )}

                    <button
                      onClick={() => onInspectTest({ ...test, lastRun: run })}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center space-x-1.5 transition-all shadow-sm"
                    >
                      <span>Inspect Diff</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
