import React, { useState } from 'react'
import {
  Activity,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  FileCode2,
  FileDiff,
  FolderGit2,
  GitBranch,
  GitCommitHorizontal,
  GitPullRequest,
  HardDriveUpload,
  Layers,
  Link as LinkIcon,
  LogIn,
  Mail,
  Network,
  Play,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Terminal,
  UserPlus,
} from 'lucide-react'
import type { AuthMode } from '../../types/auth'

interface LandingPageProps {
  onAuth: (mode: AuthMode) => void
  onExploreDemo?: () => void
}

export function LandingPage({ onAuth, onExploreDemo }: LandingPageProps) {
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<'diff' | 'graph' | 'tests'>('diff')

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#050505] text-[#FAFAFA] font-sans antialiased selection:bg-[#111111] selection:text-white">
      {/* =========================================================================
          SECTION 1: HERO (CLEAR 4K CINEMATIC VIDEO · MINIMAL SITE HERO)
      ========================================================================== */}
      <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-[#050505] text-white flex flex-col justify-between border-b border-[#292929]">
        {/* Full-Section 4K Ultra-Crisp Background Video Layer (100% Clear, No Scrim Over Video Body) */}
        <div className="absolute inset-0 z-0 h-full w-full overflow-hidden pointer-events-none">
          <video
            src="/hero-cinematic-4k.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="h-full w-full object-cover contrast-[1.08] saturate-[1.1]"
            style={{
              imageRendering: '-webkit-optimize-contrast',
              transform: 'translateZ(0)',
              willChange: 'transform',
            }}
          />
          {/* Subtle bottom-only fade to transition smoothly into the dark section below */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(5,5,5,0) 0%, rgba(5,5,5,0.9) 100%)',
            }}
          />
        </div>

        {/* Navigation Bar inside Cinematic Hero (Edge-to-Edge: Logo on proper left, Auth CTAs on complete right) */}
        <header className="relative z-30 w-full border-b border-white/10 bg-black/25 backdrop-blur-md">
          <div className="flex h-16 w-full items-center justify-between px-6 sm:px-10 lg:px-12">
            {/* Brand Logo - Proper Left Side */}
            <div className="flex items-center gap-2.5 select-none">
              <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-white text-black shadow-sm">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                  <path
                    d="M4 12h4l2.5-6 3.5 12 2.5-6H20"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-sans text-[17px] font-semibold tracking-tight text-white">
                  CodeSentra
                </span>
                <span className="font-mono text-[11px] font-medium text-[#A1A1AA] tracking-wider uppercase">
                  AI
                </span>
              </div>
            </div>

            {/* Right Action CTAs: Direct Sign in and Sign up - Complete Right Side */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onAuth('sign-in')}
                className="inline-flex items-center gap-1.5 rounded-[6px] border border-white/15 bg-black/40 hover:bg-black/60 px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors cursor-pointer backdrop-blur-xs"
              >
                <LogIn className="h-3.5 w-3.5 text-[#A1A1AA]" />
                Sign in
              </button>
              <button
                type="button"
                onClick={() => onAuth('sign-up')}
                className="inline-flex items-center gap-1.5 rounded-[6px] bg-white hover:bg-[#F0F0F0] px-4 py-1.5 text-[13px] font-semibold text-[#111111] transition-all hover:scale-[1.02] cursor-pointer shadow-xs"
              >
                <UserPlus className="h-3.5 w-3.5 text-[#111111]" />
                Sign up
              </button>
            </div>
          </div>
        </header>

        {/* Hero Center Content: Name of Site + 1 Simple Line */}
        <div id="overview" className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
          <h1 className="text-[54px] sm:text-[76px] lg:text-[92px] font-semibold text-white tracking-tight leading-[1.05] drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
            CodeSentra AI
          </h1>

          <p className="mt-4 max-w-2xl text-[18px] sm:text-[22px] font-normal text-[#F4F4F5] leading-relaxed tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
            Understand the impact of every code change.
          </p>
        </div>

        {/* Bottom Scroll Down Indicator */}
        <div className="relative z-10 pb-8 flex justify-center">
          <button
            type="button"
            onClick={() => scrollToSection('capabilities')}
            className="flex flex-col items-center gap-1.5 font-mono text-[11px] text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
          >
            <span className="tracking-widest uppercase text-[10px]">EXPLORE PLATFORM</span>
            <ChevronDown className="h-4 w-4 text-white/80 animate-bounce" />
          </button>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: CORE CAPABILITIES (PREMIUM DARK THEME)
      ========================================================================== */}
      <section id="capabilities" className="py-24 lg:py-32 bg-[#050505] border-b border-[#292929]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Section Header */}
          <div className="max-w-3xl">
            <div className="font-mono text-[11px] font-semibold text-[#A1A1AA] tracking-[0.1em] uppercase">
              Core Capabilities
            </div>
            <h2 className="mt-3 text-[32px] sm:text-[40px] font-semibold text-[#FAFAFA] tracking-tight leading-[1.15]">
              From code changes to clearer testing decisions.
            </h2>
            <p className="mt-4 text-[16px] text-[#A1A1AA] leading-[26px]">
              Changes in one part of a codebase can affect components elsewhere. CodeSentra AI helps
              developers examine those relationships and understand which areas may need additional testing.
            </p>
          </div>

          {/* Feature Grid: 5 Professional Cards */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="rounded-[8px] border border-[#292929] bg-[#111111] p-7 transition-colors hover:border-[#3E3E3E]">
              <div className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#292929] bg-[#050505] text-[#FAFAFA]">
                <FileDiff className="h-5 w-5" />
              </div>
              <div className="mt-5 font-mono text-[11px] font-semibold text-[#A1A1AA] tracking-wider uppercase">
                FEATURE 01
              </div>
              <h3 className="mt-1.5 text-[18px] font-semibold text-[#FAFAFA]">
                Code Change Analysis
              </h3>
              <p className="mt-2 text-[14px] leading-[23px] text-[#A1A1AA]">
                Compare two code revisions and inspect modifications across files and functions.
              </p>
              <div className="mt-6 rounded-[6px] border border-[#292929] bg-[#050505] p-3 font-mono text-[11.5px] text-[#A1A1AA]">
                <code>git diff ref/base..ref/head</code>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="rounded-[8px] border border-[#292929] bg-[#111111] p-7 transition-colors hover:border-[#3E3E3E]">
              <div className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#292929] bg-[#050505] text-[#FAFAFA]">
                <Network className="h-5 w-5" />
              </div>
              <div className="mt-5 font-mono text-[11px] font-semibold text-[#A1A1AA] tracking-wider uppercase">
                FEATURE 02
              </div>
              <h3 className="mt-1.5 text-[18px] font-semibold text-[#FAFAFA]">
                Dependency Mapping
              </h3>
              <p className="mt-2 text-[14px] leading-[23px] text-[#A1A1AA]">
                Explore relationships between software components to understand how changes may propagate.
              </p>
              <div className="mt-6 rounded-[6px] border border-[#292929] bg-[#050505] p-3 font-mono text-[11.5px] text-[#A1A1AA]">
                <code>Callers: 0-Hop, 1-Hop, 2-Hop</code>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="rounded-[8px] border border-[#292929] bg-[#111111] p-7 transition-colors hover:border-[#3E3E3E]">
              <div className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#292929] bg-[#050505] text-[#FAFAFA]">
                <Activity className="h-5 w-5" />
              </div>
              <div className="mt-5 font-mono text-[11px] font-semibold text-[#A1A1AA] tracking-wider uppercase">
                FEATURE 03
              </div>
              <h3 className="mt-1.5 text-[18px] font-semibold text-[#FAFAFA]">
                Change Impact Assessment
              </h3>
              <p className="mt-2 text-[14px] leading-[23px] text-[#A1A1AA]">
                Identify components potentially affected by a modification and review the evidence behind the analysis.
              </p>
              <div className="mt-6 rounded-[6px] border border-[#292929] bg-[#050505] p-3 font-mono text-[11.5px] text-[#A1A1AA]">
                <code>Blast radius: 3 modules affected</code>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="rounded-[8px] border border-[#292929] bg-[#111111] p-7 transition-colors hover:border-[#3E3E3E]">
              <div className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#292929] bg-[#050505] text-[#FAFAFA]">
                <Layers className="h-5 w-5" />
              </div>
              <div className="mt-5 font-mono text-[11px] font-semibold text-[#A1A1AA] tracking-wider uppercase">
                FEATURE 04
              </div>
              <h3 className="mt-1.5 text-[18px] font-semibold text-[#FAFAFA]">
                Regression Test Selection
              </h3>
              <p className="mt-2 text-[14px] leading-[23px] text-[#A1A1AA]">
                Identify and prioritize relevant test cases using available code-change, dependency, and testing information.
              </p>
              <div className="mt-6 rounded-[6px] border border-[#292929] bg-[#050505] p-3 font-mono text-[11.5px] text-[#A1A1AA]">
                <code>Select tests matching threshold</code>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="rounded-[8px] border border-[#292929] bg-[#111111] p-7 transition-colors hover:border-[#3E3E3E] md:col-span-2 lg:col-span-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#292929] bg-[#050505] text-[#FAFAFA]">
                <Shield className="h-5 w-5" />
              </div>
              <div className="mt-5 font-mono text-[11px] font-semibold text-[#A1A1AA] tracking-wider uppercase">
                FEATURE 05
              </div>
              <h3 className="mt-1.5 text-[18px] font-semibold text-[#FAFAFA]">
                Risk Assessment
              </h3>
              <p className="mt-2 text-[14px] leading-[23px] text-[#A1A1AA]">
                Review risk indicators where supported by the configured analysis engine.
              </p>
              <div className="mt-6 rounded-[6px] border border-[#292929] bg-[#050505] p-3 font-mono text-[11.5px] text-[#A1A1AA]">
                <code>Risk level: Low / Medium / High</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: HOW IT WORKS (HORIZONTAL PROCESS ON DESKTOP)
      ========================================================================== */}
      <section id="workflow" className="py-24 lg:py-32 bg-[#050505] border-b border-[#292929]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="font-mono text-[11px] font-semibold text-[#A1A1AA] tracking-[0.1em] uppercase">
              Workflow
            </div>
            <h2 className="mt-3 text-[32px] sm:text-[40px] font-semibold text-[#FAFAFA] tracking-tight leading-[1.15]">
              A clearer path from change to test.
            </h2>
            <p className="mt-4 text-[16px] text-[#A1A1AA] leading-[26px]">
              Bring your code into the workspace, compare revisions, and review the areas that deserve attention.
            </p>
          </div>

          {/* 4 Connected Process Steps */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Import Your Code',
                desc: 'Connect a supported GitHub repository or upload project snapshots.',
              },
              {
                step: '02',
                title: 'Compare Revisions',
                desc: 'Examine the differences between the baseline and updated code.',
              },
              {
                step: '03',
                title: 'Explore Impact',
                desc: 'Review changed components and the dependencies associated with them.',
              },
              {
                step: '04',
                title: 'Review Test Selection',
                desc: 'Examine relevant regression tests and the available selection evidence.',
              },
            ].map((st) => (
              <div
                key={st.step}
                className="relative rounded-[8px] border border-[#292929] bg-[#111111] p-6 space-y-3 transition-colors hover:border-[#3E3E3E]"
              >
                <div className="font-mono text-[28px] font-semibold text-[#FAFAFA]/70">
                  {st.step}
                </div>
                <h3 className="text-[17px] font-semibold text-[#FAFAFA]">{st.title}</h3>
                <p className="text-[13.5px] leading-[22px] text-[#A1A1AA]">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: PRODUCT SHOWCASE (ALTERNATING LARGE EDITORIAL LAYOUTS)
      ========================================================================== */}
      <section id="showcase" className="py-24 lg:py-32 bg-[#050505] border-b border-[#292929]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-24 lg:space-y-32">
          {/* Section Header */}
          <div className="max-w-3xl">
            <div className="font-mono text-[11px] font-semibold text-[#A1A1AA] tracking-[0.1em] uppercase">
              Product Showcase
            </div>
            <h2 className="mt-3 text-[32px] sm:text-[40px] font-semibold text-[#FAFAFA] tracking-tight leading-[1.15]">
              Engineered for source-level clarity.
            </h2>
            <p className="mt-4 text-[16px] text-[#A1A1AA] leading-[26px]">
              Inspect realistic previews of the core developer tools built directly into CodeSentra AI.
            </p>
          </div>

          {/* EDITORIAL 1: Code Diff Viewer (Text Left, UI Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="font-mono text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider">
                01 / Source Code Diff
              </span>
              <h3 className="text-[26px] font-semibold text-[#FAFAFA] tracking-tight leading-snug">
                Side-by-side and unified revision comparisons.
              </h3>
              <p className="text-[15px] leading-[24px] text-[#A1A1AA]">
                Pinpoint exact modifications across modified functions and files. Review additions,
                deletions, and semantic syntax mutations with line-by-line precision.
              </p>
            </div>

            <div className="lg:col-span-7 rounded-[8px] border border-[#292929] bg-[#111111] p-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#292929] pb-3 text-[12px] font-mono text-[#A1A1AA]">
                <div className="flex items-center gap-2">
                  <FileCode2 className="h-4 w-4 text-[#FAFAFA]" />
                  <span className="text-[#FAFAFA]">services/payment_gateway.py</span>
                </div>
                <span>Lines 142–158</span>
              </div>

              <div className="mt-3 rounded-[6px] border border-[#292929] bg-[#050505] p-3.5 font-mono text-[12px] leading-[22px]">
                <div className="text-[#666666]">@@ -142,5 +142,6 @@ def process_transaction(amount, currency):</div>
                <div className="text-[#A1A1AA]">      ledger_entry = self.ledger.draft(amount, currency)</div>
                <div className="bg-[#DC5555]/15 text-[#DC5555] px-1.5 rounded -mx-1.5">
                  -   if not self.gateway.is_active: raise GatewayDown()
                </div>
                <div className="bg-[#22A06B]/15 text-[#22A06B] px-1.5 rounded -mx-1.5">
                  +   if not self.gateway.is_active or self.gateway.degraded:
                </div>
                <div className="bg-[#22A06B]/15 text-[#22A06B] px-1.5 rounded -mx-1.5">
                  +       return self.fallback_router.route(ledger_entry)
                </div>
                <div className="text-[#A1A1AA]">      return self.gateway.dispatch(ledger_entry)</div>
              </div>
            </div>
          </div>

          {/* EDITORIAL 2: Dependency Impact Graph (UI Left, Text Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 order-2 lg:order-1 rounded-[8px] border border-[#292929] bg-[#111111] p-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#292929] pb-3 text-[12px] font-mono text-[#A1A1AA]">
                <span className="text-[#FAFAFA]">Component Call Trace</span>
                <span>Active Changeset Topology</span>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-[6px] border border-[#4169E1]/50 bg-[#050505] p-3.5 space-y-1.5">
                  <div className="font-mono text-[10px] uppercase text-[#4169E1]">0-Hop Modified</div>
                  <div className="font-mono text-[13px] font-semibold text-[#FAFAFA]">PaymentGateway</div>
                  <div className="text-[11px] text-[#A1A1AA]">process_transaction()</div>
                </div>

                <div className="rounded-[6px] border border-[#292929] bg-[#050505] p-3.5 space-y-1.5">
                  <div className="font-mono text-[10px] uppercase text-[#A1A1AA]">1-Hop Caller</div>
                  <div className="font-mono text-[13px] font-semibold text-[#FAFAFA]">CheckoutService</div>
                  <div className="text-[11px] text-[#A1A1AA]">submit_order()</div>
                </div>

                <div className="rounded-[6px] border border-[#292929] bg-[#050505] p-3.5 space-y-1.5">
                  <div className="font-mono text-[10px] uppercase text-[#A1A1AA]">Persistence Store</div>
                  <div className="font-mono text-[13px] font-semibold text-[#FAFAFA]">LedgerDB</div>
                  <div className="text-[11px] text-[#A1A1AA]">commit_entry()</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 order-1 lg:order-2 space-y-4">
              <span className="font-mono text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider">
                02 / Dependency Graph
              </span>
              <h3 className="text-[26px] font-semibold text-[#FAFAFA] tracking-tight leading-snug">
                Trace software relationships and blast radius.
              </h3>
              <p className="text-[15px] leading-[24px] text-[#A1A1AA]">
                Examine upstream callers and downstream consumers linked to modified symbols. Visualize
                how changes may propagate across services before tests are run.
              </p>
            </div>
          </div>

          {/* EDITORIAL 3: Regression Test Selection (Text Left, UI Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="font-mono text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider">
                03 / Test Prioritization
              </span>
              <h3 className="text-[26px] font-semibold text-[#FAFAFA] tracking-tight leading-snug">
                Prioritize tests with evidence-backed ranking.
              </h3>
              <p className="text-[15px] leading-[24px] text-[#A1A1AA]">
                Review the regression test cases selected by the engine. Adjust the selection confidence
                threshold to suit your merge cadence and test execution budget.
              </p>
            </div>

            <div className="lg:col-span-7 rounded-[8px] border border-[#292929] bg-[#111111] p-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#292929] pb-3 text-[12px] font-mono text-[#A1A1AA]">
                <span className="text-[#FAFAFA]">Selected Regression Tests</span>
                <span>Threshold: 72%</span>
              </div>

              <div className="mt-3 space-y-2">
                {[
                  { name: 'test_fallback_router_on_gateway_degraded.py', confidence: '98%', status: 'Direct Caller' },
                  { name: 'test_checkout_concurrency.py', confidence: '89%', status: '1-Hop Dependency' },
                  { name: 'test_ledger_draft_rollback.py', confidence: '74%', status: 'State Integrity' },
                ].map((test, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-[6px] border border-[#292929] bg-[#050505] p-3 text-[12px] font-mono"
                  >
                    <span className="text-[#FAFAFA] truncate max-w-[280px]">{test.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[#A1A1AA] text-[11px] hidden sm:inline">{test.status}</span>
                      <span className="rounded bg-[#111111] border border-[#292929] px-2 py-0.5 text-[#FAFAFA]">
                        {test.confidence}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: PROJECT IMPORT SECTION
      ========================================================================== */}
      <section id="import" className="py-24 lg:py-32 bg-[#050505] border-b border-[#292929]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="font-mono text-[11px] font-semibold text-[#A1A1AA] tracking-[0.1em] uppercase">
              Integration
            </div>
            <h2 className="mt-3 text-[32px] sm:text-[40px] font-semibold text-[#FAFAFA] tracking-tight leading-[1.15]">
              Start with your code.
            </h2>
            <p className="mt-4 text-[16px] text-[#A1A1AA] leading-[26px]">
              Import a repository or upload project versions to begin exploring code changes.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Option 1: GitHub */}
            <div className="rounded-[8px] border border-[#292929] bg-[#111111] p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#292929] bg-[#050505] text-[#FAFAFA]">
                  <FolderGit2 className="h-5 w-5" />
                </div>
                <h3 className="text-[18px] font-semibold text-[#FAFAFA]">Connect GitHub</h3>
                <p className="text-[13.5px] leading-[22px] text-[#A1A1AA]">
                  Connect your GitHub repositories to track branch diffs and pull requests directly in the workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onAuth('sign-in')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-[6px] border border-[#292929] bg-[#050505] hover:bg-[#1A1A1A] hover:border-[#3E3E3E] py-2 px-3 text-[13px] font-medium text-[#FAFAFA] transition-colors cursor-pointer"
              >
                Connect GitHub
              </button>
            </div>

            {/* Option 2: Public URL */}
            <div className="rounded-[8px] border border-[#292929] bg-[#111111] p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#292929] bg-[#050505] text-[#FAFAFA]">
                  <LinkIcon className="h-5 w-5" />
                </div>
                <h3 className="text-[18px] font-semibold text-[#FAFAFA]">Import Public Repository URL</h3>
                <p className="text-[13.5px] leading-[22px] text-[#A1A1AA]">
                  Provide any public Git repository URL over HTTPS to parse code differences and dependency structures.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onAuth('sign-in')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-[6px] border border-[#292929] bg-[#050505] hover:bg-[#1A1A1A] hover:border-[#3E3E3E] py-2 px-3 text-[13px] font-medium text-[#FAFAFA] transition-colors cursor-pointer"
              >
                Import URL
              </button>
            </div>

            {/* Option 3: ZIP Snapshot */}
            <div className="rounded-[8px] border border-[#292929] bg-[#111111] p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#292929] bg-[#050505] text-[#FAFAFA]">
                  <HardDriveUpload className="h-5 w-5" />
                </div>
                <h3 className="text-[18px] font-semibold text-[#FAFAFA]">Upload Project ZIP</h3>
                <p className="text-[13.5px] leading-[22px] text-[#A1A1AA]">
                  Upload project snapshot archives for direct local file comparison without connecting an external remote.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onAuth('sign-in')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-[6px] border border-[#292929] bg-[#050505] hover:bg-[#1A1A1A] hover:border-[#3E3E3E] py-2 px-3 text-[13px] font-medium text-[#FAFAFA] transition-colors cursor-pointer"
              >
                Upload Snapshot
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: FINAL CALL TO ACTION
      ========================================================================== */}
      <section className="py-24 lg:py-32 bg-[#050505]">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="rounded-[8px] border border-[#292929] bg-[#111111] p-10 sm:p-14 text-center space-y-6">
            <h2 className="text-[32px] sm:text-[42px] font-semibold text-[#FAFAFA] tracking-tight leading-[1.15]">
              Make every code change easier to understand.
            </h2>
            <p className="mx-auto max-w-xl text-[16px] text-[#A1A1AA] leading-[26px]">
              Bring code comparison, dependency analysis, and regression test selection into one workspace.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => onAuth('sign-in')}
                className="inline-flex items-center justify-center gap-2 rounded-[6px] bg-[#FAFAFA] hover:bg-white px-6 py-2.5 text-[14px] font-medium text-[#111111] transition-colors cursor-pointer shadow-xs"
              >
                Open CodeSentra AI
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onAuth('sign-up')}
                className="inline-flex items-center justify-center gap-2 rounded-[6px] border border-[#292929] bg-[#050505] hover:bg-[#1A1A1A] hover:border-[#3E3E3E] px-6 py-2.5 text-[14px] font-medium text-[#FAFAFA] transition-colors cursor-pointer"
              >
                Create an Account
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: MINIMAL ENTERPRISE FOOTER
      ========================================================================== */}
      <footer className="border-t border-[#292929] bg-[#050505] py-12 text-[#A1A1AA] text-[13px]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-[#111111] border border-[#292929] text-white">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
                <path
                  d="M4 12h4l2.5-6 3.5 12 2.5-6H20"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="font-semibold text-[#FAFAFA]">CodeSentra AI</span>
            <span>·</span>
            <span>Code Change Impact & Regression Test Selection</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[12px] text-[#A1A1AA]">
            <span className="h-2 w-2 rounded-full bg-[#22A06B]" />
            Analysis Engine Ready
          </div>
        </div>
      </footer>
    </div>
  )
}
