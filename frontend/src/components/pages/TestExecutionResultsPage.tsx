import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileCode2,
  Play,
  RefreshCw,
  Sparkles,
  Terminal,
} from 'lucide-react'
import type { ChangesetAnalysis, PageId, RegressionTestCase } from '../../types/analysis'
import { buildPassRateSeries } from '../../data/chartSeries'
import { PeakChartPanel } from '../charts/PeakChartPanel'
import {
  Card,
  Chip,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
  TestStatusBadge,
} from '../ui/Primitives'

interface TestExecutionResultsPageProps {
  changeset: ChangesetAnalysis
  selectedTests: RegressionTestCase[]
  isRunning: boolean
  runProgressPct: number
  runCount: number
  onRunSelectedTests: () => void
  onNavigate: (page: PageId) => void
}

export function TestExecutionResultsPage({
  changeset,
  selectedTests,
  isRunning,
  runProgressPct,
  runCount,
  onRunSelectedTests,
  onNavigate,
}: TestExecutionResultsPageProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'failed' | 'passed' | 'flaky'>('all')
  const [focusedTestId, setFocusedTestId] = useState<string>('')

  const failedTests = selectedTests.filter((t) => t.lastRunStatus === 'failed')
  const passedTests = selectedTests.filter((t) => t.lastRunStatus === 'passed')
  const flakyTests = selectedTests.filter((t) => t.lastRunStatus === 'flaky')

  useEffect(() => {
    const firstFail = failedTests[0] ?? selectedTests[0]
    setFocusedTestId(firstFail?.id ?? '')
  }, [changeset, selectedTests.length])

  const filtered = selectedTests.filter((t) =>
    statusFilter === 'all' ? true : t.lastRunStatus === statusFilter
  )

  const focusedTest =
    filtered.find((t) => t.id === focusedTestId) ??
    selectedTests.find((t) => t.id === focusedTestId) ??
    failedTests[0] ??
    selectedTests[0]

  const totalDurationSec = selectedTests.reduce((s, t) => s + t.lastDurationSec, 0)
  const totalDurationMin = (totalDurationSec / 60).toFixed(1)

  const runNumber = 8420 + runCount
  const passRate = selectedTests.length
    ? Math.round((passedTests.length / selectedTests.length) * 1000) / 10
    : 100
  const passSeries = useMemo(() => buildPassRateSeries(passRate, runNumber), [passRate, runNumber])

  const suiteBreakdown = (['Unit', 'Integration', 'Contract', 'E2E'] as const)
    .map((suite) => {
      const inSuite = selectedTests.filter((t) => t.suite === suite)
      return {
        suite,
        total: inSuite.length,
        passed: inSuite.filter((t) => t.lastRunStatus === 'passed').length,
        failed: inSuite.filter((t) => t.lastRunStatus === 'failed').length,
        flaky: inSuite.filter((t) => t.lastRunStatus === 'flaky').length,
        other: inSuite.filter((t) => t.lastRunStatus === 'skipped').length,
      }
    })
    .filter((row) => row.total > 0)

  return (
    <div className="space-y-8">
      <SectionHeader
        kicker={`CI Pipeline Runner · Run #${runNumber}`}
        title="Test Execution"
        highlight="Results"
        description="Inspect targeted regression execution outcomes, failure stack traces, implicated PR lines, and AI root-cause hypotheses."
        actions={
          <>
            <SecondaryButton size="sm" onClick={() => onNavigate('code-comparison')}>
              <FileCode2 className="h-4 w-4" />
              View Implicated Diff
            </SecondaryButton>
            <PrimaryButton
              size="sm"
              onClick={onRunSelectedTests}
              disabled={isRunning || selectedTests.length === 0}
            >
              {isRunning ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-current" />
              )}
              {isRunning ? `Executing (${runProgressPct}%)` : 'Re-Run Selected Suite'}
            </PrimaryButton>
          </>
        }
      />

      {/* Live Execution Progress Bar */}
      {isRunning && (
        <Card padded="sm" className="border-sage/50! bg-sage/8! space-y-2.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-2 font-semibold text-ink">
              <Terminal className="h-4 w-4 text-sage-deep" />
              Dispatching {selectedTests.length} targeted tests across parallel Ephemeral Workers...
            </span>
            <span className="font-mono-code font-bold text-sage-ink">{runProgressPct}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-paper border border-line overflow-hidden">
            <div
              className="h-full bg-sage transition-all duration-150"
              style={{ width: `${runProgressPct}%` }}
            />
          </div>
        </Card>
      )}

      {/* Pass-rate trend + Summary KPIs */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-5 xl:col-span-4">
          <PeakChartPanel
            series={passSeries}
            defaultPeriod="Last 12 runs"
            title="Targeted suite pass rate"
            valueSuffix="%"
            decimals={1}
            updatedText={isRunning ? `Run #${runNumber} · executing` : `Run #${runNumber} · complete`}
            tone="sage"
            formatValue={(v) => `${v.toFixed(1)}%`}
            maxWidth={420}
          />
        </div>

        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card padded="sm">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                Executed Selected
              </div>
              <div className="mt-2 text-[28px] font-bold text-ink">{selectedTests.length}</div>
              <div className="mt-1 text-[12px] text-muted">
                {(changeset.totalRepoTests - selectedTests.length).toLocaleString()} skipped by AI
              </div>
            </Card>
            <Card padded="sm">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                Passed
              </div>
              <div className="mt-2 flex items-center gap-2 text-[28px] font-bold text-ink">
                <CheckCircle2 className="h-5 w-5 text-sage" />
                {passedTests.length}
              </div>
              <div className="mt-1 text-[12px] text-muted">
                {selectedTests.length
                  ? Math.round((passedTests.length / selectedTests.length) * 100)
                  : 0}
                % pass rate
              </div>
            </Card>
            <Card padded="sm">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                Regressions Caught
              </div>
              <div className="mt-2 flex items-center gap-2 text-[28px] font-bold text-danger-ink">
                <AlertCircle className="h-5 w-5 text-danger" />
                {failedTests.length}
              </div>
              <div className="mt-1 text-[12px] text-muted">
                {flakyTests.length} flaky quarantined
              </div>
            </Card>
            <Card padded="sm">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                Wall-Clock Time
              </div>
              <div className="mt-2 flex items-center gap-2 text-[28px] font-bold text-ink">
                <Clock className="h-5 w-5 text-sage-deep" />
                {totalDurationMin}m
              </div>
              <div className="mt-1 text-[12px] text-muted">
                Saved {(changeset.fullSuiteMinutes - Number(totalDurationMin)).toFixed(1)}m vs full
              </div>
            </Card>
          </div>

          {/* Outcome by suite */}
          <Card padded="sm" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-sage-deep">
                Outcome by Suite
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-sage" /> Passed
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-danger" /> Failed
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-ochre" /> Flaky
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {suiteBreakdown.map((row) => (
                <div key={row.suite} className="grid grid-cols-[96px_minmax(0,1fr)_64px] items-center gap-3">
                  <span className="text-[13px] font-semibold text-ink">{row.suite}</span>
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-well">
                    {(
                      [
                        ['passed', 'bg-sage'],
                        ['failed', 'bg-danger'],
                        ['flaky', 'bg-ochre'],
                        ['other', 'bg-faint'],
                      ] as const
                    ).map(([key, cls]) =>
                      row[key] > 0 ? (
                        <div
                          key={key}
                          className={`h-full ${cls} border-r border-paper last:border-r-0`}
                          style={{ width: `${(row[key] / row.total) * 100}%` }}
                        />
                      ) : null
                    )}
                  </div>
                  <span className="text-right font-mono-code text-[12px] text-muted">
                    {row.passed}/{row.total}
                  </span>
                </div>
              ))}
              {suiteBreakdown.length === 0 && (
                <div className="py-4 text-center text-[13px] text-muted">
                  No tests selected for this run.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Results Table + Diagnostics Inspector */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card padded="none" className="xl:col-span-6 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-mist px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'all', label: `All (${selectedTests.length})` },
                  { id: 'failed', label: `Failed (${failedTests.length})` },
                  { id: 'passed', label: `Passed (${passedTests.length})` },
                  { id: 'flaky', label: `Flaky (${flakyTests.length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`rounded-[10px] px-3 py-1.5 text-[12px] font-semibold transition-colors cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-sage text-white shadow-[0_4px_12px_-6px_rgba(47,69,53,0.6)]'
                      : 'border border-line bg-paper text-muted hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-line">
            {filtered.map((test, idx) => {
              const isFocused = focusedTest?.id === test.id
              const isPendingInRun =
                isRunning && ((idx + 1) / Math.max(1, filtered.length)) * 100 > runProgressPct
              return (
                <button
                  key={test.id}
                  type="button"
                  onClick={() => setFocusedTestId(test.id)}
                  className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors cursor-pointer ${
                    isFocused ? 'bg-sage/10 shadow-[inset_3px_0_0_var(--s7-sage)]' : 'hover:bg-mist'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-code text-[12px] font-bold text-sage-deep">
                        {test.id}
                      </span>
                      <span className="text-[11px] text-muted">· {test.suite}</span>
                    </div>
                    <div className="mt-0.5 text-[13.5px] font-semibold text-ink truncate">
                      {test.name}
                    </div>
                    <div className="mt-0.5 font-mono-code text-[11px] text-muted">
                      {test.lastDurationSec}s · {test.targetModule}
                    </div>
                  </div>
                  <TestStatusBadge status={isPendingInRun ? 'running' : test.lastRunStatus} />
                </button>
              )
            })}
            {filtered.length === 0 && (
              <div className="px-6 py-12 text-center text-[14px] text-muted">
                No test results in this filter category.
              </div>
            )}
          </div>
        </Card>

        {/* Diagnostics & Root Cause Panel */}
        <Card className="xl:col-span-6 space-y-5">
          {focusedTest ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Chip>{focusedTest.id}</Chip>
                    <TestStatusBadge status={focusedTest.lastRunStatus} />
                  </div>
                  <h2 className="pt-1 text-[18px] font-bold text-ink">{focusedTest.name}</h2>
                  <div className="font-mono-code text-[12px] text-muted">
                    {focusedTest.filePath}
                  </div>
                </div>
              </div>

              {focusedTest.failureDiagnostic ? (
                <div className="space-y-5">
                  {/* AI Root Cause Hypothesis */}
                  <div className="rounded-[16px] border border-sage/35 bg-sage/8 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-sage-ink">
                      <Sparkles className="h-3.5 w-3.5" />
                      AI Root-Cause Attribution
                    </div>
                    <p className="text-[14px] leading-[22px] text-ink">
                      {focusedTest.failureDiagnostic.aiRootCause}
                    </p>
                    <div className="pt-1 font-mono-code text-[12px] text-sage-deep">
                      Implicated change: {focusedTest.failureDiagnostic.implicatedFile}:
                      {focusedTest.failureDiagnostic.implicatedLine}
                    </div>
                  </div>

                  {/* Assertion Diff */}
                  <div className="rounded-[14px] border border-line bg-mist p-4 space-y-2.5 font-mono-code text-[12px]">
                    <div className="text-muted">
                      Assertion:{' '}
                      <span className="text-ink">{focusedTest.failureDiagnostic.assertion}</span>
                    </div>
                    <div className="text-ink-soft">
                      Expected: <span className="text-sage-ink">{focusedTest.failureDiagnostic.expected}</span>
                    </div>
                    <div className="text-danger-ink">
                      Actual: <span>{focusedTest.failureDiagnostic.actual}</span>
                    </div>
                  </div>

                  {/* Stack Trace */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                      Execution Stack Trace
                    </div>
                    <pre className="overflow-x-auto rounded-[14px] border border-danger/20 bg-danger/5 p-4 font-mono-code text-[11.5px] leading-[20px] text-danger-ink">
                      {focusedTest.failureDiagnostic.stackTrace.join('\n')}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-[16px] border border-line bg-mist p-5 space-y-2">
                    <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-sage-deep">
                      Verification Passed
                    </div>
                    <p className="text-[14px] leading-[22px] text-ink-soft">
                      Test verified <span className="font-mono-code text-ink">{focusedTest.linkedEntities.join(', ')}</span>{' '}
                      in <strong className="text-ink">{focusedTest.lastDurationSec}s</strong> via{' '}
                      {focusedTest.reason}.
                    </p>
                  </div>
                  <pre className="overflow-x-auto rounded-[10px] border border-[#27272A] bg-[#070708] p-4 font-mono text-[12px] leading-[20px] text-[#85858F]">
                    {`[codesentra-runner] worker=ephemeral-04 suite=${focusedTest.suite}
[codesentra-runner] target=${focusedTest.filePath}
[codesentra-runner] status=${focusedTest.lastRunStatus.toUpperCase()} duration=${focusedTest.lastDurationSec}s
[codesentra-runner] confidence=${Math.round(focusedTest.confidence * 100)}% reason="${focusedTest.reason}"`}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-[14px] text-muted">
              Select a test case to inspect its execution logs and diagnostics.
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
