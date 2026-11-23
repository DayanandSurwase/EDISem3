import React, { useState } from 'react'
import {
  Activity,
  BarChart3,
  CheckSquare,
  ChevronDown,
  FileDiff,
  FolderGit2,
  GitBranch,
  GitCommitHorizontal,
  HardDriveUpload,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  Play,
  Search,
  ShieldAlert,
  Terminal,
  X,
} from 'lucide-react'
import type { ChangesetAnalysis, PageId } from '../../types/analysis'
import type { UserSession } from '../../types/auth'
import { PrimaryButton, RiskBadge } from '../ui/Primitives'

interface AppShellProps {
  user: UserSession
  onSignOut: () => void
  onViewLanding?: () => void
  activePage: PageId
  onNavigate: (page: PageId) => void
  changesets: ChangesetAnalysis[]
  selectedChangeset: ChangesetAnalysis
  onSelectChangeset: (id: string) => void
  selectedTestCount: number
  failedTestCount: number
  isRunningTests: boolean
  onRunSelectedTests: () => void
  globalQuery: string
  onGlobalQueryChange: (q: string) => void
  children: React.ReactNode
}

interface NavItem {
  id: PageId
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  badgeTone?: 'sage' | 'error' | 'neutral'
}

const METHOD_LABEL: Record<UserSession['method'], string> = {
  password: 'Email & password',
  sso: 'SAML single sign-on',
  passkey: 'Passkey',
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? '?').slice(0, 2)
  return letters.toUpperCase()
}

