import type {
  ChangesetAnalysis,
  ChartSeries,
  RegressionTestCase,
  ReportMetric,
  ReportMetricPoint,
} from '../types/analysis'

/* Deterministic telemetry used by the PeakChart surfaces. The final point of each "current" series is
   driven by live app state (active changeset, threshold, mitigations, latest run) so lines morph on change. */

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const dayLabels = (n: number) => Array.from({ length: n }, (_, i) => `Jun ${i + 1}`)
const weekLabels = (n: number) => Array.from({ length: n }, (_, i) => `W${String(i + 1).padStart(2, '0')}`)

const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / Math.max(1, xs.length)
const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0)
const round1 = (x: number) => Math.round(x * 10) / 10
const direction = (current: number, previous: number): 'up' | 'down' =>
  current >= previous ? 'up' : 'down'

/* ---------- Dashboard ---------- */

export function buildRuntimeSavedSeries(timeSavedPct: number, prNumber: string): Record<string, ChartSeries> {
  const weekBase = [86, 84, 88, 87, 90, 89]
  const month = [
    80, 81, 82, 83, 84, 85, 85, 84, 83, 83, 84, 86, 88, 89, 90, 90, 89, 88, 88, 89, 90, 91, 92, 92, 93,
    93, 94, 94, 93,
  ]
  const quarter = [74, 76, 79, 78, 81, 83, 82, 85, 86, 88, 87, 90]
  const monthData = [...month, timeSavedPct]
  const quarterData = [...quarter, timeSavedPct]
  return {
    Weekly: {
      data: [...weekBase, timeSavedPct],
      labels: [...WEEK_DAYS.slice(0, 6), `Today · ${prNumber}`],
      value: timeSavedPct,
      caption: `${prNumber} vs. the full regression suite`,
      trend: direction(timeSavedPct, weekBase[weekBase.length - 1]),
    },
    Monthly: {
      data: monthData,
      labels: dayLabels(30),
      value: Math.round(avg(monthData)),
      caption: '30-day average across 412 analyzed PRs',
      trend: 'up',
    },
    Quarterly: {
      data: quarterData,
      labels: weekLabels(13),
      value: Math.round(avg(quarterData)),
      caption: 'Quarter average across 13 weekly windows',
      trend: 'up',
    },
  }
}

export function buildRegressionsCaughtSeries(failingNow: number): Record<string, ChartSeries> {
  const week = [3, 5, 2, 6, 9, 4, 2 + failingNow]
  const month = [
    3, 3, 4, 4, 5, 5, 4, 4, 5, 6, 7, 7, 6, 5, 5, 6, 8, 10, 12, 11, 9, 7, 6, 6, 7, 7, 8, 8, 7,
    4 + failingNow,
  ]
  const quarter = [21, 24, 19, 27, 31, 26, 29, 34, 30, 37, 33, 39, 36]
  return {
    Weekly: {
      data: week,
      labels: WEEK_DAYS,
      value: sum(week),
      caption: 'Caught pre-merge by AI-selected suites this week',
      trend: 'up',
    },
    Monthly: {
      data: month,
      labels: dayLabels(30),
      value: sum(month),
      caption: 'Intercepted before merge in the last 30 days',
      trend: 'up',
    },
    Quarterly: {
      data: quarter,
      labels: weekLabels(13),
      value: sum(quarter),
      caption: 'Intercepted this quarter · 0 escaped to prod',
      trend: 'up',
    },
  }
}

/* ---------- AI Risk ---------- */

