import React, { useMemo } from 'react'
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileDiff,
  GitBranch,
  Layers,
  Play,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react'
import type { ChangesetAnalysis, PageId, RegressionTestCase } from '../../types/analysis'
import { buildRegressionsCaughtSeries, buildRuntimeSavedSeries } from '../../data/chartSeries'
import { PeakChartPanel } from '../charts/PeakChartPanel'
import { Card, Chip, PrimaryButton, RiskBadge, SecondaryButton } from '../ui/Primitives'

interface DashboardPageProps {
  changeset: ChangesetAnalysis
  allChangesets: ChangesetAnalysis[]
  selectedTests: RegressionTestCase[]
  onSelectChangeset: (id: string) => void
  onNavigate: (page: PageId) => void
  onRunSelectedTests: () => void
}

export function DashboardPage({
  changeset,
  allChangesets,
  selectedTests,
  onSelectChangeset,
  onNavigate,
  onRunSelectedTests,
}: DashboardPageProps) {
  const selectedDurationSec = selectedTests.reduce((acc, t) => acc + t.estimatedSec, 0)
  const selectedDurationMin = Math.max(0.4, selectedDurationSec / 60)
  const timeSavedPct = Math.round(
    ((changeset.fullSuiteMinutes - selectedDurationMin) / changeset.fullSuiteMinutes) * 100
  )
  const reductionPct = Math.round(
    ((changeset.totalRepoTests - selectedTests.length) / changeset.totalRepoTests) * 100
  )

  const failedCount = selectedTests.filter((t) => t.lastRunStatus === 'failed').length

  const runtimeSeries = useMemo(
    () => buildRuntimeSavedSeries(timeSavedPct, changeset.prNumber),
    [timeSavedPct, changeset.prNumber]
  )
  const caughtSeries = useMemo(() => buildRegressionsCaughtSeries(failedCount), [failedCount])

  const pulseRows = [
    { label: 'Selection precision', value: '94.2%', delta: '+1.8 pts', up: true },
    { label: 'Escaped defects · 30d', value: '2', delta: '−3 vs prior', up: false },
    { label: 'Median selection latency', value: '1.4s', delta: '−0.3s', up: false },
    { label: 'Flaky suites quarantined', value: '3', delta: 'stable', up: null },
  ]

  return (
    <div className="space-y-10">
      {/* CodeSentra Editorial Split Hero */}
      <section className="grid grid-cols-1 gap-8 xl:grid-cols-12 xl:items-stretch">
        <div className="xl:col-span-7 flex flex-col justify-between space-y-6 py-2">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Chip>
                <Sparkles className="h-3.5 w-3.5" />
                AI Impact Engine · {changeset.prNumber}
              </Chip>
              <span className="font-mono text-[13px] text-muted font-normal">
                {changeset.branch} → {changeset.baseBranch} ({changeset.commitSha})
              </span>
            </div>

            <h1 className="text-[28px] sm:text-[32px] lg:text-[36px] font-bold tracking-tight leading-[1.2] text-ink">
              Ship faster with{' '}
              <span className="text-sage">precision regression</span> intelligence.
            </h1>

            <p className="text-[15px] sm:text-[16px] leading-[26px] text-ink-soft max-w-2xl font-normal">
              {changeset.title}
            </p>

            <div className="rounded-[16px] border border-line bg-paper p-5 shadow-[inset_3px_0_0_#4169E1]">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-sage-deep">
                  AI Change Synthesis
                </span>
                <span className="text-[12px] text-muted font-normal">
                  Author: <strong className="text-ink-soft font-medium">{changeset.author}</strong> ·{' '}
                  {changeset.timestamp}
                </span>
              </div>
              <p className="text-[14px] sm:text-[15px] leading-[24px] text-muted font-normal">{changeset.aiSummary}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <PrimaryButton size="hero" onClick={onRunSelectedTests}>
              <Play className="h-4 w-4 fill-current" />
              Run {selectedTests.length} Selected Tests
            </PrimaryButton>
            <SecondaryButton size="hero" onClick={() => onNavigate('code-comparison')}>
              <FileDiff className="h-4 w-4" />
              Inspect Code Diff
            </SecondaryButton>
          </div>
        </div>

        {/* Featured Right Panel */}
        <Card className="xl:col-span-5 flex flex-col justify-between space-y-6" padded="lg">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
                Regression Compression
              </span>
              <RiskBadge level={changeset.overallRiskLevel} score={changeset.overallRiskScore} />
            </div>

            <div className="flex items-baseline justify-between gap-4 border-b border-line pb-5">
              <div>
                <div className="text-[40px] font-bold tracking-tight text-ink leading-none">
                  {timeSavedPct}%
                </div>
                <div className="mt-2 text-[13px] sm:text-[14px] text-muted font-normal">
                  CI pipeline runtime saved vs. full suite
                </div>
              </div>
              <div className="text-right">
                <div className="text-[24px] font-semibold text-sage-deep">
                  {changeset.predictedDefectCapturePct}%
                </div>
                <div className="text-[12px] text-muted font-normal">Predicted defect capture</div>
              </div>
            </div>

            {/* Visual Suite Comparison Bar */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[13px] mb-1.5">
                  <span className="text-muted font-normal">Full Regression Baseline</span>
                  <span className="font-mono text-[12.5px] text-ink-soft font-normal">
                    {changeset.totalRepoTests.toLocaleString()} tests · {changeset.fullSuiteMinutes}m
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-well border border-line overflow-hidden">
                  <div className="h-full w-full bg-faint" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[13px] mb-1.5">
                  <span className="text-ink font-medium">AI-Selected Targeted Suite</span>
                  <span className="font-mono text-[12.5px] text-sage-deep font-medium">
                    {selectedTests.length} tests · {selectedDurationMin.toFixed(1)}m
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-well border border-line overflow-hidden">
                  <div
                    className="h-full rounded-full bg-sage"
                    style={{
                      width: `${Math.max(8, Math.round((selectedDurationMin / changeset.fullSuiteMinutes) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Deep-Dive Navigation Links */}
          <div className="space-y-2.5 pt-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Deep-Dive Workflows
            </div>
            {[
              {
                label: 'Interactive Dependency Graph',
                meta: `${changeset.graphNodes.length} nodes · ${changeset.graphEdges.length} edges`,
                page: 'dependency-graph' as PageId,
              },
              {
                label: 'Explainable AI Risk Breakdown',
                meta: `${changeset.riskFactors.length} weighted signals`,
                page: 'ai-risk' as PageId,
              },
              {
                label: 'Tune Selection Threshold & Overrides',
                meta: `${reductionPct}% test reduction`,
                page: 'test-selection' as PageId,
              },
            ].map((row) => (
              <button
                key={row.page}
                type="button"
                onClick={() => onNavigate(row.page)}
                className="group flex w-full items-center justify-between rounded-[12px] border border-line bg-mist hover:border-sage/50 hover:bg-paper px-4 py-3 text-left transition-colors cursor-pointer"
              >
                <div>
                  <div className="text-[14px] font-medium text-ink group-hover:text-sage-ink">
                    {row.label}
                  </div>
                  <div className="text-[12px] text-muted font-normal">{row.meta}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted group-hover:text-ink group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>
        </Card>
      </section>

      {/* Key Metrics Row */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Card padded="sm" className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
              Impacted Symbols
            </span>
            <Layers className="h-4 w-4 text-sage-deep" />
          </div>
          <div className="text-[28px] sm:text-[32px] font-bold text-ink leading-none">
            {changeset.impactedEntities.length}
          </div>
          <div className="text-[13px] text-muted font-normal">
            Across {new Set(changeset.impactedEntities.map((e) => e.module)).size} modules (0–2 hop
            AST)
          </div>
        </Card>

        <Card padded="sm" className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
              Predicted Risk
            </span>
            <ShieldAlert
              className={`h-4 w-4 ${
                changeset.overallRiskScore >= 70 ? 'text-danger' : 'text-sage-deep'
              }`}
            />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] sm:text-[32px] font-bold text-ink leading-none">
              {changeset.overallRiskScore}
            </span>
            <span className="text-[14px] text-muted font-normal">/ 100</span>
          </div>
          <div className="text-[13px] text-muted font-normal">
            {changeset.mitigations.filter((m) => !m.completed).length} open AI mitigations
          </div>
        </Card>

        <Card padded="sm" className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
              Selected Tests
            </span>
            <Zap className="h-4 w-4 text-sage-deep" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] sm:text-[32px] font-bold text-ink leading-none">
              {selectedTests.length}
            </span>
            <span className="text-[14px] text-muted font-normal">
              of {changeset.totalRepoTests.toLocaleString()}
            </span>
          </div>
          <div className="text-[13px] text-muted font-normal">
            {failedCount > 0 ? (
              <span className="text-danger-ink font-medium">
                {failedCount} failing regression signal detected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-ink-soft">
                <CheckCircle2 className="h-3.5 w-3.5 text-sage-deep" /> All selected suites green
              </span>
            )}
          </div>
        </Card>

        <Card padded="sm" className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
              Estimated Duration
            </span>
            <Clock className="h-4 w-4 text-sage-deep" />
          </div>
          <div className="text-[28px] sm:text-[32px] font-bold text-ink leading-none">
            {selectedDurationMin.toFixed(1)}m
          </div>
          <div className="text-[13px] text-muted font-normal">
            Down from {changeset.fullSuiteMinutes}m full suite
          </div>
        </Card>
      </section>

      {/* Delivery Pulse: PeakChart telemetry */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.85fr)] xl:items-stretch">
        <div>
          <PeakChartPanel
            series={runtimeSeries}
            defaultPeriod="Weekly"
            title="CI runtime saved"
            valueSuffix="%"
            updatedText={`Synced · ${changeset.commitSha}`}
            tone="sage"
          />
        </div>
        <div>
          <PeakChartPanel
            series={caughtSeries}
            defaultPeriod="Monthly"
            title="Regressions intercepted"
            updatedText="Live · CI telemetry"
            tone="moss"
            formatValue={(v) => `${Math.round(v)} caught`}
          />
        </div>

        <Card className="md:col-span-2 xl:col-span-1 flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-sage-deep">
              Delivery Pulse
            </div>
            <h2 className="text-[20px] sm:text-[22px] font-semibold leading-[1.3] text-ink">
              Selection is getting sharper every sprint.
            </h2>
            <p className="text-[14px] leading-[22px] text-muted font-normal">
              Hover either chart to read individual days, or switch the period from the pill in its
              top-right corner. Both lines update with the active changeset.
            </p>
          </div>

          <dl className="divide-y divide-line border-y border-line">
            {pulseRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 py-3">
                <dt className="text-[13px] text-ink-soft font-normal">{row.label}</dt>
                <dd className="flex shrink-0 items-baseline gap-2.5">
                  <span className="text-[18px] font-semibold text-ink">{row.value}</span>
                  <span
                    className={`inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold ${
                      row.up === null ? 'text-muted' : 'text-sage-deep'
                    }`}
                  >
                    {row.up === true && <TrendingUp className="h-3 w-3" />}
                    {row.up === false && <TrendingDown className="h-3 w-3" />}
                    {row.delta}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          <SecondaryButton size="sm" onClick={() => onNavigate('reports')} className="w-full">
            Open Engineering Reports <ArrowRight className="h-3.5 w-3.5" />
          </SecondaryButton>
        </Card>
      </section>

      {/* Blast Radius Hotspots + PR Queue */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Blast Radius Table */}
        <Card className="lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-sage-deep">
                Blast Radius Breakdown
              </div>
              <h2 className="mt-1 text-[20px] sm:text-[22px] font-semibold text-ink">
                Highest-Impact Entities
              </h2>
            </div>
            <SecondaryButton size="sm" onClick={() => onNavigate('impact-analysis')}>
              View All <ArrowRight className="h-3.5 w-3.5" />
            </SecondaryButton>
          </div>

          <div className="space-y-3">
            {changeset.impactedEntities.slice(0, 5).map((entity) => (
              <div
                key={entity.id}
                onClick={() => onNavigate('impact-analysis')}
                className="group rounded-[14px] border border-line bg-mist hover:border-sage/60 p-4 transition-colors cursor-pointer"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Activity className="h-4 w-4 text-sage-deep shrink-0" />
                    <span className="font-mono text-[13.5px] font-medium text-ink truncate">
                      {entity.name}
                    </span>
                    <span className="rounded-full border border-line bg-paper px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
                      {entity.hopDistance === 0 ? 'DIRECT' : `${entity.hopDistance}-HOP`}
                    </span>
                  </div>
                  <RiskBadge level={entity.severity} />
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted font-normal">
                  <span className="font-mono text-[12px] truncate">{entity.filePath}</span>
                  <span className="text-ink-soft">
                    {Math.round(entity.confidence * 100)}% confidence · {entity.coveredByTests.length}{' '}
                    tests
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Analyzed PRs */}
        <Card className="lg:col-span-5 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-sage-deep">
                Changeset Queue
              </div>
              <h2 className="mt-1 text-[20px] sm:text-[22px] font-semibold text-ink">
                Recent Analyzed PRs
              </h2>
            </div>
            <SecondaryButton size="sm" onClick={() => onNavigate('reports')}>
              History
            </SecondaryButton>
          </div>

          <div className="space-y-3">
            {allChangesets.map((cs) => {
              const active = cs.id === changeset.id
              return (
                <button
                  key={cs.id}
                  type="button"
                  onClick={() => onSelectChangeset(cs.id)}
                  className={`w-full rounded-[16px] border p-4 text-left transition-all cursor-pointer ${
                    active
                      ? 'border-sage bg-sage/8 shadow-[0_0_0_1px_var(--s7-sage)]'
                      : 'border-line bg-mist hover:border-faint'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-sage-deep" />
                      <span className="text-[14px] font-semibold text-ink">{cs.prNumber}</span>
                      <span className="font-mono text-[12px] text-muted font-normal">
                        {cs.commitSha}
                      </span>
                    </div>
                    <RiskBadge level={cs.overallRiskLevel} score={cs.overallRiskScore} />
                  </div>
                  <div className="mt-2 text-[14px] text-ink-soft font-normal line-clamp-2">{cs.title}</div>
                  <div className="mt-3 flex items-center justify-between text-[12px] text-muted font-normal">
                    <span>
                      {cs.author} · {cs.timestamp}
                    </span>
                    <span className="text-sage-deep font-medium">
                      {active ? 'Active Context' : 'Switch →'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      </section>
    </div>
  )
}
