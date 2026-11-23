import React, { useEffect, useState } from 'react'
import {
  ArrowRight,
  Eye,
  Maximize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import type { ChangesetAnalysis, GraphLayer, GraphNode, PageId } from '../../types/analysis'
import { Card, Chip, RiskBadge, SecondaryButton, SectionHeader } from '../ui/Primitives'

interface DependencyVisualizationPageProps {
  changeset: ChangesetAnalysis
  onNavigate: (page: PageId) => void
}

const LAYER_META: Record<GraphLayer, { label: string; ringColor: string; badge: string }> = {
  changed: { label: 'Modified Source', ringColor: '#4169E1', badge: '0-HOP EDIT' },
  hop1: { label: '1-Hop Callers', ringColor: '#38BDF8', badge: '1-HOP' },
  hop2: { label: '2-Hop Downstream', ringColor: '#818CF8', badge: '2-HOP' },
  datastore: { label: 'State / Queue', ringColor: '#F59E0B', badge: 'DATASTORE' },
  tests: { label: 'Selected Tests', ringColor: '#22A06B', badge: 'REGRESSION' },
}

const GRAPH = {
  grid: '#1A1A1A',
  guide: '#666666',
  edge: '#2E2E2E',
  edgeActive: '#4169E1',
  node: '#111111',
  nodeSelected: '#1A1A1E',
  critical: '#DC5555',
  ink: '#EDEDED',
  muted: '#878787',
  sageInk: '#60A5FA',
}

export function DependencyVisualizationPage({
  changeset,
  onNavigate,
}: DependencyVisualizationPageProps) {
  const [selectedNodeId, setSelectedNodeId] = useState(changeset.graphNodes[0]?.id ?? '')
  const [visibleLayers, setVisibleLayers] = useState<Record<GraphLayer, boolean>>({
    changed: true,
    hop1: true,
    hop2: true,
    datastore: true,
    tests: true,
  })
  const [zoom, setZoom] = useState(1)
  const [highlightConnectedOnly, setHighlightConnectedOnly] = useState(false)

  useEffect(() => {
    setSelectedNodeId(changeset.graphNodes[0]?.id ?? '')
    setZoom(1)
  }, [changeset])

  const visibleNodes = changeset.graphNodes.filter((n) => visibleLayers[n.layer])
  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id))
  const visibleEdges = changeset.graphEdges.filter(
    (e) => visibleNodeIds.has(e.from) && visibleNodeIds.has(e.to)
  )

  const selectedNode: GraphNode | undefined =
    visibleNodes.find((n) => n.id === selectedNodeId) ?? visibleNodes[0]

  const connectedIds = new Set<string>()
  if (selectedNode) {
    connectedIds.add(selectedNode.id)
    visibleEdges.forEach((e) => {
      if (e.from === selectedNode.id) connectedIds.add(e.to)
      if (e.to === selectedNode.id) connectedIds.add(e.from)
    })
  }

  const incomingEdges = selectedNode
    ? changeset.graphEdges.filter((e) => e.to === selectedNode.id)
    : []
  const outgoingEdges = selectedNode
    ? changeset.graphEdges.filter((e) => e.from === selectedNode.id)
    : []

  const toggleLayer = (layer: GraphLayer) => {
    setVisibleLayers((prev) => ({ ...prev, [layer]: !prev[layer] }))
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        kicker={`AST + Runtime Call Graph · ${changeset.prNumber}`}
        title="Dependency"
        highlight="Visualization"
        description="Explore interactive code-to-test blast radius topology across modified symbols, API boundaries, shared datastores, and selected regression suites."
        actions={
          <SecondaryButton size="sm" onClick={() => onNavigate('test-selection')}>
            Open Test Selection <ArrowRight className="h-3.5 w-3.5" />
          </SecondaryButton>
        }
      />

      {/* Layer Controls */}
      <Card padded="sm" className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(LAYER_META) as GraphLayer[]).map((layer) => {
            const meta = LAYER_META[layer]
            const active = visibleLayers[layer]
            return (
              <button
                key={layer}
                type="button"
                onClick={() => toggleLayer(layer)}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors cursor-pointer ${
                  active
                    ? 'border-line bg-paper text-ink shadow-[0_1px_2px_rgba(36,51,42,0.06)]'
                    : 'border-dashed border-line bg-transparent text-muted opacity-70 hover:opacity-100'
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: meta.ringColor }}
                />
                {meta.label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHighlightConnectedOnly(!highlightConnectedOnly)}
            className={`inline-flex items-center gap-1.5 rounded-[10px] border px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer ${
              highlightConnectedOnly
                ? 'border-sage bg-sage/10 text-ink'
                : 'border-line bg-mist text-muted hover:text-ink'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            Isolate Neighborhood
          </button>
          <div className="flex items-center rounded-[10px] border border-line bg-mist p-0.5">
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => setZoom((z) => Math.max(0.75, +(z - 0.1).toFixed(2)))}
              className="p-1.5 text-muted hover:text-ink cursor-pointer"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="px-2 font-mono text-[12px] text-ink-soft font-medium">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => setZoom((z) => Math.min(1.35, +(z + 0.1).toFixed(2)))}
              className="p-1.5 text-muted hover:text-ink cursor-pointer"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Reset zoom"
              onClick={() => setZoom(1)}
              className="p-1.5 text-muted hover:text-ink cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </Card>

      {/* Graph Canvas + Node Inspector */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card padded="none" className="xl:col-span-8 overflow-hidden relative">
          <div className="flex items-center justify-between border-b border-line bg-mist px-5 py-3.5">
            <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
              <Maximize2 className="h-3.5 w-3.5 text-sage-deep" />
              Blast-Radius Topology · Click any node to inspect edges
            </div>
            <div className="text-[12px] text-muted font-normal">
              {visibleNodes.length} nodes · {visibleEdges.length} edges
            </div>
          </div>

          <div className="overflow-auto bg-mist p-4">
            <div
              className="origin-top-left transition-transform duration-150"
              style={{ transform: `scale(${zoom})`, width: 960, height: 480 }}
            >
              <svg viewBox="0 0 960 480" className="h-full w-full select-none">
                <defs>
                  <pattern
                    id="s7-grid"
                    width="32"
                    height="32"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 32 0 L 0 0 0 32"
                      fill="none"
                      stroke={GRAPH.grid}
                      strokeWidth="0.7"
                    />
                  </pattern>
                  <marker
                    id="arrow-muted"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill={GRAPH.edge} />
                  </marker>
                  <marker
                    id="arrow-sage"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill={GRAPH.edgeActive} />
                  </marker>
                </defs>

                <rect width="960" height="480" fill="url(#s7-grid)" />

                {/* Column Guides */}
                {[
                  { x: 110, label: 'MODIFIED' },
                  { x: 345, label: '1-HOP CALLERS' },
                  { x: 585, label: '2-HOP / STATE' },
                  { x: 825, label: 'SELECTED TESTS' },
                ].map((col) => (
                  <text
                    key={col.label}
                    x={col.x}
                    y={30}
                    textAnchor="middle"
                    fill={GRAPH.guide}
                    fontSize="10"
                    fontWeight="700"
                    letterSpacing="1.6"
                  >
                    {col.label}
                  </text>
                ))}

                {/* Edges */}
                {visibleEdges.map((edge) => {
                  const from = visibleNodes.find((n) => n.id === edge.from)
                  const to = visibleNodes.find((n) => n.id === edge.to)
                  if (!from || !to) return null

                  const isConnected =
                    selectedNode &&
                    (edge.from === selectedNode.id || edge.to === selectedNode.id)
                  const dimmed = highlightConnectedOnly && selectedNode && !isConnected

                  const dx = (to.x - from.x) * 0.45
                  const pathD = `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`

                  return (
                    <g key={edge.id} opacity={dimmed ? 0.14 : 1}>
                      <path
                        d={pathD}
                        fill="none"
                        stroke={isConnected ? GRAPH.edgeActive : GRAPH.edge}
                        strokeWidth={isConnected ? 2.4 : 1.5}
                        strokeDasharray={edge.kind === 'verifies' ? '5 4' : undefined}
                        markerEnd={isConnected ? 'url(#arrow-sage)' : 'url(#arrow-muted)'}
                      />
                    </g>
                  )
                })}

                {/* Nodes */}
                {visibleNodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id
                  const isNeighbor = connectedIds.has(node.id)
                  const dimmed = highlightConnectedOnly && selectedNode && !isNeighbor
                  const meta = LAYER_META[node.layer]
                  const isCritical = node.riskScore >= 80

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x - 92}, ${node.y - 32})`}
                      onClick={() => setSelectedNodeId(node.id)}
                      opacity={dimmed ? 0.22 : 1}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        width="184"
                        height="64"
                        rx="14"
                        fill={isSelected ? GRAPH.nodeSelected : GRAPH.node}
                        stroke={
                          isSelected
                            ? GRAPH.edgeActive
                            : isCritical
                              ? GRAPH.critical
                              : meta.ringColor
                        }
                        strokeWidth={isSelected ? 2.4 : 1.3}
                        style={{ filter: isSelected ? 'drop-shadow(0 4px 12px rgba(65,105,225,0.35))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
                      />
                      <rect x="0" y="14" width="3" height="36" rx="1.5" fill={isCritical ? GRAPH.critical : meta.ringColor} />
                      <text
                        x="14"
                        y="22"
                        fill={isSelected ? GRAPH.sageInk : GRAPH.muted}
                        fontSize="9"
                        fontWeight="700"
                        letterSpacing="1.2"
                      >
                        {meta.badge} · RISK {node.riskScore}
                      </text>
                      <text
                        x="14"
                        y="40"
                        fill={GRAPH.ink}
                        fontSize="12.5"
                        fontWeight="700"
                      >
                        {node.label.length > 22 ? `${node.label.slice(0, 21)}…` : node.label}
                      </text>
                      <text x="14" y="54" fill={GRAPH.muted} fontSize="10.5">
                        {node.sublabel}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>
        </Card>

        {/* Node Inspector */}
        <Card className="xl:col-span-4 space-y-5">
          {selectedNode ? (
            <>
              <div className="space-y-2 border-b border-line pb-4">
                <div className="flex items-center justify-between gap-2">
                  <Chip>{LAYER_META[selectedNode.layer].label}</Chip>
                  <RiskBadge
                    level={
                      selectedNode.riskScore >= 80
                        ? 'critical'
                        : selectedNode.riskScore >= 65
                          ? 'high'
                          : selectedNode.riskScore >= 45
                            ? 'medium'
                            : 'low'
                    }
                    score={selectedNode.riskScore}
                  />
                </div>
                <h2 className="pt-1 font-mono text-[18px] font-semibold text-ink break-words">
                  {selectedNode.label}
                </h2>
                <div className="font-mono text-[12px] text-muted break-all">
                  {selectedNode.filePath ?? selectedNode.sublabel}
                </div>
              </div>

              <p className="text-[14px] leading-[22px] text-ink-soft font-normal">
                {selectedNode.description}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[12px] border border-line bg-mist p-3.5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                    30d Churn
                  </div>
                  <div className="mt-1 text-[20px] font-semibold text-ink">
                    {selectedNode.churn} commits
                  </div>
                </div>
                <div className="rounded-[12px] border border-line bg-mist p-3.5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                    Branch Cov.
                  </div>
                  <div className="mt-1 text-[20px] font-semibold text-sage-deep">
                    {selectedNode.coveragePct}%
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                  Connected Dependencies
                </div>
                <div className="space-y-2">
                  {incomingEdges.map((e) => {
                    const src = changeset.graphNodes.find((n) => n.id === e.from)
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => src && setSelectedNodeId(src.id)}
                        className="flex w-full items-center justify-between rounded-[10px] border border-line bg-mist hover:border-sage/60 px-3 py-2 text-left text-[12px] cursor-pointer"
                      >
                        <span className="text-ink-soft truncate font-normal">
                          <span className="text-sage-deep font-medium">← {e.kind}</span> from{' '}
                          <strong className="text-ink font-medium">{src?.label}</strong>
                        </span>
                        <span className="font-mono text-[12px] text-muted font-normal">
                          {Math.round(e.weight * 100)}%
                        </span>
                      </button>
                    )
                  })}
                  {outgoingEdges.map((e) => {
                    const dst = changeset.graphNodes.find((n) => n.id === e.to)
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => dst && setSelectedNodeId(dst.id)}
                        className="flex w-full items-center justify-between rounded-[10px] border border-line bg-mist hover:border-sage/60 px-3 py-2 text-left text-[12px] cursor-pointer"
                      >
                        <span className="text-ink-soft truncate font-normal">
                          <span className="text-sage-deep font-medium">→ {e.kind}</span> to{' '}
                          <strong className="text-ink font-medium">{dst?.label}</strong>
                        </span>
                        <span className="font-mono text-[12px] text-muted font-normal">
                          {Math.round(e.weight * 100)}%
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-[14px] text-muted">
              Enable at least one graph layer to inspect dependency nodes.
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
