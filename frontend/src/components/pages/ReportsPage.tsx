import React, { useMemo, useState } from 'react'
import {
  BarChart3,
  Check,
  Download,
  FileText,
  ShieldCheck,
  TrendingDown,
} from 'lucide-react'
import type {
  ChangesetAnalysis,
  ModuleHotspot,
  ReportMetric,
  ReportMetricPoint,
} from '../../types/analysis'
import { REPORT_METRIC_META, buildReportSeries } from '../../data/chartSeries'
import { PeakChartPanel } from '../charts/PeakChartPanel'
import { Card, Chip, PrimaryButton, RiskBadge, SecondaryButton, SectionHeader } from '../ui/Primitives'

interface ReportsPageProps {
  changeset: ChangesetAnalysis
  allChangesets: ChangesetAnalysis[]
  trendData: ReportMetricPoint[]
  hotspots: ModuleHotspot[]
}

export function ReportsPage({
  changeset,
  allChangesets,
  trendData,
  hotspots,
}: ReportsPageProps) {
  const [exportFormat, setExportFormat] = useState<'markdown' | 'json' | 'csv'>('markdown')
  const [downloadedRecently, setDownloadedRecently] = useState(false)
  const [metric, setMetric] = useState<ReportMetric>('runtime')

  const latest = trendData[trendData.length - 1]
  const avgReduction = Math.round(
    ((latest.fullSuiteMins - latest.selectedSuiteMins) / latest.fullSuiteMins) * 100
  )

  const metricMeta = REPORT_METRIC_META[metric]
  const metricSeries = useMemo(() => buildReportSeries(trendData, metric), [trendData, metric])
  const formatMetric = (v: number) =>
    `${v.toLocaleString('en-US', {
      minimumFractionDigits: metricMeta.decimals,
      maximumFractionDigits: metricMeta.decimals,
    })}${metricMeta.suffix}`

  const buildReportPayload = () => {
    if (exportFormat === 'json') {
      return JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          activeChangeset: {
            prNumber: changeset.prNumber,
            branch: changeset.branch,
            riskScore: changeset.overallRiskScore,
            predictedDefectCapturePct: changeset.predictedDefectCapturePct,
            impactedEntities: changeset.impactedEntities.length,
            rankedTests: changeset.tests.length,
          },
          weeklyTrends: trendData,
          moduleHotspots: hotspots,
        },
        null,
        2
      )
    }
    if (exportFormat === 'csv') {
      const header = 'module,changes30d,avgRisk,defectDensity,testReductionPct,owner'
      const rows = hotspots.map(
        (h) => `${h.module},${h.changes30d},${h.avgRisk},${h.defectDensity},${h.testReductionPct},"${h.owner}"`
      )
      return [header, ...rows].join('\n')
    }
    return `# CodeSentra AI — Impact & Regression Report

**Changeset:** ${changeset.prNumber} (\`${changeset.branch}\`)  
**Commit:** \`${changeset.commitSha}\` · **Author:** ${changeset.author}  
**Predicted Risk Score:** ${changeset.overallRiskScore}/100 (${changeset.overallRiskLevel.toUpperCase()})  
**Defect Capture Efficiency:** ${changeset.predictedDefectCapturePct}%  
**Latest Weekly CI Runtime:** ${latest.selectedSuiteMins}m vs ${latest.fullSuiteMins}m full baseline (**${avgReduction}% saved**)

## Executive Summary
${changeset.aiSummary}

## Top Impacted Modules (30d)
${hotspots.map((h) => `- **${h.module}** (${h.owner}): Avg Risk ${h.avgRisk}, Test Reduction ${h.testReductionPct}%`).join('\n')}
`
  }

  const handleDownload = () => {
    const content = buildReportPayload()
    const ext = exportFormat === 'markdown' ? 'md' : exportFormat
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `codesentra-${changeset.id}-report.${ext}`
    a.click()
    URL.revokeObjectURL(url)
    setDownloadedRecently(true)
    setTimeout(() => setDownloadedRecently(false), 2500)
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        kicker="Engineering Intelligence & Audit"
        title="Impact &amp; CI"
        highlight="Reports"
        description="Measure cumulative CI compute savings, regression defect capture efficiency, and high-churn module hotspots across releases."
        actions={
          <PrimaryButton size="sm" onClick={handleDownload}>
            {downloadedRecently ? (
              <>
                <Check className="h-4 w-4" /> Exported .{exportFormat === 'markdown' ? 'md' : exportFormat}
              </>
            ) : (
              <>
                <Download className="h-4 w-4" /> Export Report
              </>
            )}
          </PrimaryButton>
        }
      />

      {/* Executive KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card padded="sm" className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            <span>Weekly CI Time Saved</span>
            <TrendingDown className="h-4 w-4 text-sage-deep" />
          </div>
          <div className="text-[28px] sm:text-[32px] font-bold text-ink">{avgReduction}%</div>
          <div className="text-[13px] text-muted font-normal">
            {latest.selectedSuiteMins}m avg vs {latest.fullSuiteMins}m full regression
          </div>
        </Card>

        <Card padded="sm" className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            <span>Defect Capture Rate</span>
            <ShieldCheck className="h-4 w-4 text-sage-deep" />
          </div>
          <div className="text-[28px] sm:text-[32px] font-bold text-sage-deep">{latest.defectCapturePct}%</div>
          <div className="text-[13px] text-muted font-normal">
            Across {trendData.reduce((s, d) => s + d.prsAnalyzed, 0)} PRs over 6 weeks
          </div>
        </Card>

        <Card padded="sm" className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            <span>Compute Hours Reclaimed</span>
            <BarChart3 className="h-4 w-4 text-sage-deep" />
          </div>
          <div className="text-[28px] sm:text-[32px] font-bold text-ink">584 hrs</div>
          <div className="text-[13px] text-muted font-normal">
            Estimated runner savings in current quarter
          </div>
        </Card>
      </div>

      {/* CI Telemetry: PeakChart + weekly ledger */}
      <Card className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-sage-deep">
              CI Telemetry
            </div>
            <h2 className="mt-1 text-[20px] sm:text-[22px] font-semibold text-ink">
              Regression Selection Performance
            </h2>
            <p className="mt-1 text-[13.5px] text-muted font-normal">
              Switch metrics to morph the chart; use the period pill on the chart for quarter and
              year views.
            </p>
          </div>
          <div
            role="tablist"
            aria-label="Telemetry metric"
            className="flex items-center gap-1 rounded-[12px] border border-line bg-mist p-1"
          >
            {(Object.keys(REPORT_METRIC_META) as ReportMetric[]).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={metric === m}
                onClick={() => setMetric(m)}
                className={`rounded-[9px] px-3.5 py-1.5 text-[12.5px] font-medium transition-colors cursor-pointer ${
                  metric === m
                    ? 'bg-paper text-ink border border-line shadow-[0_1px_2px_rgba(36,51,42,0.08)]'
                    : 'border border-transparent text-muted hover:text-ink'
                }`}
              >
                {REPORT_METRIC_META[m].label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
          <PeakChartPanel
            series={metricSeries}
            defaultPeriod="6 weeks"
            title={metricMeta.title}
            valueSuffix={metricMeta.suffix}
            decimals={metricMeta.decimals}
            updatedText={`Week ${latest.week} · synced`}
            tone="sage"
            formatValue={formatMetric}
            maxWidth={420}
          />

          {/* Weekly ledger: the active metric's column is highlighted */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              <span>Weekly Ledger · Full Suite vs. AI-Selected</span>
              <span className="font-mono normal-case tracking-normal text-[12px]">runtime in mins</span>
            </div>
            <div className="overflow-x-auto rounded-[16px] border border-line">
              <table className="w-full min-w-[520px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-mist text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                    <th className="px-4 py-3">Week</th>
                    <th className="px-3 py-3 text-right">Full</th>
                    <th className="px-3 py-3 text-right">AI</th>
                    <th className={`px-4 py-3 ${metric === 'runtime' ? 'text-sage-deep' : ''}`}>
                      Saved
                    </th>
                    <th className={`px-3 py-3 text-right ${metric === 'capture' ? 'text-sage-deep' : ''}`}>
                      Capture
                    </th>
                    <th className={`px-4 py-3 text-right ${metric === 'prs' ? 'text-sage-deep' : ''}`}>
                      PRs
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {trendData.map((pt) => {
                    const saved = Math.round(
                      ((pt.fullSuiteMins - pt.selectedSuiteMins) / pt.fullSuiteMins) * 100
                    )
                    const hl = 'bg-sage/8 font-medium text-sage-ink'
                    return (
                      <tr key={pt.week} className="bg-paper">
                        <td className="px-4 py-3 font-mono text-[12px] font-medium text-ink">
                          {pt.week}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-[12px] text-muted">
                          {pt.fullSuiteMins.toFixed(1)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-[12px] font-medium text-sage-deep">
                          {pt.selectedSuiteMins.toFixed(1)}
                        </td>
                        <td className={`px-4 py-3 ${metric === 'runtime' ? 'bg-sage/8' : ''}`}>
                          <div className="flex items-center gap-2.5">
                            <div className="h-1.5 w-full min-w-[56px] overflow-hidden rounded-full bg-well">
                              <div className="h-full rounded-full bg-sage" style={{ width: `${saved}%` }} />
                            </div>
                            <span className="font-mono text-[12px] font-medium text-ink">
                              {saved}%
                            </span>
                          </div>
                        </td>
                        <td
                          className={`px-3 py-3 text-right font-mono text-[12px] ${
                            metric === 'capture' ? hl : 'text-ink-soft'
                          }`}
                        >
                          {pt.defectCapturePct.toFixed(1)}%
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono text-[12px] ${
                            metric === 'prs' ? hl : 'text-ink-soft'
                          }`}
                        >
                          {pt.prsAnalyzed}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Runtime cut', value: `${avgReduction}%` },
                { label: 'Mins saved / wk', value: (latest.fullSuiteMins - latest.selectedSuiteMins).toFixed(1) },
                { label: 'PRs / wk', value: String(latest.prsAnalyzed) },
              ].map((item) => (
                <div key={item.label} className="rounded-[14px] border border-line bg-mist px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                    {item.label}
                  </div>
                  <div className="mt-1 text-[20px] font-semibold text-ink">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Export Builder */}
      <Card className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-sage-deep">
                  Audit Export
                </div>
                <h2 className="mt-1 text-[20px] font-semibold text-ink">Report Preview</h2>
              </div>
              <FileText className="h-5 w-5 text-sage-deep" />
            </div>
            <p className="text-[13.5px] leading-[21px] text-muted font-normal">
              Bundle the active changeset, weekly telemetry, and module hotspots into a portable
              audit artifact for release reviews.
            </p>
            <div className="flex items-center gap-2">
              {(['markdown', 'json', 'csv'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setExportFormat(fmt)}
                  className={`rounded-[10px] px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors cursor-pointer ${
                    exportFormat === fmt
                      ? 'bg-sage text-white shadow-[0_4px_12px_-6px_rgba(47,69,53,0.6)]'
                      : 'border border-line bg-mist text-muted hover:text-ink'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>
          <SecondaryButton size="sm" className="w-full" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Download {changeset.prNumber} {exportFormat.toUpperCase()} Report
          </SecondaryButton>
        </div>

        <pre className="h-64 overflow-auto rounded-[14px] border border-line bg-mist p-4 font-mono text-[12px] leading-[18px] text-ink-soft">
          {buildReportPayload()}
        </pre>
      </Card>

      {/* Module Hotspot Matrix + PR Audit Log */}
      <Card padded="none" className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-mist px-6 py-4">
          <div>
            <Chip>Module Hotspot Matrix</Chip>
            <h2 className="mt-2 text-[20px] font-semibold text-ink">
              30-Day Churn, Risk &amp; Selection Efficiency
            </h2>
          </div>
          <div className="text-[12px] text-muted font-normal">
            {allChangesets.length} active PR audits tracked
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-paper text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                <th className="px-6 py-3.5">Module</th>
                <th className="px-4 py-3.5">Owner</th>
                <th className="px-4 py-3.5">30d Changes</th>
                <th className="px-4 py-3.5">Avg Risk</th>
                <th className="px-4 py-3.5">Defect Density</th>
                <th className="px-4 py-3.5">Test Reduction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {hotspots.map((row) => (
                <tr key={row.module} className="hover:bg-mist">
                  <td className="px-6 py-4 font-mono text-[13.5px] font-medium text-ink">
                    {row.module}
                  </td>
                  <td className="px-4 py-4 text-[13px] text-ink-soft font-normal">{row.owner}</td>
                  <td className="px-4 py-4 font-mono text-[13px] text-ink">
                    {row.changes30d}
                  </td>
                  <td className="px-4 py-4">
                    <RiskBadge
                      level={row.avgRisk >= 70 ? 'high' : row.avgRisk >= 50 ? 'medium' : 'low'}
                      score={row.avgRisk}
                    />
                  </td>
                  <td className="px-4 py-4 font-mono text-[13px] text-ink-soft">
                    {row.defectDensity} / kLOC
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-24 rounded-full bg-well border border-line overflow-hidden">
                        <div
                          className="h-full bg-sage"
                          style={{ width: `${row.testReductionPct}%` }}
                        />
                      </div>
                      <span className="font-mono text-[12.5px] font-medium text-sage-deep">
                        {row.testReductionPct}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
