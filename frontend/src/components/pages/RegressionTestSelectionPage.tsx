import React, { useMemo, useState } from 'react'
import {
  CheckSquare,
  Clock,
  Filter,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Square,
} from 'lucide-react'
import type { ChangesetAnalysis, RegressionTestCase, TestSuiteType } from '../../types/analysis'
import { buildThresholdSweepSeries, projectCapture, projectRuntimeSaved } from '../../data/chartSeries'
import { PeakChartPanel } from '../charts/PeakChartPanel'
import { Card, Chip, PrimaryButton, SecondaryButton, SectionHeader, TestStatusBadge } from '../ui/Primitives'

interface RegressionTestSelectionPageProps {
  changeset: ChangesetAnalysis
  threshold: number
  onThresholdChange: (val: number) => void
  manualOverrides: Record<string, boolean>
  onToggleManualOverride: (testId: string, nextSelected: boolean) => void
  onResetOverrides: () => void
  selectedTests: RegressionTestCase[]
  globalQuery: string
  onRunSelectedTests: () => void
}

export function RegressionTestSelectionPage({
  changeset,
  threshold,
  onThresholdChange,
  manualOverrides,
  onToggleManualOverride,
  onResetOverrides,
  selectedTests,
  globalQuery,
  onRunSelectedTests,
}: RegressionTestSelectionPageProps) {
  const [suiteFilter, setSuiteFilter] = useState<'All' | TestSuiteType>('All')
  const [showOnlySelected, setShowOnlySelected] = useState(false)

  const selectedIds = new Set(selectedTests.map((t) => t.id))
  const totalSec = selectedTests.reduce((acc, t) => acc + t.estimatedSec, 0)
  const totalMin = Math.max(0.2, totalSec / 60)
  // Shared with the threshold chart so the tiles and the PeakChart always agree.
  const timeSavedPct = projectRuntimeSaved(selectedTests, changeset.fullSuiteMinutes)
  const estimatedCapture = projectCapture(selectedTests)
  const sweepSeries = useMemo(
    () => buildThresholdSweepSeries(changeset, selectedTests),
    [changeset, selectedTests]
  )

  const filteredTests = changeset.tests.filter((t) => {
    if (suiteFilter !== 'All' && t.suite !== suiteFilter) return false
    if (showOnlySelected && !selectedIds.has(t.id)) return false
    if (
      globalQuery.trim() &&
      !t.name.toLowerCase().includes(globalQuery.toLowerCase()) &&
      !t.id.toLowerCase().includes(globalQuery.toLowerCase()) &&
      !t.targetModule.toLowerCase().includes(globalQuery.toLowerCase())
    ) {
      return false
    }
    return true
  })

  const presets = [
    { label: 'Fast PR Gate', threshold: 0.85, desc: 'Ultra-fast core path sanity' },
    { label: 'Balanced CI', threshold: 0.72, desc: 'Optimal speed vs capture' },
    { label: 'Deep Release Safety', threshold: 0.55, desc: 'Broad transitive coverage' },
  ]

  return (
    <div className="space-y-8">
      <SectionHeader
        kicker={`AI Test Selector · ${changeset.prNumber}`}
        title="Regression Test"
        highlight="Selection"
        description="Adjust confidence thresholds or manually override test cases. CodeSentra AI ranks tests by AST proximity, co-failure history, and semantic impact."
        actions={
          <>
            {Object.keys(manualOverrides).length > 0 && (
              <SecondaryButton size="sm" onClick={onResetOverrides}>
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Overrides
              </SecondaryButton>
            )}
            <PrimaryButton
              size="sm"
              onClick={onRunSelectedTests}
              disabled={selectedTests.length === 0}
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Execute {selectedTests.length} Tests
            </PrimaryButton>
          </>
        }
      />

      {/* Strategy + live projection + threshold sweep (PeakChart) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-stretch">
        <Card className="xl:col-span-8 flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-sage-deep" />
              <span className="text-[14px] font-medium text-ink">
                Selection Strategy &amp; Confidence Cutoff
              </span>
            </div>
            <Chip>
              <Sparkles className="h-3 w-3" />
              Threshold: {Math.round(threshold * 100)}%
            </Chip>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {presets.map((p) => {
              const active = Math.abs(threshold - p.threshold) < 0.02
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => onThresholdChange(p.threshold)}
                  className={`rounded-[14px] border p-3.5 text-left transition-all cursor-pointer ${
                    active
                      ? 'border-sage bg-sage/10'
                      : 'border-line bg-mist hover:border-faint'
                  }`}
                >
                  <div className="text-[13.5px] font-medium text-ink">{p.label}</div>
                  <div className="mt-1 text-[12px] text-muted font-normal">{p.desc}</div>
                  <div className="mt-2 font-mono text-[12px] text-sage-deep font-medium">
                    ≥ {Math.round(p.threshold * 100)}% confidence
                  </div>
                </button>
              )
            })}
          </div>

          <div className="rounded-[14px] border border-line bg-mist p-4 space-y-2.5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-ink-soft font-medium">
                Minimum Impact Confidence Score
              </span>
              <span className="font-mono text-[13px] font-semibold text-sage-deep">
                {threshold.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              aria-label="Minimum Impact Confidence Score"
              min={0.5}
              max={0.95}
              step={0.01}
              value={threshold}
              onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
              className="s7-range w-full"
            />
            <div className="flex justify-between text-[11px] text-muted font-normal">
              <span>0.50 (Broadest Recall)</span>
              <span>0.72 (Recommended)</span>
              <span>0.95 (Strict Direct Only)</span>
            </div>
          </div>

          {/* Live projection */}
          <div className="mt-auto space-y-3 border-t border-line pt-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-sage-deep">
              Live Suite Tradeoff Projection
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                {
                  label: 'Selected',
                  value: String(selectedTests.length),
                  aside: `/ ${changeset.tests.length}`,
                  tone: 'text-ink',
                },
                { label: 'Defect capture', value: `${estimatedCapture}%`, tone: 'text-sage-deep' },
                { label: 'Est. runtime', value: `${totalMin.toFixed(1)}m`, tone: 'text-ink', icon: true },
                { label: 'CI time saved', value: `${timeSavedPct}%`, tone: 'text-ink' },
              ].map((tile) => (
                <div key={tile.label} className="rounded-[14px] border border-line bg-mist px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                    {tile.label}
                  </div>
                  <div className={`mt-1 flex items-baseline gap-1.5 text-[24px] font-bold ${tile.tone}`}>
                    {tile.icon && <Clock className="h-3.5 w-3.5 self-center text-sage-deep" />}
                    {tile.value}
                    {tile.aside && (
                      <span className="text-[13px] font-normal text-muted">{tile.aside}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-[12.5px] text-muted font-normal">
              Skips{' '}
              <strong className="text-ink font-medium">
                {(changeset.totalRepoTests - selectedTests.length).toLocaleString()}
              </strong>{' '}
              unaffected regression specs across unrelated services.
            </div>
          </div>
        </Card>

        <div className="xl:col-span-4 flex flex-col gap-3">
          <PeakChartPanel
            series={sweepSeries}
            defaultPeriod="Runtime"
            title="Runtime saved"
            updatedText="Cutoff sweep · 0.50 → 0.95"
            tone="sage"
            maxWidth={380}
          />
          <p className="px-1 text-center text-[12.5px] leading-[19px] text-muted">
            The line sweeps every confidence cutoff; the headline follows your slider and overrides.
            Switch to Capture or Suite size from the chart&apos;s pill.
          </p>
        </div>
      </div>

      {/* Filter Bar + Test Candidate Table */}
      <Card padded="none" className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-mist px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted mr-1" />
            {(['All', 'Unit', 'Integration', 'Contract', 'E2E'] as const).map((suite) => (
              <button
                key={suite}
                type="button"
                onClick={() => setSuiteFilter(suite)}
                className={`rounded-[10px] px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer ${
                  suiteFilter === suite
                    ? 'bg-sage text-white shadow-[0_4px_12px_-6px_rgba(47,69,53,0.6)]'
                    : 'border border-line bg-paper text-muted hover:text-ink'
                }`}
              >
                {suite}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowOnlySelected(!showOnlySelected)}
            className={`rounded-[10px] border px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer ${
              showOnlySelected
                ? 'border-sage bg-sage/10 text-ink'
                : 'border-line bg-paper text-muted hover:text-ink'
            }`}
          >
            {showOnlySelected ? 'Showing Selected Only' : 'Show All Candidates'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-paper text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                <th className="w-12 px-5 py-3.5">Pick</th>
                <th className="px-4 py-3.5">Test Case</th>
                <th className="px-4 py-3.5">Suite</th>
                <th className="px-4 py-3.5">Selection Rationale</th>
                <th className="px-4 py-3.5">Confidence</th>
                <th className="px-4 py-3.5">Est. Time</th>
                <th className="px-4 py-3.5">Last Signal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredTests.map((test) => {
                const isSelected = selectedIds.has(test.id)
                const isOverridden = manualOverrides[test.id] !== undefined
                return (
                  <tr
                    key={test.id}
                    onClick={() => onToggleManualOverride(test.id, !isSelected)}
                    className={`transition-colors cursor-pointer ${
                      isSelected ? 'bg-sage/8 hover:bg-sage/12' : 'hover:bg-mist opacity-70'
                    }`}
                  >
                    <td className="px-5 py-4">
                      {isSelected ? (
                        <CheckSquare className="h-4.5 w-4.5 text-sage-deep" />
                      ) : (
                        <Square className="h-4.5 w-4.5 text-faint" />
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[12.5px] font-medium text-sage-deep">
                          {test.id}
                        </span>
                        {isOverridden && (
                          <span className="rounded-full border border-line bg-mist px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                            Manual
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[13.5px] font-medium text-ink">
                        {test.name}
                      </div>
                      <div className="mt-0.5 font-mono text-[12px] text-muted">
                        {test.filePath}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-line bg-mist px-2.5 py-1 text-[11px] font-medium text-ink-soft">
                        {test.suite}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-[13px] text-ink-soft font-normal">{test.reason}</div>
                      <div className="mt-0.5 font-mono text-[11.5px] text-muted">
                        {test.linkedEntities.join(', ')}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-well border border-line overflow-hidden">
                          <div
                            className="h-full bg-sage"
                            style={{ width: `${Math.round(test.confidence * 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[12px] font-medium text-ink">
                          {Math.round(test.confidence * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-[12.5px] text-ink-soft">
                      {test.estimatedSec}s
                    </td>
                    <td className="px-4 py-4">
                      <TestStatusBadge status={test.lastRunStatus} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
