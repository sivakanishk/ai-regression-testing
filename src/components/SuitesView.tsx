import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Play, 
  Search, 
  Filter, 
  FileCode, 
  Tag, 
  CheckCircle, 
  AlertTriangle, 
  Edit3, 
  X, 
  Save, 
  Layers,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { TestSuite, TestCase, TestType } from '../types/regression.js';

interface SuitesViewProps {
  suites: TestSuite[];
  onSaveSuite: (suite: TestSuite) => void;
  onDeleteSuite: (id: string) => void;
  onRunSuite: (suite: TestSuite) => void;
  onInspectTest: (test: TestCase) => void;
}

export const SuitesView: React.FC<SuitesViewProps> = ({
  suites,
  onSaveSuite,
  onDeleteSuite,
  onRunSuite,
  onInspectTest,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedSuites, setExpandedSuites] = useState<Record<string, boolean>>({
    'suite-ai-ecommerce': true,
    'suite-agent-triage': true,
  });

  // Modal states
  const [isSuiteModalOpen, setIsSuiteModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [targetSuiteId, setTargetSuiteId] = useState<string | null>(null);

  // New Suite Form
  const [suiteName, setSuiteName] = useState('');
  const [suiteDesc, setSuiteDesc] = useState('');
  const [suiteCategory, setSuiteCategory] = useState('LLM Agent');
  const [suiteType, setSuiteType] = useState<TestType>('llm_semantic');
  const [suiteModel, setSuiteModel] = useState('gemini-3.8-flash');

  // New Test Case Form
  const [testName, setTestName] = useState('');
  const [testDesc, setTestDesc] = useState('');
  const [testSysPrompt, setTestSysPrompt] = useState('');
  const [testInputPrompt, setTestInputPrompt] = useState('');
  const [testBaseline, setTestBaseline] = useState('');
  const [testExpectedKeywords, setTestExpectedKeywords] = useState('');
  const [testUnexpectedKeywords, setTestUnexpectedKeywords] = useState('');
  const [testThreshold, setTestThreshold] = useState(85);
  const [testTags, setTestTags] = useState('regression, guardrail');

  const categories = ['all', ...Array.from(new Set(suites.map((s) => s.category)))];

  const filteredSuites = suites.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tests.some((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || s.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const toggleSuite = (id: string) => {
    setExpandedSuites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateSuite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suiteName.trim()) return;

    const newSuite: TestSuite = {
      id: `suite-${Date.now()}`,
      name: suiteName.trim(),
      description: suiteDesc.trim(),
      category: suiteCategory,
      type: suiteType,
      targetModelOrUrl: suiteModel,
      tests: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveSuite(newSuite);
    setIsSuiteModalOpen(false);
    setSuiteName('');
    setSuiteDesc('');
  };

  const handleAddTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSuiteId || !testName.trim() || !testInputPrompt.trim() || !testBaseline.trim()) return;

    const target = suites.find((s) => s.id === targetSuiteId);
    if (!target) return;

    const newTest: TestCase = {
      id: `test-${Date.now()}`,
      name: testName.trim(),
      description: testDesc.trim(),
      type: target.type,
      tags: testTags.split(',').map((t) => t.trim()).filter(Boolean),
      systemPrompt: testSysPrompt.trim() || undefined,
      inputPrompt: testInputPrompt.trim(),
      baselineOutput: testBaseline.trim(),
      expectedKeywords: testExpectedKeywords ? testExpectedKeywords.split(',').map((k) => k.trim()).filter(Boolean) : undefined,
      unexpectedKeywords: testUnexpectedKeywords ? testUnexpectedKeywords.split(',').map((k) => k.trim()).filter(Boolean) : undefined,
      semanticThreshold: Number(testThreshold) || 80,
    };

    const updatedSuite: TestSuite = {
      ...target,
      tests: [...target.tests, newTest],
      updatedAt: new Date().toISOString(),
    };

    onSaveSuite(updatedSuite);
    setIsTestModalOpen(false);
    // Reset test form
    setTestName('');
    setTestDesc('');
    setTestSysPrompt('');
    setTestInputPrompt('');
    setTestBaseline('');
    setTestExpectedKeywords('');
    setTestUnexpectedKeywords('');
  };

  const openAddTestModal = (suiteId: string) => {
    setTargetSuiteId(suiteId);
    setIsTestModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Test Suites & Regressions</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Define baseline golden outputs, semantic thresholds, and critical guardrails for AI and APIs.
          </p>
        </div>

        <button
          onClick={() => setIsSuiteModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md shadow-indigo-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Test Suite</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search suites, test cases, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Suites List */}
      <div className="space-y-4">
        {filteredSuites.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-slate-900/40 border border-slate-800">
            <Layers className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-300">No matching suites found</h3>
            <p className="text-xs text-slate-500 mt-1">Try refining your search query or create a new test suite.</p>
          </div>
        ) : (
          filteredSuites.map((suite) => {
            const isExpanded = !!expandedSuites[suite.id];
            return (
              <div
                key={suite.id}
                className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden shadow-sm hover:border-slate-700/80 transition-all"
              >
                {/* Suite Header Card */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 bg-slate-900/90">
                  <div
                    className="flex items-start sm:items-center space-x-3 cursor-pointer flex-1"
                    onClick={() => toggleSuite(suite.id)}
                  >
                    <button className="text-slate-400 hover:text-white mt-1 sm:mt-0">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-white text-base">{suite.name}</h3>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                          {suite.category}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                          {suite.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{suite.description}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openAddTestModal(suite.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center space-x-1.5 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Case</span>
                    </button>

                    <button
                      onClick={() => onRunSuite(suite)}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center space-x-1.5 transition-all shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Run Suite</span>
                    </button>

                    <button
                      onClick={() => onDeleteSuite(suite.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      title="Delete Suite"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Test Cases inside Suite */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-3 bg-slate-950/40">
                    {suite.tests.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl">
                        <p className="text-xs text-slate-500">No test cases in this suite yet.</p>
                        <button
                          onClick={() => openAddTestModal(suite.id)}
                          className="mt-2 text-xs text-indigo-400 hover:underline font-medium"
                        >
                          + Add your first test case
                        </button>
                      </div>
                    ) : (
                      suite.tests.map((test) => {
                        const status = test.lastRun?.status;
                        return (
                          <div
                            key={test.id}
                            className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                          >
                            <div className="space-y-2 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-slate-200 text-sm">{test.name}</span>
                                {test.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-400 font-mono"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 font-mono">
                                  Min Match: {test.semanticThreshold}%
                                </span>
                              </div>

                              <p className="text-xs text-slate-400">{test.description}</p>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                                    Input Prompt / Trigger
                                  </span>
                                  <p className="text-slate-300 font-mono text-[11px] line-clamp-2">{test.inputPrompt}</p>
                                </div>
                                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                                    Expected Baseline Output
                                  </span>
                                  <p className="text-slate-300 font-mono text-[11px] line-clamp-2">{test.baselineOutput}</p>
                                </div>
                              </div>
                            </div>

                            {/* Status & Last Run */}
                            <div className="flex items-center space-x-3 self-end md:self-center">
                              {test.lastRun ? (
                                <div className="text-right">
                                  <div className="flex items-center justify-end space-x-1.5">
                                    <span
                                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                                        status === 'passed'
                                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                      }`}
                                    >
                                      {status}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-slate-400 font-mono block mt-1">
                                    {test.lastRun.semanticScore}% match • {test.lastRun.driftPercentage}% drift
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-500 italic">Not evaluated</span>
                              )}

                              <button
                                onClick={() => onInspectTest(test)}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
                              >
                                Inspect Diff
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: New Test Suite */}
      {isSuiteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Create Regression Test Suite</h3>
              <button
                onClick={() => setIsSuiteModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSuite} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Suite Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Auth Token Expiry & Refresh Regression"
                  value={suiteName}
                  onChange={(e) => setSuiteName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="What behaviors or contracts does this suite protect against regressions?"
                  value={suiteDesc}
                  onChange={(e) => setSuiteDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={suiteCategory}
                    onChange={(e) => setSuiteCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm text-slate-200 focus:outline-none"
                  >
                    <option value="LLM Agent">LLM Agent</option>
                    <option value="API Contract">API Contract</option>
                    <option value="Safety & Guardrail">Safety & Guardrail</option>
                    <option value="Payment Pipeline">Payment Pipeline</option>
                    <option value="UI & Component">UI & Component</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Test Type</label>
                  <select
                    value={suiteType}
                    onChange={(e) => setSuiteType(e.target.value as TestType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm text-slate-200 focus:outline-none"
                  >
                    <option value="llm_semantic">LLM Semantic</option>
                    <option value="api_contract">API Contract</option>
                    <option value="ui_snapshot">UI Snapshot</option>
                    <option value="functional_logic">Functional Logic</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSuiteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-md shadow-indigo-600/30"
                >
                  Create Suite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Test Case */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Add Regression Test Case</h3>
                <p className="text-xs text-slate-400">Define expected baseline response and drift tolerances.</p>
              </div>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTest} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Test Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Reject Invalid Promo Codes"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. promo, guardrail, critical"
                    value={testTags}
                    onChange={(e) => setTestTags(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">System Instructions / Context</label>
                <textarea
                  rows={2}
                  placeholder="System prompt or context guiding the model behavior (optional)..."
                  value={testSysPrompt}
                  onChange={(e) => setTestSysPrompt(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm text-slate-200 placeholder-slate-500 focus:outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Input Prompt / Trigger *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="User prompt or API payload to trigger the test..."
                  value={testInputPrompt}
                  onChange={(e) => setTestInputPrompt(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm text-slate-200 placeholder-slate-500 focus:outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Expected Baseline (Golden Output) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="The ground truth output that future versions will be checked against..."
                  value={testBaseline}
                  onChange={(e) => setTestBaseline(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm text-slate-200 placeholder-slate-500 focus:outline-none font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Semantic Threshold ({testThreshold}%)
                  </label>
                  <input
                    type="range"
                    min={50}
                    max={100}
                    value={testThreshold}
                    onChange={(e) => setTestThreshold(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Mandatory Keywords</label>
                  <input
                    type="text"
                    placeholder="e.g. invalid, expired"
                    value={testExpectedKeywords}
                    onChange={(e) => setTestExpectedKeywords(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Prohibited Keywords</label>
                  <input
                    type="text"
                    placeholder="e.g. approved, discount applied"
                    value={testUnexpectedKeywords}
                    onChange={(e) => setTestUnexpectedKeywords(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-md shadow-indigo-600/30"
                >
                  Save Test Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
