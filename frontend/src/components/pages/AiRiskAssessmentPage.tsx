import React, { useMemo } from 'react'
import {
  CheckCircle2,
  Circle,
  Cpu,
  FileWarning,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react'
import type { ChangesetAnalysis, PageId } from '../../types/analysis'
import { buildRiskTrajectorySeries } from '../../data/chartSeries'
import { PeakChartPanel } from '../charts/PeakChartPanel'
import { Card, Chip, PrimaryButton, RiskBadge, SecondaryButton, SectionHeader } from '../ui/Primitives'

interface AiRiskAssessmentPageProps {
  changeset: ChangesetAnalysis
  completedMitigations: Record<string, boolean>
  onToggleMitigation: (id: string) => void
  onNavigate: (page: PageId) => void
  onRunSelectedTests: () => void
}

export function AiRiskAssessmentPage({
  changeset,
  completedMitigations,
  onToggleMitigation,
  onNavigate,
  onRunSelectedTests,
}: AiRiskAssessmentPageProps) {
  const completedCount = changeset.mitigations.filter(
    (m) => completedMitigations[m.id] ?? m.completed
  ).length

  // Effective risk adjusts modestly as mitigations are checked off
  const uncompletedCount = changeset.mitigations.length - completedCount
  const adjustedRisk = Math.max(
    12,
    changeset.overallRiskScore -
      (changeset.mitigations.length - uncompletedCount) * 4 +
      0
  )

  const radius = 64
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (adjustedRisk / 100) * circumference

  const riskSeries = useMemo(
    () => buildRiskTrajectorySeries(changeset, adjustedRisk, completedCount),
    [changeset, adjustedRisk, completedCount]
  )

  return (
    <div className="space-y-8">
      <SectionHeader
        kicker={`Explainable ML Risk Scoring · ${changeset.prNumber}`}
        title="AI Risk"
        highlight="Assessment"
        description="Quantify merge risk from complexity deltas, historical defect density, AST fan-out, and uncovered branch heuristics."
        actions={
          <>
            <SecondaryButton size="sm" onClick={() => onNavigate('test-selection')}>
              Tune Test Threshold
            </SecondaryButton>
            <PrimaryButton size="sm" onClick={onRunSelectedTests}>
              Verify with Targeted Tests
            </PrimaryButton>
          </>
        }
      />

      {/* Top Risk Gauge + Factor Contributions */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-4 flex flex-col items-center justify-between text-center space-y-5" padded="lg">
          <div className="flex w-full items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Composite Risk Index
            </span>
            <RiskBadge level={changeset.overallRiskLevel} />
          </div>

          <div className="relative flex h-44 w-44 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="#e7ebe1"
                strokeWidth="14"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={adjustedRisk >= 75 ? '#b34a3c' : adjustedRisk >= 60 ? '#b07a2a' : '#5e7b62'}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-[40px] font-bold leading-none text-ink">
                {adjustedRisk}
              </span>
              <span className="mt-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
                of 100
              </span>
            </div>
          </div>

          <div className="w-full rounded-[14px] border border-line bg-mist p-4 text-left space-y-1.5">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted font-normal">Mitigation Readiness</span>
              <span className="font-medium text-ink">
                {completedCount}/{changeset.mitigations.length} resolved
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-well overflow-hidden border border-line">
              <div
                className="h-full bg-sage transition-all duration-300"
                style={{
                  width: `${
                    changeset.mitigations.length
                      ? Math.round((completedCount / changeset.mitigations.length) * 100)
                      : 100
                  }%`,
                }}
              />
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-8 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-sage-deep">
                SHAP Feature Attribution
              </div>
              <h2 className="mt-1 text-[20px] sm:text-[22px] font-semibold text-ink">
                Risk Signal Breakdown
              </h2>
            </div>
            <Chip variant="neutral">
              <Cpu className="h-3.5 w-3.5" />
              RiskNet-v4
            </Chip>
          </div>

          <div className="space-y-4">
            {changeset.riskFactors.map((factor) => (
              <div
                key={factor.id}
                className="rounded-[14px] border border-line bg-mist p-4 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-full border border-sage/30 bg-sage/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-sage-deep">
                      {factor.category}
                    </span>
                    <span className="text-[15px] font-medium text-ink">{factor.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[12px]">
                    <span className="text-muted font-normal">Weight: {factor.weightPct}%</span>
                    <span
                      className={`font-mono text-[13px] font-semibold ${
                        factor.score >= 75 ? 'text-danger-ink' : 'text-ink'
                      }`}
                    >
                      {factor.score}/100
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-well border border-line overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      factor.score >= 80 ? 'bg-danger' : 'bg-sage'
                    }`}
                    style={{ width: `${factor.score}%` }}
                  />
                </div>
                <p className="text-[13px] leading-[20px] text-muted font-normal">{factor.explanation}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Pre-Merge Mitigation Checklist + Risk Trajectory */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-sage-deep">
                Interactive Review Gate
              </div>
              <h2 className="mt-1 text-[20px] sm:text-[22px] font-semibold text-ink">
                AI Recommended Mitigations
              </h2>
            </div>
            <ShieldAlert className="h-5 w-5 text-sage-deep" />
          </div>

          <div className="space-y-3">
            {changeset.mitigations.map((item) => {
              const checked = completedMitigations[item.id] ?? item.completed
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onToggleMitigation(item.id)}
                  className={`flex w-full items-start gap-3.5 rounded-[14px] border p-4 text-left transition-colors cursor-pointer ${
                    checked
                      ? 'border-line bg-mist/60 opacity-75'
                      : 'border-line bg-paper hover:border-sage/60 shadow-[0_1px_2px_rgba(36,51,42,0.05)]'
                  }`}
                >
                  {checked ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-sage shrink-0" />
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 text-faint shrink-0" />
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                          item.priority === 'P0'
                            ? 'bg-danger/10 text-danger-ink border border-danger/35'
                            : item.priority === 'P1'
                              ? 'bg-ochre/12 text-ochre-ink border border-ochre/35'
                              : 'bg-sage/10 text-sage-ink border border-sage/30'
                        }`}
                      >
                        {item.priority}
                      </span>
                      <span
                        className={`text-[14px] font-medium ${
                          checked ? 'line-through text-muted' : 'text-ink'
                        }`}
                      >
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[13px] text-muted font-normal">{item.detail}</p>
                    <div className="font-mono text-[12px] text-sage-deep font-normal">
                      {item.targetFile}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

        <Card className="lg:col-span-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-sage-deep">
                Historical Context
              </div>
              <h2 className="mt-1 text-[20px] sm:text-[22px] font-semibold text-ink">
                File Risk &amp; Trajectory
              </h2>
            </div>
            <TrendingUp className="h-5 w-5 text-sage-deep" />
          </div>

          {/* Risk trajectory (PeakChart) */}
          <div className="space-y-3">
            <p className="text-[13px] leading-[20px] text-muted font-normal">
              Predicted risk index across consecutive repository PRs. The latest point tracks the
              mitigations you resolve on the left.
            </p>
            <PeakChartPanel
              series={riskSeries}
              defaultPeriod="Recent PRs"
              title="Predicted risk index"
              updatedText="RiskNet-v4 · scored now"
              tone="clay"
              formatValue={(v) => `Risk ${Math.round(v)}`}
              maxWidth={420}
            />
          </div>

          {/* Per-file risk list */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              <FileWarning className="h-3.5 w-3.5 text-sage-deep" />
              Modified File Risk Matrix
            </div>
            {changeset.diffFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between gap-3 rounded-[12px] border border-line bg-mist px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="font-mono text-[12.5px] font-medium text-ink truncate">
                    {file.path}
                  </div>
                  <div className="text-[11px] text-muted font-normal">
                    +{file.additions} / -{file.deletions} lines · {file.symbols.length} symbols
                  </div>
                </div>
                <RiskBadge level={file.riskLevel} score={file.riskScore} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
