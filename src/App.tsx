import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { SuitesView } from './components/SuitesView.tsx';
import { RunnerView } from './components/RunnerView.tsx';
import { GeneratorView } from './components/GeneratorView.tsx';
import { HistoryView } from './components/HistoryView.tsx';
import { DiffInspectorModal } from './components/DiffInspectorModal.tsx';
import { TestSuite, TestCase, TestRunResult } from './types/regression.ts';
import { ShieldCheck, ExternalLink, Activity } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [runs, setRuns] = useState<TestRunResult[]>([]);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [selectedSuiteId, setSelectedSuiteId] = useState<string | undefined>(undefined);
  const [inspectedTest, setInspectedTest] = useState<TestCase | null>(null);
  const [isRunningAll, setIsRunningAll] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [suitesRes, runsRes, healthRes] = await Promise.all([
        fetch('/api/suites'),
        fetch('/api/runs'),
        fetch('/api/health'),
      ]);

      if (suitesRes.ok) {
        const suitesData = await suitesRes.json();
        setSuites(suitesData);
      }

      if (runsRes.ok) {
        const runsData = await runsRes.json();
        setRuns(runsData);
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHasApiKey(healthData.hasApiKey ?? true);
      }
    } catch (err) {
      console.warn('Error fetching data from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save or update suite
  const handleSaveSuite = async (suite: TestSuite) => {
    try {
      const res = await fetch('/api/suites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(suite),
      });
      if (res.ok) {
        const saved = await res.json();
        setSuites((prev) => {
          const idx = prev.findIndex((s) => s.id === saved.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = saved;
            return next;
          }
          return [saved, ...prev];
        });
      }
    } catch (err) {
      console.error('Failed to save suite:', err);
    }
  };

  // Delete suite
  const handleDeleteSuite = async (id: string) => {
    try {
      const res = await fetch(`/api/suites/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuites((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete suite:', err);
    }
  };

  // Add tests to suite
  const handleAddTestsToSuite = async (suiteId: string, newTests: TestCase[]) => {
    const target = suites.find((s) => s.id === suiteId);
    if (!target) return;

    const updated: TestSuite = {
      ...target,
      tests: [...target.tests, ...newTests],
      updatedAt: new Date().toISOString(),
    };

    await handleSaveSuite(updated);
  };

  // Record a completed test run
  const handleRunComplete = async (runResult: TestRunResult) => {
    try {
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(runResult),
      });
      if (res.ok) {
        const saved = await res.json();
        setRuns((prev) => [saved, ...prev]);
        // Refresh suites to pick up lastRun updates
        const suitesRes = await fetch('/api/suites');
        if (suitesRes.ok) {
          const updatedSuites = await suitesRes.json();
          setSuites(updatedSuites);
        }
      }
    } catch (err) {
      console.error('Failed to save test run:', err);
    }
  };

  // Run all suites
  const handleRunAll = async () => {
    if (isRunningAll || suites.length === 0) return;
    setIsRunningAll(true);
    setActiveTab('runner');

    for (const suite of suites) {
      setSelectedSuiteId(suite.id);
      // Run individual suite
      const details: TestRunResult['details'] = [];
      const startTime = Date.now();
      let passed = 0;
      let regressed = 0;
      let totalScore = 0;
      let totalDrift = 0;

      for (const test of suite.tests) {
        const testStart = Date.now();
        try {
          const runRes = await fetch('/api/gemini/run-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemPrompt: test.systemPrompt,
              inputPrompt: test.inputPrompt,
              model: suite.targetModelOrUrl || 'gemini-3.8-flash',
            }),
          });
          const runData = await runRes.json();
          const candidateOutput = runData.output || '';
          const latencyMs = runData.latencyMs || (Date.now() - testStart);

          const evalRes = await fetch('/api/gemini/evaluate-regression', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              baselineOutput: test.baselineOutput,
              candidateOutput,
              inputPrompt: test.inputPrompt,
              systemPrompt: test.systemPrompt,
              semanticThreshold: test.semanticThreshold,
              expectedKeywords: test.expectedKeywords,
              unexpectedKeywords: test.unexpectedKeywords,
            }),
          });
          const evalData = await evalRes.json();

          const status = evalData.status || (evalData.similarityScore >= test.semanticThreshold ? 'passed' : 'regressed');
          if (status === 'passed') passed++;
          else regressed++;

          totalScore += evalData.similarityScore || 80;
          totalDrift += evalData.driftPercentage || 20;

          details.push({
            testId: test.id,
            testName: test.name,
            status,
            severity: evalData.severity || 'none',
            semanticScore: evalData.similarityScore || 80,
            driftPercentage: evalData.driftPercentage || 20,
            baselineOutput: test.baselineOutput,
            candidateOutput,
            latencyMs,
            notes: evalData.explanation || '',
            suggestedFix: evalData.suggestedPromptPatch,
          });
        } catch (err: any) {
          regressed++;
          details.push({
            testId: test.id,
            testName: test.name,
            status: 'failed',
            severity: 'critical',
            semanticScore: 0,
            driftPercentage: 100,
            baselineOutput: test.baselineOutput,
            candidateOutput: `Error: ${err.message}`,
            latencyMs: Date.now() - testStart,
            notes: err.message,
          });
        }
      }

      const total = suite.tests.length;
      const runResult: TestRunResult = {
        id: `run-${Date.now()}`,
        suiteId: suite.id,
        suiteName: suite.name,
        runAt: new Date().toISOString(),
        totalTests: total,
        passed,
        failed: 0,
        regressed,
        durationMs: Date.now() - startTime,
        averageSemanticScore: total > 0 ? Math.round(totalScore / total) : 0,
        averageDrift: total > 0 ? Math.round(totalDrift / total) : 0,
        details,
      };

      await handleRunComplete(runResult);
    }

    setIsRunningAll(false);
  };

  const handleNavigateToRunner = (suiteId?: string) => {
    if (suiteId) setSelectedSuiteId(suiteId);
    setActiveTab('runner');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isRunningAll={isRunningAll}
        onRunAll={handleRunAll}
        suitesCount={suites.length}
        hasApiKey={hasApiKey}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Initializing AI Regression Studio...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                suites={suites}
                runs={runs}
                onRunSuite={(suite) => handleNavigateToRunner(suite.id)}
                onNavigateToRunner={handleNavigateToRunner}
                onNavigateToSuites={() => setActiveTab('suites')}
                onNavigateToGenerator={() => setActiveTab('generator')}
                onInspectTest={(test) => setInspectedTest(test)}
              />
            )}

            {activeTab === 'suites' && (
              <SuitesView
                suites={suites}
                onSaveSuite={handleSaveSuite}
                onDeleteSuite={handleDeleteSuite}
                onRunSuite={(suite) => handleNavigateToRunner(suite.id)}
                onInspectTest={(test) => setInspectedTest(test)}
              />
            )}

            {activeTab === 'runner' && (
              <RunnerView
                suites={suites}
                selectedSuiteId={selectedSuiteId}
                onRunComplete={handleRunComplete}
                onInspectTest={(test) => setInspectedTest(test)}
              />
            )}

            {activeTab === 'generator' && (
              <GeneratorView
                suites={suites}
                onAddTestsToSuite={handleAddTestsToSuite}
                onNavigateToSuite={(suiteId) => {
                  setSelectedSuiteId(suiteId);
                  setActiveTab('suites');
                }}
              />
            )}

            {activeTab === 'history' && <HistoryView runs={runs} />}
          </>
        )}
      </main>

      {/* Diff Inspector & Auto-Heal Modal */}
      {inspectedTest && (
        <DiffInspectorModal
          test={inspectedTest}
          onClose={() => setInspectedTest(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>AI Regression Testing Studio — sivakanishk/ai-regression-testing</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5 text-slate-400">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gemini 3.8 Flash Powered</span>
            </span>
            <span>•</span>
            <span>Zero-Drift Policy Guard</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
