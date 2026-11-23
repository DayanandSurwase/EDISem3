import React, { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Code2,
  Columns2,
  FileCode2,
  Rows3,
  Sparkles,
} from 'lucide-react'
import type { ChangesetAnalysis, DiffLine, PageId } from '../../types/analysis'
import { Card, Chip, RiskBadge, SecondaryButton, SectionHeader } from '../ui/Primitives'

interface CodeComparisonPageProps {
  changeset: ChangesetAnalysis
  globalQuery: string
  onNavigate: (page: PageId) => void
}

export function CodeComparisonPage({
  changeset,
  globalQuery,
  onNavigate,
}: CodeComparisonPageProps) {
  const [selectedFileId, setSelectedFileId] = useState(changeset.diffFiles[0]?.id ?? '')
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified')
  const [onlyAnnotated, setOnlyAnnotated] = useState(false)
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null)

  useEffect(() => {
    const first = changeset.diffFiles[0]
    setSelectedFileId(first?.id ?? '')
    const firstAnn = first?.lines.find((l) => l.annotation)?.annotation?.id ?? null
    setSelectedAnnotationId(firstAnn)
  }, [changeset])

  const filteredFiles = changeset.diffFiles.filter((f) =>
    globalQuery.trim()
      ? f.path.toLowerCase().includes(globalQuery.toLowerCase()) ||
        f.symbols.some((s) => s.name.toLowerCase().includes(globalQuery.toLowerCase()))
      : true
  )

  const activeFile =
    filteredFiles.find((f) => f.id === selectedFileId) ??
    filteredFiles[0] ??
    changeset.diffFiles[0]

  const visibleLines = activeFile
    ? onlyAnnotated
      ? activeFile.lines.filter((l) => Boolean(l.annotation) || l.type !== 'context')
      : activeFile.lines
    : []

  const allAnnotations = activeFile
    ? activeFile.lines
        .map((l) => l.annotation)
        .filter((a): a is NonNullable<DiffLine['annotation']> => Boolean(a))
    : []

  const activeAnnotation =
    allAnnotations.find((a) => a.id === selectedAnnotationId) ?? allAnnotations[0] ?? null

  // Build split diff pairs
  const splitPairs: { left?: DiffLine; right?: DiffLine }[] = []
  if (activeFile) {
    const lines = visibleLines
    let i = 0
    while (i < lines.length) {
      const cur = lines[i]
      if (cur.type === 'context') {
        splitPairs.push({ left: cur, right: cur })
        i += 1
      } else if (cur.type === 'removed') {
        const next = lines[i + 1]
        if (next && next.type === 'added') {
          splitPairs.push({ left: cur, right: next })
          i += 2
        } else {
          splitPairs.push({ left: cur })
          i += 1
        }
      } else {
        splitPairs.push({ right: cur })
        i += 1
      }
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        kicker={`AST Diff Intelligence · ${changeset.prNumber}`}
        title="Code"
        highlight="Comparison"
        description="Inspect line-level code mutations, modified AST symbol signatures, and AI semantic annotations linked directly to impacted regression tests."
        actions={
          <div className="flex items-center gap-2 rounded-[12px] border border-line bg-paper p-1">
            <button
              type="button"
              onClick={() => setViewMode('unified')}
              className={`inline-flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-[13px] font-medium transition-colors cursor-pointer ${
                viewMode === 'unified'
                  ? 'bg-sage text-white shadow-[0_4px_12px_-6px_rgba(47,69,53,0.6)]'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <Rows3 className="h-3.5 w-3.5" />
              Unified
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`inline-flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-[13px] font-medium transition-colors cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-sage text-white shadow-[0_4px_12px_-6px_rgba(47,69,53,0.6)]'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <Columns2 className="h-3.5 w-3.5" />
              Split
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* File Tree & Changed Symbols */}
        <div className="xl:col-span-3 space-y-5">
          <Card padded="sm" className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                Modified Files ({filteredFiles.length})
              </span>
              <span className="font-mono text-[11.5px] text-muted font-normal">
                {changeset.commitSha}
              </span>
            </div>

            <div className="space-y-2">
              {filteredFiles.map((file) => {
                const isSelected = activeFile?.id === file.id
                return (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => {
                      setSelectedFileId(file.id)
                      const firstAnn = file.lines.find((l) => l.annotation)?.annotation?.id ?? null
                      setSelectedAnnotationId(firstAnn)
                    }}
                    className={`w-full rounded-[12px] border p-3 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-sage bg-sage/10'
                        : 'border-line bg-mist hover:border-faint'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink truncate">
                        <FileCode2 className="h-3.5 w-3.5 text-sage-deep shrink-0" />
                        {file.path.split('/').pop()}
                      </span>
                      <RiskBadge level={file.riskLevel} />
                    </div>
                    <div className="mt-1 font-mono text-[11.5px] text-muted truncate">
                      {file.path}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-muted font-normal">{file.module}</span>
                      <span className="font-mono">
                        <span className="text-sage-deep">+{file.additions}</span>{' '}
                        <span className="text-danger-ink">-{file.deletions}</span>
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>

          {activeFile && (
            <Card padded="sm" className="space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-sage-deep">
                AST Symbol Deltas
              </div>
              <div className="space-y-2.5">
                {activeFile.symbols.map((sym) => (
                  <div
                    key={sym.name}
                    className="rounded-[12px] border border-line bg-mist p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[13px] font-medium text-ink truncate">
                        {sym.name}
                      </span>
                      <span className="rounded-full bg-sage/10 border border-sage/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-sage-ink">
                        {sym.delta}
                      </span>
                    </div>
                    <div className="font-mono text-[11.5px] text-muted break-all">
                      {sym.signature}
                    </div>
                    <div className="text-[11px] text-ink-soft font-normal">
                      {sym.callersCount} upstream callers indexed
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Main Diff Surface */}
        <div className="xl:col-span-9 space-y-6">
          {activeFile && (
            <Card padded="none" className="overflow-hidden">
              {/* Diff Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-mist px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Code2 className="h-4 w-4 text-sage-deep shrink-0" />
                  <span className="font-mono text-[13px] font-medium text-ink truncate">
                    {activeFile.path}
                  </span>
                  <RiskBadge level={activeFile.riskLevel} score={activeFile.riskScore} />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setOnlyAnnotated(!onlyAnnotated)}
                    className={`rounded-[10px] border px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer ${
                      onlyAnnotated
                        ? 'border-sage bg-sage/10 text-ink'
                        : 'border-line bg-paper text-muted hover:text-ink'
                    }`}
                  >
                    {onlyAnnotated ? 'Showing Hunks Only' : 'Filter: Changes Only'}
                  </button>
                </div>
              </div>

              {/* Diff Body */}
              {viewMode === 'unified' ? (
                <div className="overflow-x-auto bg-paper">
                  <table className="w-full border-collapse font-mono text-[13px] leading-[22px]">
                    <tbody>
                      {visibleLines.map((line, idx) => {
                        const rowBg =
                          line.type === 'added'
                            ? 'bg-sage/14'
                            : line.type === 'removed'
                              ? 'bg-danger/12'
                              : ''
                        const marker =
                          line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '
                        const markerCls =
                          line.type === 'added'
                            ? 'text-sage-ink'
                            : line.type === 'removed'
                              ? 'text-danger-ink'
                              : 'text-faint'

                        return (
                          <React.Fragment key={idx}>
                            <tr className={`${rowBg} hover:bg-mist`}>
                              <td className="w-11 select-none border-r border-line/60 px-2.5 text-right font-mono text-[12px] text-faint font-normal">
                                {line.oldLine ?? ''}
                              </td>
                              <td className="w-11 select-none border-r border-line/60 px-2.5 text-right font-mono text-[12px] text-faint font-normal">
                                {line.newLine ?? ''}
                              </td>
                              <td className={`w-6 select-none text-center font-bold ${markerCls}`}>
                                {marker}
                              </td>
                              <td className="whitespace-pre px-3 py-0.5 text-ink-soft">
                                {line.content}
                              </td>
                            </tr>
                            {line.annotation && (
                              <tr>
                                <td colSpan={4} className="bg-paper px-4 py-3 border-y border-sage/40">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedAnnotationId(line.annotation!.id)}
                                    className="flex w-full items-start justify-between gap-4 text-left cursor-pointer"
                                  >
                                    <div className="flex items-start gap-2.5">
                                      <Sparkles className="mt-0.5 h-4 w-4 text-sage-deep shrink-0" />
                                      <div>
                                        <div className="flex flex-wrap items-center gap-2 font-sans">
                                          <span className="text-[14px] font-medium text-ink">
                                            {line.annotation.title}
                                          </span>
                                          <RiskBadge level={line.annotation.severity} />
                                        </div>
                                        <p className="mt-1 font-sans text-[13px] text-muted font-normal">
                                          {line.annotation.summary}
                                        </p>
                                      </div>
                                    </div>
                                    <span className="shrink-0 font-sans text-[12px] font-medium text-sage-deep">
                                      {line.annotation.linkedTestIds.length} tests →
                                    </span>
                                  </button>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto bg-paper">
                  <table className="w-full border-collapse font-mono text-[13px] leading-[22px]">
                    <thead>
                      <tr className="border-b border-line bg-mist font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                        <th colSpan={2} className="w-1/2 border-r border-line px-4 py-2 text-left">
                          Base ({changeset.baseBranch})
                        </th>
                        <th colSpan={2} className="w-1/2 px-4 py-2 text-left">
                          Head ({changeset.branch})
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {splitPairs.map((pair, idx) => (
                        <tr key={idx} className="border-b border-line/30">
                          <td className="w-10 select-none border-r border-line/60 px-2 text-right font-mono text-[12px] text-faint font-normal">
                            {pair.left?.oldLine ?? ''}
                          </td>
                          <td
                            className={`w-1/2 whitespace-pre border-r border-line px-3 py-0.5 ${
                              pair.left?.type === 'removed'
                                ? 'bg-danger/12 text-danger-ink'
                                : 'text-muted'
                            }`}
                          >
                            {pair.left?.content ?? ''}
                          </td>
                          <td className="w-10 select-none border-r border-line/60 px-2 text-right font-mono text-[12px] text-faint font-normal">
                            {pair.right?.newLine ?? ''}
                          </td>
                          <td
                            className={`w-1/2 whitespace-pre px-3 py-0.5 ${
                              pair.right?.type === 'added'
                                ? 'bg-sage/14 text-ink'
                                : 'text-ink-soft'
                            }`}
                          >
                            {pair.right?.content ?? ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* AI Semantic Impact Drawer */}
          {activeAnnotation && (
            <Card className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-sage-deep" />
                  <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-sage-deep">
                    Selected Hunk Impact Diagnosis
                  </span>
                  <RiskBadge level={activeAnnotation.severity} />
                </div>
                <div className="flex items-center gap-2">
                  <SecondaryButton size="sm" onClick={() => onNavigate('impact-analysis')}>
                    Open Impact Table
                  </SecondaryButton>
                  <SecondaryButton size="sm" onClick={() => onNavigate('test-selection')}>
                    Select Linked Tests <ArrowRight className="h-3.5 w-3.5" />
                  </SecondaryButton>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <div className="md:col-span-2 space-y-2">
                  <h3 className="text-[17px] font-semibold text-ink">{activeAnnotation.title}</h3>
                  <p className="text-[14px] leading-[22px] text-muted font-normal">
                    {activeAnnotation.summary}
                  </p>
                </div>
                <div className="rounded-[14px] border border-line bg-mist p-4 space-y-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                      Impacted Symbols
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {activeAnnotation.impactedSymbols.map((sym) => (
                        <span
                          key={sym}
                          className="rounded-md border border-line bg-paper px-2 py-0.5 font-mono text-[12px] text-ink-soft font-normal"
                        >
                          {sym}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                      Linked Regression Tests
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {activeAnnotation.linkedTestIds.map((id) => (
                        <Chip key={id} variant="sage">
                          {id}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