export function buildRiskTrajectorySeries(
  changeset: ChangesetAnalysis,
  adjustedRisk: number,
  resolvedMitigations: number
): Record<string, ChartSeries> {
  const history = changeset.riskHistory
  const recent = [...history.slice(0, -1).map((h) => h.score), adjustedRisk]
  const month = [
    44, 45, 46, 48, 50, 51, 51, 50, 49, 49, 50, 52, 55, 58, 60, 59, 57, 55, 54, 54, 55, 57, 59, 61, 62,
    61, 60, 59, 58,
  ]
  const quarter = [41, 44, 43, 47, 50, 48, 46, 51, 53, 55, 52, 56]
  const monthData = [...month, adjustedRisk]
  const quarterData = [...quarter, adjustedRisk]
  return {
    'Recent PRs': {
      data: recent,
      labels: history.map((h) => h.label),
      value: adjustedRisk,
      caption: `${changeset.prNumber} · ${resolvedMitigations} of ${changeset.mitigations.length} mitigations resolved`,
      trend: 'none',
    },
    '30 days': {
      data: monthData,
      labels: dayLabels(30),
      value: Math.round(avg(monthData)),
      caption: '30-day mean risk index across merged PRs',
      trend: 'none',
    },
    Quarter: {
      data: quarterData,
      labels: weekLabels(13),
      value: Math.round(avg(quarterData)),
      caption: 'Quarter mean risk index · weekly windows',
      trend: 'none',
    },
  }
}

/* ---------- Test Execution ---------- */

export function buildPassRateSeries(passRate: number, runNumber: number): Record<string, ChartSeries> {
  const runs = [94.1, 95.6, 93.2, 96.8, 95.1, 97.4, 96.2, 94.8, 97.9, 96.5, 98.2]
  const days = [95.2, 96.1, 94.7, 97.3, 96.4, 98.1]
  const month = [
    93.4, 93.8, 94.1, 94.5, 94.9, 95.1, 95.0, 94.7, 94.6, 94.9, 95.4, 95.9, 96.3, 96.6, 96.8, 96.7, 96.4,
    96.2, 96.3, 96.6, 97.0, 97.3, 97.5, 97.6, 97.5, 97.4, 97.6, 97.8, 97.9,
  ]
  const runLabels = Array.from({ length: runs.length }, (_, i) => `Run #${runNumber - runs.length + i}`)
  const dayData = [...days, passRate]
  const monthData = [...month, passRate]
  return {
    'Last 12 runs': {
      data: [...runs, passRate],
      labels: [...runLabels, `Run #${runNumber}`],
      value: passRate,
      caption: `Run #${runNumber} · targeted suite`,
      trend: direction(passRate, runs[runs.length - 1]),
    },
    '7 days': {
      data: dayData,
      labels: WEEK_DAYS,
      value: round1(avg(dayData)),
      caption: '7-day mean across targeted runs',
      trend: direction(passRate, days[days.length - 1]),
    },
    '30 days': {
      data: monthData,
      labels: dayLabels(30),
      value: round1(avg(monthData)),
      caption: '30-day mean across targeted runs',
      trend: 'up',
    },
  }
}

/* ---------- Regression Test Selection ---------- */

/** Same projection the selection page shows: capture rises with suite size and confidence. */
export function projectCapture(tests: RegressionTestCase[]) {
  const avgConf = tests.length ? tests.reduce((s, t) => s + t.confidence, 0) / tests.length : 0
  return Math.min(99.9, Math.max(72.0, +(86 + tests.length * 1.15 + avgConf * 3).toFixed(1)))
}

export function projectRuntimeSaved(tests: RegressionTestCase[], fullSuiteMinutes: number) {
  const minutes = Math.max(0.2, tests.reduce((s, t) => s + t.estimatedSec, 0) / 60)
  return Math.round(((fullSuiteMinutes - minutes) / fullSuiteMinutes) * 100)
}

/**
 * Sweeps the confidence cutoff from 0.50 to 0.95. Each "period" is a metric, so the chart's pill
 * switches between capture, runtime saved and suite size; the headline tracks the live selection.
 */
