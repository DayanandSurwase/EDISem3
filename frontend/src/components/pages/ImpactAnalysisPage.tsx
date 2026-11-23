import React, { useEffect, useState } from 'react'
import {
  Activity,
  ArrowRight,
  CheckSquare,
  GitMerge,
  Layers,
  Network,
  Search,
} from 'lucide-react'
import type { ChangesetAnalysis, ImpactedEntity, PageId, RiskLevel } from '../../types/analysis'
import {
  Card,
  Chip,
  RiskBadge,
  SecondaryButton,
  SectionHeader,
  TestStatusBadge,
} from '../ui/Primitives'

interface ImpactAnalysisPageProps {
  changeset: ChangesetAnalysis
  globalQuery: string
  onNavigate: (page: PageId) => void
}

export function ImpactAnalysisPage({
  changeset,
  globalQuery,
  onNavigate,
}: ImpactAnalysisPageProps) {
  const [hopFilter, setHopFilter] = useState<'all' | 0 | 1 | 2>('all')
  const [severityFilter, setSeverityFilter] = useState<'all' | RiskLevel>('all')
  const [localQuery, setLocalQuery] = useState('')
  const [selectedEntityId, setSelectedEntityId] = useState(
    changeset.impactedEntities[0]?.id ?? ''
  )

  useEffect(() => {
    setSelectedEntityId(changeset.impactedEntities[0]?.id ?? '')
  }, [changeset])

  const combinedQuery = (localQuery || globalQuery).trim().toLowerCase()

  const filtered = changeset.impactedEntities.filter((e) => {
    if (hopFilter !== 'all' && e.hopDistance !== hopFilter) return false
    if (severityFilter !== 'all' && e.severity !== severityFilter) return false
    if (
      combinedQuery &&
      !e.name.toLowerCase().includes(combinedQuery) &&
      !e.filePath.toLowerCase().includes(combinedQuery) &&
      !e.module.toLowerCase().includes(combinedQuery)
    ) {
      return false
    }
    return true
  })

  const activeEntity: ImpactedEntity | undefined =
    filtered.find((e) => e.id === selectedEntityId) ?? filtered[0]

  const directCount = changeset.impactedEntities.filter((e) => e.hopDistance === 0).length
  const hop1Count = changeset.impactedEntities.filter((e) => e.hopDistance === 1).length
  const hop2Count = changeset.impactedEntities.filter((e) => e.hopDistance === 2).length
  const untestedTotal = changeset.impactedEntities.reduce(
    (sum, e) => sum + e.untestedBranches,
    0
  )

  return (
    <div className="space-y-8">
      <SectionHeader
        kicker={`Static + Semantic Propagation · ${changeset.prNumber}`}
        title="Impact"
        highlight="Analysis"
        description="Trace how modified functions and database contracts propagate across API routes, asynchronous workers, and downstream consumers."
        actions={
          <>
            <SecondaryButton size="sm" onClick={() => onNavigate('dependency-graph')}>
              <Network className="h-4 w-4" />
              Open Graph
            </SecondaryButton>
            <SecondaryButton size="sm" onClick={() => onNavigate('test-selection')}>
              <CheckSquare className="h-4 w-4" />
              Select Tests
            </SecondaryButton>
          </>
        }
      />

      {/* Summary Strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card padded="sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            Direct Changes (0-Hop)
          </div>
          <div className="mt-2 text-[28px] font-bold text-ink">{directCount}</div>
        </Card>
        <Card padded="sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            1-Hop Callers
          </div>
          <div className="mt-2 text-[28px] font-bold text-sage-deep">{hop1Count}</div>
        </Card>
        <Card padded="sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            2-Hop Downstream
          </div>
          <div className="mt-2 text-[28px] font-bold text-ink">{hop2Count}</div>
        </Card>
        <Card padded="sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            Untested Branches
          </div>
          <div className="mt-2 text-[28px] font-bold text-danger-ink">{untestedTotal}</div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card padded="sm" className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: 'All Hops', value: 'all' as const },
            { label: 'Direct (0-Hop)', value: 0 as const },
            { label: '1-Hop Callers', value: 1 as const },
            { label: '2-Hop Downstream', value: 2 as const },
          ].map((tab) => (
            <button
              key={String(tab.value)}
              type="button"
              onClick={() => setHopFilter(tab.value)}
              className={`rounded-[10px] px-3.5 py-2 text-[13px] font-medium transition-colors cursor-pointer ${hopFilter === tab.value
                  ? 'bg-sage text-white shadow-[0_4px_12px_-6px_rgba(47,69,53,0.6)]'
                  : 'bg-mist border border-line text-muted hover:text-ink'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Filter by severity"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as 'all' | RiskLevel)}
            className="rounded-[12px] border border-line bg-paper px-3.5 py-2 text-[13px] text-ink focus:border-sage focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <div className="relative w-full sm:w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Search symbol or file..."
              className="w-full rounded-[12px] border border-line bg-paper py-2 pl-9 pr-3 text-[13px] text-ink placeholder-muted focus:border-sage focus:outline-none"
            />
          </div>
        </div>
      </Card>

      {/* Table + Detail Inspector */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card padded="none" className="xl:col-span-7 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-mist text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                  <th className="px-5 py-3.5">Impacted Entity</th>
                  <th className="px-4 py-3.5">Layer / Hop</th>
                  <th className="px-4 py-3.5">Confidence</th>
                  <th className="px-4 py-3.5">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((entity) => {
                  const isSelected = activeEntity?.id === entity.id
                  return (
                    <tr
                      key={entity.id}
                      onClick={() => setSelectedEntityId(entity.id)}
                      className={`transition-colors cursor-pointer ${isSelected ? 'bg-sage/10 shadow-[inset_3px_0_0_var(--s7-sage)]' : 'hover:bg-mist'
                        }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-sage-deep shrink-0" />
                          <span className="font-mono text-[13.5px] font-medium text-ink">
                            {entity.name}
                          </span>
                        </div>
                        <div className="mt-1 font-mono text-[12px] text-muted truncate max-w-[300px]">
                          {entity.filePath}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-[13px] font-medium text-ink-soft">{entity.layer}</div>
                        <div className="mt-0.5 text-[11px] text-muted font-normal">
                          {entity.hopDistance === 0
                            ? 'Direct AST edit'
                            : `${entity.hopDistance}-hop propagation`}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-well border border-line overflow-hidden">
                            <div
                              className="h-full bg-sage"
                              style={{ width: `${Math.round(entity.confidence * 100)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[12px] text-ink-soft">
                            {Math.round(entity.confidence * 100)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <RiskBadge level={entity.severity} />
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-[14px] text-muted font-normal">
                      No impacted entities match the current filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right Inspector */}
        <Card className="xl:col-span-5 space-y-6">
          {activeEntity ? (
            <>
              <div className="space-y-2 border-b border-line pb-5">
                <div className="flex items-center justify-between gap-2">
                  <Chip>{activeEntity.module}</Chip>
                  <RiskBadge level={activeEntity.severity} />
                </div>
                <h2 className="pt-1 font-mono text-[20px] font-semibold text-ink break-all">
                  {activeEntity.name}
                </h2>
                <div className="font-mono text-[12px] text-muted break-all">
                  {activeEntity.filePath}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-sage-deep">
                  Propagation Rationale
                </div>
                <p className="text-[14px] leading-[22px] text-ink-soft font-normal">
                  {activeEntity.reason}
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                  <GitMerge className="h-3.5 w-3.5 text-sage-deep" />
                  Call &amp; Contract Trace
                </div>
                <div className="rounded-[14px] border border-line bg-mist p-3.5 space-y-2">
                  {activeEntity.callPath.map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-[12.5px]">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage/25 text-[10px] font-bold text-sage-ink">
                        {i + 1}
                      </span>
                      <span className="font-mono text-ink-soft break-all">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                    <Layers className="h-3.5 w-3.5 text-sage-deep" />
                    Covering Regression Tests ({activeEntity.coveredByTests.length})
                  </span>
                  {activeEntity.untestedBranches > 0 && (
                    <span className="text-[12px] font-medium text-danger-ink">
                      {activeEntity.untestedBranches} untested branches
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {activeEntity.coveredByTests.map((tid) => {
                    const t = changeset.tests.find((item) => item.id === tid)
                    if (!t) return null
                    return (
                      <div
                        key={tid}
                        className="flex items-center justify-between gap-3 rounded-[12px] border border-line bg-mist px-3.5 py-2.5"
                      >
                        <div className="min-w-0">
                          <div className="font-mono text-[12px] font-medium text-ink">
                            {t.id} · {t.suite}
                          </div>
                          <div className="text-[12px] text-muted truncate font-normal">{t.name}</div>
                        </div>
                        <TestStatusBadge status={t.lastRunStatus} />
                      </div>
                    )
                  })}
                </div>
              </div>

              <SecondaryButton
                size="sm"
                className="w-full"
                onClick={() => onNavigate('test-selection')}
              >
                Review Selected Tests for {activeEntity.module}
                <ArrowRight className="h-3.5 w-3.5" />
              </SecondaryButton>
            </>
          ) : (
            <div className="py-12 text-center text-[14px] text-muted">
              Select an impacted entity to inspect its propagation path and covering tests.
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
