import React, { useState } from 'react';
import { 
  Sparkles, 
  Plus, 
  Check, 
  Layers, 
  ShieldAlert, 
  AlertCircle, 
  Wand2, 
  ArrowRight,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { TestSuite, TestCase, TestType } from '../types/regression.js';

interface GeneratorViewProps {
  suites: TestSuite[];
  onAddTestsToSuite: (suiteId: string, newTests: TestCase[]) => void;
  onNavigateToSuite: (suiteId: string) => void;
}

export const GeneratorView: React.FC<GeneratorViewProps> = ({
  suites,
  onAddTestsToSuite,
  onNavigateToSuite,
}) => {
  const [featureDescription, setFeatureDescription] = useState(
    'Financial Advisor AI: Portfolio rebalancing suggestions, risk level assessment, and strict prohibition against guaranteeing specific stock returns or providing certified fiduciary tax advice.'
  );
  const [systemPrompt, setSystemPrompt] = useState(
    'You are a conservative financial information assistant. Never promise or guarantee financial returns. Always include risk disclaimers.'
  );
  const [testType, setTestType] = useState<TestType>('llm_semantic');
  const [testCount, setTestCount] = useState<number>(3);
  const [targetSuiteId, setTargetSuiteId] = useState<string>(suites[0]?.id || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCases, setGeneratedCases] = useState<TestCase[]>([]);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureDescription.trim()) return;

    setIsGenerating(true);
    setAddedSuccess(false);

    try {
      const res = await fetch('/api/gemini/generate-test-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureDescription,
          systemPrompt,
          testType,
          count: testCount,
        }),
      });

      const data = await res.json();
      if (data.testCases && Array.isArray(data.testCases)) {
        const casesWithIds: TestCase[] = data.testCases.map((tc: any, index: number) => ({
          ...tc,
          id: `gen-test-${Date.now()}-${index}`,
          type: testType,
          semanticThreshold: tc.semanticThreshold || 85,
          tags: tc.tags || ['ai-generated', 'regression'],
        }));
        setGeneratedCases(casesWithIds);
      }
    } catch (err) {
      console.error('Failed to generate test cases:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddAllToSuite = () => {
    if (!targetSuiteId || generatedCases.length === 0) return;
    onAddTestsToSuite(targetSuiteId, generatedCases);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gemini-Powered Regression Synthesis</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">AI Test Case Generator</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Synthesize high-risk edge cases, policy stress tests, and boundary assertions to expand your regression suite coverage.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-1 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-5 shadow-sm h-fit">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Feature / Contract / System Description *
              </label>
              <textarea
                rows={4}
                required
                value={featureDescription}
                onChange={(e) => setFeatureDescription(e.target.value)}
                placeholder="Describe the application feature, policy rules, or API spec..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs text-slate-200 placeholder-slate-500 focus:outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Existing System Instructions (Optional)
              </label>
              <textarea
                rows={3}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Paste the current system prompt to synthesize regressions for..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Test Type</label>
                <select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value as TestType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="llm_semantic">LLM Semantic</option>
                  <option value="api_contract">API Contract</option>
                  <option value="ui_snapshot">UI Snapshot</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Count</label>
                <select
                  value={testCount}
                  onChange={(e) => setTestCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs text-slate-200 focus:outline-none"
                >
                  <option value={2}>2 Cases</option>
                  <option value={3}>3 Cases</option>
                  <option value={4}>4 Cases</option>
                  <option value={5}>5 Cases</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Test Suite</label>
              <select
                value={targetSuiteId}
                onChange={(e) => setTargetSuiteId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs text-slate-200 focus:outline-none"
              >
                {suites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-indigo-600/30 active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing Test Matrix...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate Regression Cases</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">
              Generated Test Cases ({generatedCases.length})
            </h2>

            {generatedCases.length > 0 && (
              <button
                onClick={handleAddAllToSuite}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center space-x-1.5 transition-all shadow-sm active:scale-95"
              >
                {addedSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Added to Suite!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add All to Selected Suite</span>
                  </>
                )}
              </button>
            )}
          </div>

          {generatedCases.length === 0 ? (
            <div className="text-center py-16 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="font-semibold text-slate-300 text-sm">No Test Cases Generated Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Fill in the feature or prompt spec on the left and click "Generate Regression Cases" to create adversarial and happy-path tests.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {generatedCases.map((tc, index) => (
                <div
                  key={tc.id}
                  className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300">
                        #{index + 1}
                      </span>
                      <h4 className="font-bold text-white text-sm">{tc.name}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      Match Threshold: {tc.semanticThreshold}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">{tc.description}</p>

                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                        Input Prompt
                      </span>
                      <p className="text-xs font-mono text-slate-300">{tc.inputPrompt}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                        Golden Baseline (Expected Output)
                      </span>
                      <p className="text-xs font-mono text-slate-300 leading-relaxed">
                        {tc.baselineOutput}
                      </p>
                    </div>
                  </div>

                  {/* Guardrail keywords */}
                  {((tc.expectedKeywords && tc.expectedKeywords.length > 0) ||
                    (tc.unexpectedKeywords && tc.unexpectedKeywords.length > 0)) && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/70 text-[11px]">
                      {tc.expectedKeywords?.map((k) => (
                        <span key={k} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                          Must Include: "{k}"
                        </span>
                      ))}
                      {tc.unexpectedKeywords?.map((k) => (
                        <span key={k} className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono">
                          Must Exclude: "{k}"
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