export function buildThresholdSweepSeries(
  changeset: ChangesetAnalysis,
  selected: RegressionTestCase[]
): Record<string, ChartSeries> {
  const cutoffs = Array.from({ length: 10 }, (_, i) => +(0.5 + i * 0.05).toFixed(2))
  const atCutoff = cutoffs.map((c) => changeset.tests.filter((t) => t.confidence >= c))
  const labels = cutoffs.map((c) => `≥ ${Math.round(c * 100)}% confidence`)
  return {
    Capture: {
      data: atCutoff.map(projectCapture),
      labels,
      value: projectCapture(selected),
      caption: 'Projected defect capture at your current cutoff',
      title: 'Defect capture',
      suffix: '%',
      decimals: 1,
      trend: 'none',
    },
    Runtime: {
      data: atCutoff.map((tests) => projectRuntimeSaved(tests, changeset.fullSuiteMinutes)),
      labels,
      value: projectRuntimeSaved(selected, changeset.fullSuiteMinutes),
      caption: 'CI runtime saved vs. the full regression suite',
      title: 'Runtime saved',
      suffix: '%',
      decimals: 0,
      trend: 'none',
    },
    'Suite size': {
      data: atCutoff.map((tests) => tests.length),
      labels,
      value: selected.length,
      caption: `Tests selected of ${changeset.tests.length} ranked candidates`,
      title: 'Tests selected',
      suffix: '',
      decimals: 0,
      trend: 'none',
    },
  }
}

/* ---------- Reports ---------- */

const QUARTER_SERIES: Record<ReportMetric, number[]> = {
  runtime: [71.8, 73.5, 74.2, 76.9, 78.1, 77.4, 79.6, 82.4, 84.6, 86.5, 88.2, 89.3, 90.7],
  capture: [96.1, 96.4, 96.2, 96.9, 97.3, 97.1, 97.6, 97.9, 98.4, 98.8, 99.1, 99.3, 99.4],
  prs: [92, 98, 104, 101, 112, 109, 118, 118, 132, 141, 156, 164, 179],
}

const YEAR_SERIES: Record<ReportMetric, number[]> = {
  runtime: [58.2, 61.4, 63.9, 62.7, 66.8, 69.5, 71.2, 74.6, 77.3, 81.9, 86.4, 90.7],
  capture: [94.2, 94.8, 95.1, 94.9, 95.7, 96.2, 96.6, 97.0, 97.5, 98.2, 98.9, 99.4],
  prs: [318, 342, 365, 351, 402, 428, 446, 471, 498, 540, 589, 655],
}

export const REPORT_METRIC_META: Record<
  ReportMetric,
  { label: string; title: string; suffix: string; decimals: number }
> = {
  runtime: { label: 'Runtime saved', title: 'CI runtime saved', suffix: '%', decimals: 0 },
  capture: { label: 'Defect capture', title: 'Defect capture rate', suffix: '%', decimals: 1 },
  prs: { label: 'PRs analyzed', title: 'PRs analyzed', suffix: '', decimals: 0 },
}

export function buildReportSeries(
  trend: ReportMetricPoint[],
  metric: ReportMetric
): Record<string, ChartSeries> {
  const six =
    metric === 'runtime'
      ? trend.map((p) => round1(((p.fullSuiteMins - p.selectedSuiteMins) / p.fullSuiteMins) * 100))
      : metric === 'capture'
        ? trend.map((p) => p.defectCapturePct)
        : trend.map((p) => p.prsAnalyzed)
  const quarter = QUARTER_SERIES[metric]
  const year = YEAR_SERIES[metric]
  const headline = (xs: number[]) => (metric === 'prs' ? sum(xs) : xs[xs.length - 1])
  const captions: Record<ReportMetric, [string, string, string]> = {
    runtime: [
      'Latest week vs. full regression baseline',
      'Latest week · 13-week trend',
      'Latest month · 12-month trend',
    ],
    capture: [
      'Latest week · defects caught by selected suites',
      'Latest week · 13-week trend',
      'Latest month · 12-month trend',
    ],
    prs: ['Total PRs analyzed over 6 weeks', 'Total PRs analyzed this quarter', 'Total PRs analyzed this year'],
  }
  return {
    '6 weeks': {
      data: six,
      labels: trend.map((p) => p.week),
      value: headline(six),
      caption: captions[metric][0],
      trend: direction(six[six.length - 1], six[six.length - 2] ?? six[0]),
    },
    Quarter: {
      data: quarter,
      labels: weekLabels(quarter.length),
      value: headline(quarter),
      caption: captions[metric][1],
      trend: direction(quarter[quarter.length - 1], quarter[quarter.length - 2]),
    },
    Year: {
      data: year,
      labels: MONTHS,
      value: headline(year),
      caption: captions[metric][2],
      trend: direction(year[year.length - 1], year[year.length - 2]),
    },
  }
}
