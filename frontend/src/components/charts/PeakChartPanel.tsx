import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ChartSeries } from '../../types/analysis'
import { PEAK_PALETTE_CLAY, PEAK_PALETTE_SAGE, PeakChart, type PeakChartPalette } from './PeakChart'

/**
 * Sage & off-white tones for PeakChart. Each maps to a light palette (off-white card, sage glow);
 * moss reuses the sage palette with a small accent hue shift. Clay is reserved for risk.
 */
export type ChartTone = 'sage' | 'moss' | 'clay'

const TONES: Record<ChartTone, { palette: PeakChartPalette; accent?: string }> = {
  sage: { palette: PEAK_PALETTE_SAGE },
  moss: { palette: PEAK_PALETTE_SAGE, accent: '#7d9a5c' },
  clay: { palette: PEAK_PALETTE_CLAY },
}

const CHART_FONT = "'Geist', 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"

const CARD_RATIO = 696 / 540
const CARD_RADIUS = 56 / 540
const WIDTH_STEP = 8

interface PeakChartPanelProps {
  /** Series keyed by period name; keys populate the chart's period dropdown in insertion order. */
  series: Record<string, ChartSeries>
  defaultPeriod?: string
  title: string
  valueSuffix?: string
  decimals?: number
  updatedText?: string
  tone?: ChartTone
  formatValue?: (value: number) => string
  maxWidth?: number
  className?: string
}

/**
 * Responsive host for PeakChart: measures its column, snaps the width (each width change rebuilds the
 * painted field), owns the period state, and clips the card so its glow never bleeds onto light surfaces.
 */
export function PeakChartPanel({
  series,
  defaultPeriod,
  title,
  valueSuffix = '',
  decimals = 0,
  updatedText = 'Data updated just now',
  tone = 'sage',
  formatValue,
  maxWidth = 440,
  className = '',
}: PeakChartPanelProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const periods = Object.keys(series)
  const [period, setPeriod] = useState(defaultPeriod ?? periods[0])
  const activePeriod = series[period] ? period : periods[0]
  const active = series[activePeriod]

  useLayoutEffect(() => {
    const el = hostRef.current
    if (!el) return
    const fit = () => {
      const raw = Math.min(maxWidth, el.clientWidth)
      return Math.max(WIDTH_STEP, Math.floor(raw / WIDTH_STEP) * WIDTH_STEP)
    }
    setWidth(fit())
  }, [maxWidth])

  useEffect(() => {
    const el = hostRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    let timer: number | undefined
    const ro = new ResizeObserver(() => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        const raw = Math.min(maxWidth, el.clientWidth)
        const next = Math.max(WIDTH_STEP, Math.floor(raw / WIDTH_STEP) * WIDTH_STEP)
        setWidth((prev) => (prev === next ? prev : next))
      }, 140)
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      window.clearTimeout(timer)
    }
  }, [maxWidth])

  if (!active) return null

  // A series can override the panel's title / suffix / decimals (e.g. when periods are metrics).
  const shownTitle = active.title ?? title
  const shownSuffix = active.suffix ?? valueSuffix
  const shownDecimals = active.decimals ?? decimals
  const { palette, accent } = TONES[tone]
  const fmt = (v: number) =>
    v.toLocaleString('en-US', { minimumFractionDigits: shownDecimals, maximumFractionDigits: shownDecimals })

  return (
    <figure ref={hostRef} className={`m-0 w-full ${className}`}>
      {width > 0 && (
        <div
          className="mx-auto"
          style={{
            width,
            height: width * CARD_RATIO,
            borderRadius: width * CARD_RADIUS,
            overflow: 'hidden',
            isolation: 'isolate',
            boxShadow:
              '0 0 0 1px rgba(36,51,42,0.08), 0 24px 44px -28px rgba(36,51,42,0.45), 0 2px 6px -2px rgba(36,51,42,0.12)',
          }}
        >
          <PeakChart
            width={width}
            data={active.data}
            labels={active.labels}
            value={active.value}
            valueSuffix={shownSuffix}
            decimals={shownDecimals}
            title={shownTitle}
            caption={active.caption}
            updatedText={updatedText}
            trend={active.trend ?? 'up'}
            periods={periods}
            period={activePeriod}
            onPeriodChange={setPeriod}
            palette={palette}
            accent={accent}
            font={CHART_FONT}
            formatValue={formatValue}
            style={{ display: 'block' }}
          />
        </div>
      )}
      <figcaption className="sr-only">
        {shownTitle}, {activePeriod}: {fmt(active.value)}
        {shownSuffix}. {active.caption}
      </figcaption>
    </figure>
  )
}
