export type TestType = 'llm_semantic' | 'api_contract' | 'ui_snapshot' | 'functional_logic';

export type RegressionSeverity = 'none' | 'minor' | 'moderate' | 'critical' | 'improvement';

export type RunStatus = 'passed' | 'failed' | 'regressed' | 'running' | 'skipped' | 'warning';

export interface TestCase {
  id: string;
  name: string;
  description: string;
  type: TestType;
  tags: string[];
  systemPrompt?: string;
  inputPrompt: string; // or payload / trigger
  baselineOutput: string;
  expectedKeywords?: string[];
  unexpectedKeywords?: string[];
  semanticThreshold: number; // e.g. 80 (%)
  maxLatencyMs?: number;
  expectedStatusCode?: number;
  expectedJsonSchema?: string;
  lastRun?: {
    timestamp: string;
    candidateOutput: string;
    status: RunStatus;
    semanticScore: number;
    driftPercentage: number;
    latencyMs: number;
    tokensDelta?: number;
    severity: RegressionSeverity;
    reasons: string[];
    suggestedFix?: string;
  };
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  category: string;
  type: TestType;
  targetModelOrUrl: string;
  tests: TestCase[];
  createdAt: string;
  updatedAt: string;
}

export interface TestRunResult {
  id: string;
  suiteId: string;
  suiteName: string;
  runAt: string;
  totalTests: number;
  passed: number;
  failed: number;
  regressed: number;
  durationMs: number;
  averageSemanticScore: number;
  averageDrift: number;
  details: {
    testId: string;
    testName: string;
    status: RunStatus;
    severity: RegressionSeverity;
    semanticScore: number;
    driftPercentage: number;
    baselineOutput: string;
    candidateOutput: string;
    latencyMs: number;
    notes: string;
    suggestedFix?: string;
  }[];
}

export interface RegressionEvaluationResult {
  similarityScore: number; // 0 - 100
  driftPercentage: number; // 0 - 100
  status: RunStatus;
  severity: RegressionSeverity;
  isFormatRegressed: boolean;
  isToneShifted: boolean;
  hasHallucinationOrOmission: boolean;
  explanation: string;
  differences: string[];
  keyPreservedElements: string[];
  suggestedPromptPatch?: string;
}
