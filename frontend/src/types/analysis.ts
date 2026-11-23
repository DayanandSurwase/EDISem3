export type PageId =
  | 'dashboard'
  | 'code-comparison'
  | 'impact-analysis'
  | 'dependency-graph'
  | 'ai-risk'
  | 'test-selection'
  | 'test-results'
  | 'reports'
  | 'import-project'
  | 'projects'

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low'

export type DiffLineType = 'context' | 'added' | 'removed'

export interface DiffLine {
  oldLine?: number
  newLine?: number
  type: DiffLineType
  content: string
  annotation?: {
    id: string
    severity: RiskLevel
    title: string
    summary: string
    impactedSymbols: string[]
    linkedTestIds: string[]
  }
}

export interface ChangedSymbol {
  name: string
  kind: 'function' | 'method' | 'type' | 'hook' | 'config'
  delta: 'modified' | 'added' | 'removed'
  signature: string
  callersCount: number
}

export interface DiffFile {
  id: string
  path: string
  module: string
  language: 'typescript' | 'sql' | 'yaml'
  status: 'modified' | 'added' | 'deleted'
  additions: number
  deletions: number
  riskScore: number
  riskLevel: RiskLevel
  symbols: ChangedSymbol[]
  lines: DiffLine[]
}

export interface ImpactedEntity {
  id: string
  name: string
  filePath: string
  module: string
  entityType: 'function' | 'service' | 'endpoint' | 'schema' | 'worker' | 'ui-component'
  hopDistance: 0 | 1 | 2
  layer: 'API Gateway' | 'Domain Core' | 'Persistence' | 'Event Bus' | 'Client SDK'
  severity: RiskLevel
  confidence: number
  reason: string
  callPath: string[]
  coveredByTests: string[]
  untestedBranches: number
}

export type GraphLayer = 'changed' | 'hop1' | 'hop2' | 'datastore' | 'tests'

export interface GraphNode {
  id: string
  label: string
  sublabel: string
  layer: GraphLayer
  x: number
  y: number
  riskScore: number
  churn: number
  coveragePct: number
  filePath?: string
  description: string
}

export interface GraphEdge {
  id: string
  from: string
  to: string
  kind: 'calls' | 'reads-writes' | 'emits' | 'verifies'
  weight: number
}

export interface RiskFactor {
  id: string
  name: string
  category: 'Complexity' | 'History' | 'Blast Radius' | 'Coverage' | 'Concurrency'
  weightPct: number
  score: number
  explanation: string
}

export interface MitigationItem {
  id: string
  priority: 'P0' | 'P1' | 'P2'
  title: string
  detail: string
  targetFile: string
  completed: boolean
}

export type TestSuiteType = 'Unit' | 'Integration' | 'Contract' | 'E2E'

export type SelectionReason =
  | 'Direct AST Call'
  | 'Transitive Dependency'
  | 'Historical Co-Failure'
  | 'Shared Schema Contract'
  | 'Semantic Embedding Match'

export interface RegressionTestCase {
  id: string
  name: string
  suite: TestSuiteType
  filePath: string
  targetModule: string
  confidence: number
  estimatedSec: number
  reason: SelectionReason
  linkedEntities: string[]
  historicalFailRate: number
  lastRunStatus: 'passed' | 'failed' | 'flaky' | 'skipped'
  lastDurationSec: number
  failureDiagnostic?: {
    assertion: string
    expected: string
    actual: string
    implicatedFile: string
    implicatedLine: number
    aiRootCause: string
    stackTrace: string[]
  }
}

export interface ChangesetAnalysis {
  id: string
  prNumber: string
  title: string
  branch: string
  baseBranch: string
  commitSha: string
  author: string
  authorRole: string
  timestamp: string
  repo: string
  aiSummary: string
  overallRiskScore: number
  overallRiskLevel: RiskLevel
  totalRepoTests: number
  fullSuiteMinutes: number
  recommendedThreshold: number
  predictedDefectCapturePct: number
  diffFiles: DiffFile[]
  impactedEntities: ImpactedEntity[]
  graphNodes: GraphNode[]
  graphEdges: GraphEdge[]
  riskFactors: RiskFactor[]
  mitigations: MitigationItem[]
  riskHistory: { label: string; score: number; defectsPrevented: number }[]
  tests: RegressionTestCase[]
}

export interface ReportMetricPoint {
  week: string
  fullSuiteMins: number
  selectedSuiteMins: number
  defectCapturePct: number
  prsAnalyzed: number
}

export interface ModuleHotspot {
  module: string
  changes30d: number
  avgRisk: number
  defectDensity: number
  testReductionPct: number
  owner: string
}

/** One period of a PeakChart: the line, its hover labels, and the headline it pairs with. */
export interface ChartSeries {
  data: number[]
  labels: string[]
  value: number
  caption: string
  trend?: 'up' | 'down' | 'none'
  /** Optional overrides when a chart's periods are really different metrics. */
  title?: string
  suffix?: string
  decimals?: number
}

export type ReportMetric = 'runtime' | 'capture' | 'prs'
