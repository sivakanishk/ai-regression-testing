import React from 'react';
import { 
  CheckCircle2, 
  AlertOctagon, 
  AlertTriangle, 
  Clock, 
  Gauge, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  Play, 
  ArrowRight,
  GitCompare,
  FileCheck2,
  Zap
} from 'lucide-react';
import { TestSuite, TestRunResult } from '../types/regression.js';

interface DashboardViewProps {
  suites: TestSuite[];
  runs: TestRunResult[];
  onRunSuite: (suite: TestSuite) => void;
  onNavigateToRunner: (suiteId?: string) => void;
  onNavigateToSuites: () => void;
  onNavigateToGenerator: () => void;
  onInspectTest: (test: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  suites,
  runs,
  onRunSuite,
  onNavigateToRunner,
  onNavigateToSuites,
  onNavigateToGenerator,
  onInspectTest,
}) => {
  // Aggregate statistics across all suites and tests
  let totalTests = 0;
  let passedTests = 0;
  let regressedTests = 0;
  let unrunTests = 0;
  let totalSemanticScore = 0;
  let evaluatedTestsCount = 0;
  let totalDrift = 0;

  suites.forEach((suite) => {
    suite.tests.forEach((test) => {
      totalTests++;
      if (!test.lastRun) {
        unrunTests++;
      } else {
        evaluatedTestsCount++;
        totalSemanticScore += test.lastRun.semanticScore;
        totalDrift += test.lastRun.driftPercentage;
        if (test.lastRun.status === 'passed') {
          passedTests++;
        } else {
          regressedTests++;
        }
      }
    });
  });

  const passRate = evaluatedTestsCount > 0 
    ? Math.round((passedTests / evaluatedTestsCount) * 100) 
    : 100;
  const avgSemantic = evaluatedTestsCount > 0 
    ? Math.round(totalSemanticScore / evaluatedTestsCount) 
    : 92;
  const avgDrift = evaluatedTestsCount > 0 
    ? Math.round(totalDrift / evaluatedTestsCount) 
    : 8;

  const latestRun = runs[0];

  return (
    <div className="space-y-8">
      {/* Hero Welcome & Quick Action Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
              <Zap className="w-3.5 h-3.5" />
              <span>Continuous AI Regression & Drift Guard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Protect Your AI & APIs from Behavioral Regression
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Compare baseline behaviors against candidate model iterations, detect subtle prompt drift,
              enforce keyword guardrails, and auto-heal regressed outputs using Gemini 3.8 Flash.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateToRunner()}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Launch Test Matrix</span>
            </button>
            <button
              onClick={onNavigateToGenerator}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 font-medium text-sm transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Generate Test Suite</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pass Rate */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Regression Pass Rate</span>
            <div className={`p-2 rounded-lg ${passRate >= 80 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-white">{passRate}%</span>
            <span className="text-xs text-slate-400 font-medium">
              ({passedTests}/{evaluatedTestsCount} passed)
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full ${passRate >= 80 ? 'bg-emerald-500' : 'bg-rose-500'}`} 
              style={{ width: `${passRate}%` }} 
            />
          </div>
        </div>

        {/* Semantic Score */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Semantic Alignment</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Gauge className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-white">{avgSemantic}</span>
            <span className="text-xs text-slate-400 font-medium">/ 100 baseline match</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${avgSemantic}%` }} />
          </div>
        </div>

        {/* Semantic Drift */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Semantic Drift Index</span>
            <div className={`p-2 rounded-lg ${avgDrift <= 15 ? 'bg-cyan-500/10 text-cyan-400' : 'bg-amber-500/10 text-amber-400'}`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-white">{avgDrift}%</span>
            <span className="text-xs text-slate-400 font-medium">variance detected</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className={`h-full rounded-full ${avgDrift <= 15 ? 'bg-cyan-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(avgDrift * 3, 100)}%` }} />
          </div>
        </div>

        {/* Total Tests & Coverage */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Test Suite Coverage</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-white">{totalTests}</span>
            <span className="text-xs text-slate-400 font-medium">cases across {suites.length} suites</span>
          </div>
          <div className="mt-3 flex items-center space-x-3 text-xs text-slate-400">
            <span className="text-emerald-400">{passedTests} passed</span>
            <span>•</span>
            <span className="text-rose-400">{regressedTests} regressed</span>
            <span>•</span>
            <span className="text-slate-500">{unrunTests} unrun</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Suites Overview & Risk Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Active Suites */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Active Regression Test Suites</h2>
              <p className="text-xs text-slate-400">Configured baseline suites and recent execution health</p>
            </div>
            <button
              onClick={onNavigateToSuites}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1"
            >
              <span>Manage Suites</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {suites.map((suite) => {
              const suitePass = suite.tests.filter((t) => t.lastRun?.status === 'passed').length;
              const suiteRegressed = suite.tests.filter((t) => t.lastRun?.status === 'regressed' || t.lastRun?.status === 'failed').length;
              const suiteUnrun = suite.tests.filter((t) => !t.lastRun).length;

              return (
                <div
                  key={suite.id}
                  className="rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 p-5 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white text-sm">{suite.name}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                          {suite.category}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                          {suite.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">{suite.description}</p>
                    </div>

                    <div className="flex items-center space-x-2 self-start sm:self-auto">
                      <button
                        onClick={() => onNavigateToRunner(suite.id)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium flex items-center space-x-1.5 transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-indigo-300" />
                        <span>Run Suite</span>
                      </button>
                    </div>
                  </div>

                  {/* Test Status Bar inside Suite */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-4">
                      <span className="text-slate-400">
                        Tests: <strong className="text-slate-200">{suite.tests.length}</strong>
                      </span>
                      {suitePass > 0 && (
                        <span className="text-emerald-400 font-medium">
                          ✓ {suitePass} Passed
                        </span>
                      )}
                      {suiteRegressed > 0 && (
                        <span className="text-rose-400 font-medium">
                          ✗ {suiteRegressed} Regressed
                        </span>
                      )}
                      {suiteUnrun > 0 && (
                        <span className="text-slate-500">
                          {suiteUnrun} Unrun
                        </span>
                      )}
                    </div>
                    <span className="text-slate-500 text-[11px] font-mono">
                      Model: {suite.targetModelOrUrl}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Risk & Regressed Test Highlights */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white tracking-tight">Regression Alerts & Drift</h2>
          <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
            {regressedTests === 0 ? (
              <div className="text-center py-8 space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-white text-sm">No Active Regressions</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  All executed test cases match semantic thresholds and maintain policy guardrails.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-rose-400 text-xs font-semibold">
                  <AlertOctagon className="w-4 h-4" />
                  <span>{regressedTests} Test(s) Regressed or Failed Guardrails</span>
                </div>
                
                {suites.flatMap((s) => s.tests)
                  .filter((t) => t.lastRun?.status === 'regressed' || t.lastRun?.status === 'failed')
                  .slice(0, 3)
                  .map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onInspectTest(t)}
                      className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 hover:border-rose-700/60 cursor-pointer transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs text-rose-200">{t.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                          {t.lastRun?.driftPercentage}% Drift
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        {t.lastRun?.reasons?.[0] || 'Semantic similarity score fell below expected threshold.'}
                      </p>
                      <div className="text-[10px] text-indigo-400 hover:underline flex items-center space-x-1 pt-1">
                        <span>Inspect diff & auto-heal</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Quick Test Runner CTA */}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => onNavigateToRunner()}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center space-x-2 transition-all"
              >
                <GitCompare className="w-3.5 h-3.5 text-indigo-400" />
                <span>Open Side-by-Side Diff Runner</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
