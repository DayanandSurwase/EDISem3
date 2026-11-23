import type React from 'react'

/* Styles live in src/index.css (.shiny-cta) — the original used Next's styled-jsx, which Vite lacks. */

export type ShinyButtonVariant = 'primary' | 'secondary'
export type ShinyButtonSize = 'sm' | 'md' | 'lg'

interface ShinyButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className' | 'onClick'> {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  /** primary: sage with an off-white shine. secondary: off-white paper with a sage shine. */
  variant?: ShinyButtonVariant
  /** lg reproduces the original component's proportions. */
  size?: ShinyButtonSize
}

export function ShinyButton({
  children,
  onClick,
  className = '',
  variant = 'primary',
  size = 'lg',
  type = 'button',
  ...rest
}: ShinyButtonProps) {
  return (
    <button
      type={type}
      className={`shiny-cta shiny-cta--${variant} shiny-cta--${size} ${className}`}
      onClick={onClick}
      {...rest}
    >
      <span>{children}</span>
    </button>
  )
}