export function AppShell({
  user,
  onSignOut,
  onViewLanding,
  activePage,
  onNavigate,
  changesets,
  selectedChangeset,
  onSelectChangeset,
  selectedTestCount,
  failedTestCount,
  isRunningTests,
  onRunSelectedTests,
  globalQuery,
  onGlobalQueryChange,
  children,
}: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [prMenuOpen, setPrMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const navGroups: { heading: string; items: NavItem[] }[] = [
    {
      heading: 'Overview',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      heading: 'Repositories & Projects',
      items: [
        {
          id: 'projects',
          label: 'Projects',
          icon: FolderGit2,
        },
        {
          id: 'import-project',
          label: 'Import Project',
          icon: HardDriveUpload,
        },
      ],
    },
    {
      heading: 'Change Intelligence',
      items: [
        {
          id: 'code-comparison',
          label: 'Code Comparison',
          icon: FileDiff,
          badge: selectedChangeset.diffFiles.length,
          badgeTone: 'neutral',
        },
        {
          id: 'impact-analysis',
          label: 'Impact Analysis',
          icon: Activity,
          badge: selectedChangeset.impactedEntities.length,
          badgeTone: 'neutral',
        },
        {
          id: 'dependency-graph',
          label: 'Dependency Visualization',
          icon: Network,
          badge: selectedChangeset.graphNodes.length,
          badgeTone: 'neutral',
        },
        {
          id: 'ai-risk',
          label: 'AI Risk Assessment',
          icon: ShieldAlert,
          badge: selectedChangeset.overallRiskScore,
          badgeTone: selectedChangeset.overallRiskScore >= 70 ? 'error' : 'sage',
        },
      ],
    },
    {
      heading: 'Regression & Delivery',
      items: [
        {
          id: 'test-selection',
          label: 'Regression Test Selection',
          icon: CheckSquare,
          badge: selectedTestCount,
          badgeTone: 'sage',
        },
        {
          id: 'test-results',
          label: 'Test Execution Results',
          icon: Terminal,
          badge: isRunningTests ? 'RUN' : failedTestCount > 0 ? `${failedTestCount} FAIL` : 'PASS',
          badgeTone: isRunningTests ? 'sage' : failedTestCount > 0 ? 'error' : 'neutral',
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: BarChart3,
        },
      ],
    },
  ]

  const handleNavClick = (page: PageId) => {
    onNavigate(page)
    setMobileNavOpen(false)
  }

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col justify-between px-3.5 py-5">
      <div className="space-y-6">
        {navGroups.map((group) => (
          <div key={group.heading} className="space-y-1">
            <div className="px-2.5 py-1 text-label-12-mono uppercase tracking-[0.05em] text-[#878787]">
              {group.heading}
            </div>
            <nav className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = activePage === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`group flex w-full items-center justify-between rounded-[6px] px-2.5 py-1.5 text-left text-label-14 font-medium transition-colors cursor-pointer select-none ${
                      isActive
                        ? 'bg-[#1F1F1F] text-[#EDEDED] border border-[#2E2E2E]'
                        : 'text-[#878787] hover:text-[#EDEDED] hover:bg-[#111111] border border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isActive ? 'text-[#EDEDED]' : 'text-[#878787] group-hover:text-[#EDEDED]'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.badge !== undefined && (
                      <span
                        className={`ml-2 shrink-0 rounded-[4px] px-1.5 py-0.5 text-label-12-mono font-medium ${
                          item.badgeTone === 'error'
                            ? 'bg-[rgba(229,72,77,0.1)] text-[#E5484D] border border-[#E5484D]/30'
                            : item.badgeTone === 'sage'
                            ? 'bg-[rgba(0,113,246,0.1)] text-[#0071F6] border border-[#0071F6]/30'
                            : 'bg-[#111111] text-[#878787] border border-[#2E2E2E]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-[6px] bg-[#0A0A0A] border border-[#1F1F1F] p-3 space-y-2 text-[#A0A0A0]">
        <div className="flex items-center justify-between">
          <span className="text-label-12-mono uppercase tracking-[0.05em] text-[#878787]">
            Analysis Engine
          </span>
          <span className="inline-flex items-center gap-1.5 text-label-12 font-medium text-[#22A06B]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22A06B]" />
            Active
          </span>
        </div>
        <div className="text-label-13 font-medium text-[#EDEDED]">CodeSentra AST-RTS v4.2</div>
        <div className="text-copy-13 leading-relaxed text-[#878787]">
          Target: <span className="font-mono text-[12px] text-[#A0A0A0]">{selectedChangeset.repo}</span>
        </div>
        <div className="flex items-center justify-between border-t border-[#1F1F1F] pt-2 text-label-12-mono text-[#878787]">
          <span>Index State</span>
          <span className="text-[#0071F6]">SYNCHRONIZED</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#000000] text-[#EDEDED] flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-[#1F1F1F] bg-[#000000]/95 backdrop-blur-md">
        <div className="flex h-[56px] items-center justify-between gap-4 px-4 lg:px-6">
          {/* Brand + Mobile Trigger */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              aria-label="Toggle navigation"
              className="lg:hidden inline-flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#2E2E2E] bg-[#0A0A0A] text-[#A0A0A0] hover:text-[#EDEDED] cursor-pointer"
            >
              {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('dashboard')}
              className="flex items-center gap-2.5 text-left cursor-pointer select-none"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#111111] border border-[#2E2E2E]">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#EDEDED]" fill="none">
                  <path
                    d="M4 12h4l2.5-6 3.5 12 2.5-6H20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-label-16 font-semibold tracking-tight text-[#EDEDED]">CodeSentra</span>
                <span className="hidden sm:inline-block rounded-[4px] bg-[#111111] border border-[#2E2E2E] px-1.5 py-0.2 text-label-12-mono font-medium text-[#A0A0A0]">
                  AI
                </span>
              </div>
            </button>

            {/* Divider + PR Switcher */}
            <div className="hidden md:block h-5 w-px bg-[#1F1F1F] mx-1.5" />

            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setPrMenuOpen(!prMenuOpen)}
                className="flex items-center gap-2.5 rounded-[6px] border border-[#2E2E2E] bg-[#0A0A0A] hover:bg-[#111111] hover:border-[#454545] px-2.5 py-1.5 text-left transition-colors cursor-pointer"
              >
                <GitBranch className="h-3.5 w-3.5 text-[#0071F6] shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-label-13 font-semibold text-[#EDEDED]">
                      {selectedChangeset.prNumber}
                    </span>
                    <span className="font-mono text-copy-13 text-[#878787] truncate max-w-[180px]">
                      {selectedChangeset.branch}
                    </span>
                  </div>
                </div>
                <RiskBadge level={selectedChangeset.overallRiskLevel} />
                <ChevronDown className="h-3.5 w-3.5 text-[#878787]" />
              </button>

              {prMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setPrMenuOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 z-50 w-[420px] rounded-[8px] border border-[#2E2E2E] bg-[#0A0A0A] p-2 shadow-2xl">
                    <div className="px-2.5 py-1.5 text-label-12-mono uppercase tracking-[0.05em] text-[#878787]">
                      Active Pull Request Changesets
                    </div>
                    <div className="space-y-1">
                      {changesets.map((cs) => {
                        const active = cs.id === selectedChangeset.id
                        return (
                          <button
                            key={cs.id}
                            type="button"
                            onClick={() => {
                              onSelectChangeset(cs.id)
                              setPrMenuOpen(false)
                            }}
                            className={`w-full rounded-[6px] p-2 text-left transition-colors cursor-pointer ${
                              active
                                ? 'bg-[#1F1F1F] border border-[#454545]'
                                : 'hover:bg-[#111111] border border-transparent'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-label-13 font-semibold text-[#EDEDED]">
                                {cs.prNumber}{' '}
                                <span className="font-mono font-normal text-[#878787]">
                                  · {cs.commitSha}
                                </span>
                              </span>
                              <RiskBadge level={cs.overallRiskLevel} score={cs.overallRiskScore} />
                            </div>
                            <div className="mt-1 text-copy-13 text-[#A0A0A0] line-clamp-1">
                              {cs.title}
                            </div>
                            <div className="mt-1 flex items-center gap-3 text-label-12-mono text-[#878787]">
                              <span className="inline-flex items-center gap-1">
                                <GitCommitHorizontal className="h-3 w-3" />
                                {cs.author}
                              </span>
                              <span>{cs.timestamp}</span>
                              <span>{cs.diffFiles.length} files</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Search + Actions */}
          <div className="flex items-center gap-2.5">
            <div className="relative hidden xl:block w-[240px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#878787]" />
              <input
                type="text"
                value={globalQuery}
                onChange={(e) => onGlobalQueryChange(e.target.value)}
                placeholder="Filter symbols, tests..."
                className="w-full rounded-[6px] border border-[#2E2E2E] bg-[#0A0A0A] py-1 pl-8 pr-2.5 text-copy-13 text-[#EDEDED] placeholder-[#666666] focus:border-[#EDEDED] focus:outline-none transition-colors"
              />
            </div>

            {onViewLanding && (
              <button
                type="button"
                onClick={onViewLanding}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-[6px] border border-[#2E2E2E] bg-[#000000] px-2.5 h-8 text-button-12 font-medium text-[#A0A0A0] hover:text-[#EDEDED] hover:bg-[#111111] hover:border-[#454545] transition-colors cursor-pointer"
                title="View the public website"
              >
                <span>Public Site</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigate('import-project')}
              className="hidden md:inline-flex items-center gap-1.5 rounded-[6px] border border-[#2E2E2E] bg-[#000000] px-2.5 h-8 text-button-12 font-medium text-[#A0A0A0] hover:text-[#EDEDED] hover:bg-[#111111] hover:border-[#454545] transition-colors cursor-pointer"
              title="Import a new repository or project archive"
            >
              <HardDriveUpload className="h-3.5 w-3.5 text-[#EDEDED]" />
              <span>Import Project</span>
            </button>

            <PrimaryButton
              size="sm"
              onClick={onRunSelectedTests}
              disabled={isRunningTests || selectedTestCount === 0}
            >
              <Play className="h-3 w-3 fill-current" />
              <span className="hidden sm:inline">
                {isRunningTests ? 'Running Suite...' : `Run Selected (${selectedTestCount})`}
              </span>
              <span className="sm:hidden">{isRunningTests ? 'Running' : selectedTestCount}</span>
            </PrimaryButton>

            {/* Account menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                aria-label={`Account menu for ${user.name}`}
                className="flex items-center gap-1.5 rounded-full border border-[#2E2E2E] bg-[#0A0A0A] p-0.5 pr-2 transition-colors hover:border-[#454545] cursor-pointer"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1F1F1F] text-[10px] font-semibold text-[#EDEDED] border border-[#2E2E2E]">
                  {initialsOf(user.name)}
                </span>
                <ChevronDown
                  className={`h-3 w-3 text-[#878787] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div
                    role="menu"
                    className="absolute right-0 z-50 mt-2 w-[260px] rounded-[8px] border border-[#2E2E2E] bg-[#0A0A0A] p-3 shadow-2xl"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1F1F1F] text-[11px] font-semibold text-[#EDEDED] border border-[#2E2E2E]">
                        {initialsOf(user.name)}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-label-14 font-medium text-[#EDEDED]">{user.name}</div>
                        <div className="truncate text-copy-13 text-[#878787]">{user.email}</div>
                      </div>
                    </div>
                    <dl className="mt-3 space-y-1.5 border-y border-[#1F1F1F] py-2.5 text-copy-13">
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-[#878787]">Workspace</dt>
                        <dd className="truncate font-medium text-[#EDEDED]">
                          {user.organization || 'CodeSentra Team'}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-[#878787]">Method</dt>
                        <dd className="font-medium text-[#EDEDED]">{METHOD_LABEL[user.method]}</dd>
                      </div>
                    </dl>
                    <button
                      type="button"
                      className="mt-2.5 w-full rounded-[6px] border border-[#2E2E2E] bg-[#000000] hover:bg-[#111111] hover:border-[#454545] py-1.5 text-button-12 font-medium text-[#EDEDED] flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      onClick={() => {
                        setUserMenuOpen(false)
                        onSignOut()
                      }}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Changeset Strip */}
        <div className="flex md:hidden items-center justify-between gap-2 border-t border-[#1F1F1F] bg-[#0A0A0A] px-4 py-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <GitBranch className="h-3.5 w-3.5 text-[#0071F6] shrink-0" />
            <select
              aria-label="Select Pull Request"
              value={selectedChangeset.id}
              onChange={(e) => onSelectChangeset(e.target.value)}
              className="bg-transparent text-label-13 font-semibold text-[#EDEDED] focus:outline-none truncate"
            >
              {changesets.map((cs) => (
                <option key={cs.id} value={cs.id} className="bg-[#000000] text-[#EDEDED]">
                  {cs.prNumber} — {cs.branch}
                </option>
              ))}
            </select>
          </div>
          <RiskBadge level={selectedChangeset.overallRiskLevel} score={selectedChangeset.overallRiskScore} />
        </div>
      </header>

      {/* Workspace Layout */}
      <div className="flex flex-1 min-h-0 bg-[#000000]">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-[240px] shrink-0 border-r border-[#1F1F1F] bg-[#000000]">
          <div className="sticky top-[56px] h-[calc(100vh-56px)] overflow-y-auto">
            {renderSidebarContent()}
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
              onClick={() => setMobileNavOpen(false)}
            />
            <aside className="relative z-10 w-[260px] max-w-[85vw] bg-[#000000] border-r border-[#1F1F1F] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#1F1F1F] px-4 py-3">
                <span className="text-label-14 font-semibold text-[#EDEDED]">CodeSentra AI</span>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="text-[#878787] hover:text-[#EDEDED] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {renderSidebarContent()}
            </aside>
          </div>
        )}

        {/* Main Page Canvas */}
        <main className="flex-1 min-w-0 overflow-x-clip px-4 py-5 sm:px-6 lg:px-8 lg:py-6 bg-[#000000]">
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  )
}
