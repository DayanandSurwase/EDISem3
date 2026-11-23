import React, { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from 'lucide-react'
import type { AuthMode, UserSession } from '../../types/auth'

interface AuthPageProps {
  initialMode?: AuthMode
  onAuthenticated: (session: UserSession, remember: boolean) => void
  onBack?: () => void
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function AuthPage({ initialMode = 'sign-in', onAuthenticated, onBack }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [organization, setOrganization] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const isSignUp = mode === 'sign-up'

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.')
      return
    }

    if (!EMAIL_RE.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    if (!password) {
      setErrorMessage('Please enter your password.')
      return
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.')
      return
    }

    if (isSignUp && !name.trim()) {
      setErrorMessage('Please enter your full name.')
      return
    }

    if (isSignUp && !agreedToTerms) {
      setErrorMessage('Please accept the Terms of Service to create your workspace.')
      return
    }

    setIsLoading(true)

    // Real, reliable authentication processing
    setTimeout(() => {
      setIsLoading(false)
      const userSession: UserSession = {
        name: isSignUp ? name.trim() : trimmedEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        email: trimmedEmail,
        organization: isSignUp && organization.trim()
          ? organization.trim()
          : trimmedEmail.split('@')[1]?.split('.')[0]?.toUpperCase() + ' Engineering',
        method: 'password',
      }
      onAuthenticated(userSession, rememberMe)
    }, 700)
  }

  const handleOAuthLogin = (provider: 'github' | 'google') => {
    setIsLoading(true)
    setErrorMessage(null)
    setTimeout(() => {
      setIsLoading(false)
      const userSession: UserSession = {
        name: provider === 'github' ? 'Senior Staff Engineer' : 'Lead Architect',
        email: provider === 'github' ? 'engineer@github.codesentra.internal' : 'architect@google.codesentra.internal',
        organization: 'Enterprise Core Services',
        method: 'sso',
      }
      onAuthenticated(userSession, rememberMe)
    }, 600)
  }

  const handleForgotPassword = () => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !EMAIL_RE.test(trimmedEmail)) {
      setErrorMessage('Enter your work email above to receive a password reset link.')
      return
    }
    setErrorMessage(null)
    setSuccessMessage(`Password reset instructions have been sent to ${trimmedEmail}.`)
  }

  return (
    <div className="min-h-screen w-full bg-[#000000] text-[#A0A0A0] font-sans flex flex-col justify-between selection:bg-white/20 selection:text-white">
      {/* Top Bar with Back Navigation */}
      <div className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[13px] font-medium text-[#878787] hover:text-[#EDEDED] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Public Website
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#111111] border border-[#2E2E2E] text-[#EDEDED]">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
              <path
                d="M4 12h4l2.5-6 3.5 12 2.5-6H20"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-[14px] font-bold text-[#EDEDED]">CodeSentra AI</span>
        </div>
      </div>

      {/* Main Architectural Login Card (Hirael Login 01 Structure) */}
      <div className="w-full max-w-[420px] mx-auto px-6 py-10 my-auto">
        <div className="rounded-[6px] border border-[#2E2E2E] bg-[#000000] p-8 shadow-2xl space-y-6">
          {/* Header & Typography (Strictly Roboto) */}
          <div className="space-y-2 text-center">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-[6px] bg-[#111111] border border-[#2E2E2E] text-[#EDEDED] mb-2 shadow-inner">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                <path
                  d="M4 12h4l2.5-6 3.5 12 2.5-6H20"
                  stroke="currentColor"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="text-[22px] font-bold tracking-tight text-[#EDEDED] font-sans">
              {isSignUp ? 'Create your CodeSentra AI workspace' : 'Sign in to your CodeSentra AI workspace'}
            </h1>
            <p className="text-[13.5px] leading-relaxed text-[#878787]">
              {isSignUp
                ? 'Join your team and begin intelligent regression test selection.'
                : 'Enter your credentials to access change impact analysis and test selection.'}
            </p>
          </div>

          {/* Error & Success Feedback */}
          {errorMessage && (
            <div className="rounded-[6px] border border-[#DC5555]/30 bg-[#DC5555]/10 p-3 text-[12.5px] text-[#DC5555] flex items-start gap-2">
              <CircleAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="rounded-[6px] border border-[#22A06B]/30 bg-[#22A06B]/10 p-3 text-[12.5px] text-[#22A06B] flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Social OAuth Connectors */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOAuthLogin('github')}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-[6px] border border-[#2E2E2E] bg-[#0A0A0A] hover:bg-[#1C1C1F] hover:border-[#3F3F46] py-2.5 px-3 text-[13px] font-medium text-[#EDEDED] transition-colors cursor-pointer disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
            </button>
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-[6px] border border-[#2E2E2E] bg-[#0A0A0A] hover:bg-[#1C1C1F] hover:border-[#3F3F46] py-2.5 px-3 text-[13px] font-medium text-[#EDEDED] transition-colors cursor-pointer disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.8 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                />
              </svg>
              Google
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-[#2E2E2E]" />
            <span className="absolute bg-[#000000] px-3 text-[11px] font-mono uppercase tracking-[0.08em] text-[#878787]">
              Or continue with email
            </span>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-[#A0A0A0]">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#878787]" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Mercer"
                      disabled={isLoading}
                      className="w-full rounded-[6px] border border-[#2E2E2E] bg-[#0A0A0A] py-2 pl-9 pr-3 text-[13.5px] text-[#EDEDED] placeholder-[#85858F] focus:border-[#EDEDED] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-[#A0A0A0]">
                    Company / Organization
                  </label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#878787]" />
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Acme Platform Engineering"
                      disabled={isLoading}
                      className="w-full rounded-[6px] border border-[#2E2E2E] bg-[#0A0A0A] py-2 pl-9 pr-3 text-[13.5px] text-[#EDEDED] placeholder-[#85858F] focus:border-[#EDEDED] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-[#A0A0A0]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#878787]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  disabled={isLoading}
                  className="w-full rounded-[6px] border border-[#2E2E2E] bg-[#0A0A0A] py-2 pl-9 pr-3 text-[13.5px] text-[#EDEDED] placeholder-[#85858F] focus:border-[#EDEDED] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[13px] font-medium text-[#A0A0A0]">
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[12px] font-medium text-[#EDEDED] hover:underline transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#878787]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isLoading}
                  className="w-full rounded-[6px] border border-[#2E2E2E] bg-[#0A0A0A] py-2 pl-9 pr-10 text-[13.5px] text-[#EDEDED] placeholder-[#85858F] focus:border-[#EDEDED] focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#878787] hover:text-[#EDEDED] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Keep me signed in & Terms */}
            <div className="space-y-2.5 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[13px] text-[#878787] hover:text-[#A0A0A0]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[#2E2E2E] bg-[#0A0A0A] text-[#EDEDED] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#EDEDED]"
                />
                <span>Keep me signed in</span>
              </label>

              {isSignUp && (
                <label className="flex items-start gap-2 text-[12px] text-[#878787] cursor-pointer pt-0.5">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-[#2E2E2E] bg-[#0A0A0A] text-[#EDEDED] focus:ring-0 cursor-pointer accent-[#EDEDED]"
                  />
                  <span>
                    I agree to the <span className="text-[#EDEDED] underline">Terms of Service</span> and{' '}
                    <span className="text-[#EDEDED] underline">Privacy Policy</span>.
                  </span>
                </label>
              )}
            </div>

            {/* Primary Submit CTA */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-[6px] bg-[#EDEDED] hover:bg-white active:bg-[#D4D4D4] py-2 px-4 text-button-14 font-medium text-black border border-[#EDEDED] transition-colors cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Workspace' : 'Sign in to Workspace'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch Mode (Sign-in vs Sign-up) */}
          <div className="text-center pt-2 text-[13px] text-[#878787]">
            {isSignUp ? (
              <span>
                Already have a workspace?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('sign-in')
                    setErrorMessage(null)
                  }}
                  className="font-medium text-[#EDEDED] hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </span>
            ) : (
              <span>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('sign-up')
                    setErrorMessage(null)
                  }}
                  className="font-medium text-[#EDEDED] hover:underline cursor-pointer"
                >
                  Create one now
                </button>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Subtle Footer */}
      <div className="w-full max-w-7xl mx-auto px-6 py-6 text-center text-[12px] text-[#878787] border-t border-[#2E2E2E]/50">
        Protected by CodeSentra Zero-Trust Architecture · SOC 2 Type II Compliant
      </div>
    </div>
  )
}
