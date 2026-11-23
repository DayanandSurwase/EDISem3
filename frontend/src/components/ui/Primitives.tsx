import React from 'react'
import type { RiskLevel } from '../../types/analysis'

export function Chip({
  children,
  variant = 'neutral',
  className = '',
}: {
  children: React.ReactNode
  variant?: 'sage' | 'neutral' | 'error' | 'success'
  className?: string
}) {
  const styles = {
    sage: 'bg-[rgba(0,113,246,0.1)] text-[#0071F6] border border-[rgba(0,113,246,0.25)]',
    neutral: 'bg-[#111111] text-[#A0A0A0] border border-[#2E2E2E]',
    error: 'bg-[rgba(229,72,77,0.1)] text-[#E5484D] border border-[rgba(229,72,77,0.25)]',
    success: 'bg-[rgba(34,160,107,0.1)] text-[#22A06B] border border-[rgba(34,160,107,0.25)]',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[4px] px-2 py-0.5 text-label-12-mono uppercase tracking-[0.05em] leading-4 ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

export function Card({
  children,
  className = '',
  padded = 'md',
  surface = 'primary',
}: {
  children: React.ReactNode
  className?: string
  padded?: 'none' | 'sm' | 'md' | 'lg'
  surface?: 'primary' | 'nested' | 'elevated'
}) {
  const paddingMap = {
    none: '',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  }
  const surfaceMap = {
    primary: 'bg-[#000000] rounded-[8px] border border-[#2E2E2E]',
    nested: 'bg-[#0A0A0A] rounded-[6px] border border-[#1F1F1F]',
    elevated: 'bg-[#111111] rounded-[8px] border border-[#2E2E2E]',
  }
  return <div className={`${surfaceMap[surface]} ${paddingMap[padded]} ${className}`}>{children}</div>
}

type ButtonSize = 'sm' | 'md' | 'hero'

interface ActionButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  size?: ButtonSize
  className?: string
  type?: 'button' | 'submit'
}

/** Official Vercel Geist Primary Button (light monochrome background with dark text) */
export function PrimaryButton({
  children,
  onClick,
  disabled,
  size = 'md',
  className = '',
  type = 'button',
}: ActionButtonProps) {
  const sizeClasses = {
    sm: 'px-3 h-8 text-button-12',
    md: 'px-4 h-9 text-button-14',
    hero: 'px-5 h-10 text-button-14',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-[6px] font-medium text-black bg-[#EDEDED] hover:bg-white active:bg-[#D4D4D4] border border-[#EDEDED] transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  )
}

/** Official Vercel Geist Secondary Button (dark background with subtle gray border) */
export function SecondaryButton({
  children,
  onClick,
  disabled,
  size = 'md',
  className = '',
  type = 'button',
}: ActionButtonProps) {
  const sizeClasses = {
    sm: 'px-3 h-8 text-button-12',
    md: 'px-4 h-9 text-button-14',
    hero: 'px-5 h-10 text-button-14',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-[6px] font-medium text-[#EDEDED] bg-[#000000] hover:bg-[#111111] active:bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#454545] transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  )
}

/** Official Vercel Geist Ghost Button (transparent background with neutral hover) */
export function GhostButton({
  children,
  onClick,
  disabled,
  size = 'md',
  className = '',
  type = 'button',
}: ActionButtonProps) {
  const sizeClasses = {
    sm: 'px-2.5 h-8 text-button-12',
    md: 'px-3 h-9 text-button-14',
    hero: 'px-4 h-10 text-button-14',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-[6px] font-medium text-[#A0A0A0] hover:text-[#EDEDED] hover:bg-[#111111] active:bg-[#1A1A1A] transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  )
}

const RISK_CONFIG: Record<RiskLevel, { label: string; cls: string; dot: string }> = {
  critical: {
    label: 'CRITICAL',
    cls: 'bg-[rgba(229,72,77,0.1)] text-[#E5484D] border-[#E5484D]/30',
    dot: 'bg-[#E5484D]',
  },
  high: {
    label: 'HIGH RISK',
    cls: 'bg-[rgba(245,166,35,0.1)] text-[#F5A623] border-[#F5A623]/30',
    dot: 'bg-[#F5A623]',
  },
  medium: {
    label: 'MEDIUM',
    cls: 'bg-[rgba(0,113,246,0.1)] text-[#0071F6] border-[#0071F6]/30',
    dot: 'bg-[#0071F6]',
  },
  low: {
    label: 'LOW',
    cls: 'bg-[#111111] text-[#878787] border-[#2E2E2E]',
    dot: 'bg-[#454545]',
  },
}

export function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) {
  const item = RISK_CONFIG[level]
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[4px] border px-2 py-0.5 text-label-12-mono uppercase tracking-[0.05em] ${item.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />
      {item.label}
      {typeof score === 'number' && <span className="opacity-80">· {score}</span>}
    </span>
  )
}

export function TestStatusBadge({
  status,
}: {
  status: 'passed' | 'failed' | 'flaky' | 'skipped' | 'running'
}) {
  const map = {
    passed: 'bg-[rgba(34,160,107,0.1)] text-[#22A06B] border-[#22A06B]/30',
    failed: 'bg-[rgba(229,72,77,0.1)] text-[#E5484D] border-[#E5484D]/30',
    flaky: 'bg-[rgba(245,166,35,0.1)] text-[#F5A623] border-[#F5A623]/30',
    skipped: 'bg-[#111111] text-[#878787] border-[#2E2E2E]',
    running: 'bg-[rgba(0,113,246,0.1)] text-[#0071F6] border-[#0071F6]/40',
  }
  const dot = {
    passed: 'bg-[#22A06B]',
    failed: 'bg-[#E5484D]',
    flaky: 'bg-[#F5A623]',
    skipped: 'bg-[#454545]',
    running: 'bg-[#0071F6] animate-pulse',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[4px] border px-2 py-0.5 text-label-12-mono uppercase tracking-[0.05em] ${map[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot[status]}`} />
      {status}
    </span>
  )
}

export function SectionHeader({
  kicker,
  title,
  highlight,
  description,
  actions,
}: {
  kicker: string
  title: string
  highlight?: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[#1F1F1F] pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl space-y-2">
        <Chip>{kicker}</Chip>
        <h1 className="text-heading-32 font-semibold text-[#EDEDED] tracking-[-0.03em]">
          {title}{' '}
          {highlight && <span className="text-[#0071F6]">{highlight}</span>}
        </h1>
        {description && (
          <p className="text-copy-14 text-[#878787] font-normal leading-normal">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  )
}
