import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AuthPage } from './components/auth/AuthPage'
import { LandingPage } from './components/landing/LandingPage'
import { AppShell } from './components/layout/AppShell'
import { AiRiskAssessmentPage } from './components/pages/AiRiskAssessmentPage'
import { CodeComparisonPage } from './components/pages/CodeComparisonPage'
import { DashboardPage } from './components/pages/DashboardPage'
import { DependencyVisualizationPage } from './components/pages/DependencyVisualizationPage'
import { ImpactAnalysisPage } from './components/pages/ImpactAnalysisPage'
import { RegressionTestSelectionPage } from './components/pages/RegressionTestSelectionPage'
import { ReportsPage } from './components/pages/ReportsPage'
import { TestExecutionResultsPage } from './components/pages/TestExecutionResultsPage'
import { ImportProjectPage } from './components/projects/ImportProjectPage'
import { ProjectsPage } from './components/projects/ProjectsPage'
import { CHANGESETS, MODULE_HOTSPOTS, REPORT_TREND_DATA } from './data/mockPlatformData'
import type { ChangesetAnalysis, PageId } from './types/analysis'
import type { AuthMode, UserSession } from './types/auth'
import type { ProjectRecord } from './types/project'

const SESSION_KEY = 's7.pulse.session'

function readStoredSession(): UserSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY) ?? window.sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<UserSession>
    if (typeof parsed.name !== 'string' || typeof parsed.email !== 'string') return null
    return {
      name: parsed.name,
      email: parsed.email,
      organization: typeof parsed.organization === 'string' ? parsed.organization : '',
      method: parsed.method === 'sso' || parsed.method === 'passkey' ? parsed.method : 'password',
    }
  } catch {
    return null
  }
}

function projectToChangeset(project: ProjectRecord): ChangesetAnalysis {
  const existing = CHANGESETS.find(
    (c) => c.id === project.id || c.repo.toLowerCase() === project.name.toLowerCase()
  )
  if (existing) return existing

  const isHighRisk = project.filesCount > 15
  return {
    ...CHANGESETS[0],
    id: project.id,
    prNumber: project.metadata?.prNumber ? `PR #${project.metadata.prNumber}` : 'PR #101',
    title: `Diff comparison: ${project.baseRef} ... ${project.targetRef}`,
    branch: project.targetRef || 'feature/update',
    baseBranch: project.baseRef || 'main',
    commitSha: project.metadata?.commitSha || 'a4f912e',
    author: project.userId.split('@')[0] || 'developer',
    authorRole: 'Integration Contributor',
    timestamp: 'Just now',
    repo: project.repoUrl ? project.repoUrl.replace(/^https?:\/\/github\.com\//, '') : project.name,
    aiSummary: `Differential analysis for ${project.name} comparing baseline ${project.baseRef} to ${project.targetRef}. AST parser indexed ${project.filesCount || 8} files across ${project.language}.`,
    overallRiskScore: isHighRisk ? 74 : 48,
    overallRiskLevel: isHighRisk ? 'high' : 'medium',
  }
}

export default function App() {
  // Always open on the cinematic video landing page first on web launch
  const [session, setSession] = useState<UserSession | null>(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('dashboard=true')) {
      return readStoredSession()
    }
    return null
  })
  // Signed-out visitors start on the cinematic landing page, then pick Log in or Sign up.
  const [authView, setAuthView] = useState<'landing' | AuthMode>('landing')
  const [activePage, setActivePage] = useState<PageId>('dashboard')
  const [allChangesets, setAllChangesets] = useState<ChangesetAnalysis[]>(CHANGESETS)
  const [selectedChangesetId, setSelectedChangesetId] = useState<string>(CHANGESETS[0].id)
  const [threshold, setThreshold] = useState<number>(CHANGESETS[0].recommendedThreshold)
  const [manualOverrides, setManualOverrides] = useState<Record<string, boolean>>({})
  const [completedMitigations, setCompletedMitigations] = useState<Record<string, boolean>>({})
  const [globalQuery, setGlobalQuery] = useState('')

  const [isRunningTests, setIsRunningTests] = useState(false)
  const [runProgressPct, setRunProgressPct] = useState(100)
  const [runCount, setRunCount] = useState(1)
  const timerRef = useRef<number | null>(null)

  const selectedChangeset = useMemo(
    () => allChangesets.find((c) => c.id === selectedChangesetId) ?? allChangesets[0],
    [allChangesets, selectedChangesetId]
  )

  const handleSelectChangeset = (id: string) => {
    const next = allChangesets.find((c) => c.id === id)
    if (!next) return
    setSelectedChangesetId(id)
    setThreshold(next.recommendedThreshold)
    setManualOverrides({})
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsRunningTests(false)
    setRunProgressPct(100)
  }

  const handleProjectImported = (project: ProjectRecord) => {
    const cs = projectToChangeset(project)
    setAllChangesets((prev) => [cs, ...prev.filter((c) => c.id !== cs.id)])
    setSelectedChangesetId(cs.id)
    setActivePage('code-comparison')
  }

  const handleSelectProject = (project: ProjectRecord) => {
    const cs = projectToChangeset(project)
    setAllChangesets((prev) => [cs, ...prev.filter((c) => c.id !== cs.id)])
    setSelectedChangesetId(cs.id)
    setActivePage('code-comparison')
  }

  const selectedTests = useMemo(() => {
    return selectedChangeset.tests.filter((t) => {
      if (manualOverrides[t.id] !== undefined) return manualOverrides[t.id]
      return t.confidence >= threshold
    })
  }, [selectedChangeset, threshold, manualOverrides])

  const failedTestCount = useMemo(
    () => selectedTests.filter((t) => t.lastRunStatus === 'failed').length,
    [selectedTests]
  )

  const handleToggleManualOverride = (testId: string, nextSelected: boolean) => {
    setManualOverrides((prev) => ({ ...prev, [testId]: nextSelected }))
  }

  const handleToggleMitigation = (id: string) => {
    const defaultVal =
      selectedChangeset.mitigations.find((m) => m.id === id)?.completed ?? false
    setCompletedMitigations((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? defaultVal),
    }))
  }

  const handleRunSelectedTests = () => {
    if (selectedTests.length === 0) return
    if (timerRef.current) window.clearInterval(timerRef.current)
    setActivePage('test-results')
    setIsRunningTests(true)
    setRunProgressPct(8)
    setRunCount((c) => c + 1)

    let current = 8
    timerRef.current = window.setInterval(() => {
      current = Math.min(100, current + 18)
      setRunProgressPct(current)
      if (current >= 100) {
        if (timerRef.current) window.clearInterval(timerRef.current)
        timerRef.current = null
        setIsRunningTests(false)
      }
    }, 260)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [])

  const handleAuthenticated = (next: UserSession, remember: boolean) => {
    try {
      const target = remember ? window.localStorage : window.sessionStorage
      const other = remember ? window.sessionStorage : window.localStorage
      target.setItem(SESSION_KEY, JSON.stringify(next))
      other.removeItem(SESSION_KEY)
    } catch {
      // Storage can be unavailable (private mode); the session still lives in memory.
    }
    setActivePage('dashboard')
    setSession(next)
  }

  const handleSignOut = () => {
    try {
      window.localStorage.removeItem(SESSION_KEY)
      window.sessionStorage.removeItem(SESSION_KEY)
    } catch {
      // ignore
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsRunningTests(false)
    setRunProgressPct(100)
    setAuthView('landing')
    setSession(null)
  }

  if (!session) {
    if (authView === 'landing') {
      return (
        <LandingPage
          onAuth={setAuthView}
          onExploreDemo={() => {
            const demoUser: UserSession = {
              name: 'Elena Vance',
              email: 'elena.vance@acme.dev',
              organization: 'Acme Platform Engineering',
              method: 'passkey',
            }
            handleAuthenticated(demoUser, true)
          }}
        />
      )
    }
    return (
      <AuthPage
        key={authView}
        initialMode={authView}
        onAuthenticated={handleAuthenticated}
        onBack={() => setAuthView('landing')}
      />
    )
  }

  return (
    <AppShell
      user={session}
      onSignOut={handleSignOut}
      onViewLanding={() => setSession(null)}
      activePage={activePage}
      onNavigate={setActivePage}
      changesets={allChangesets}
      selectedChangeset={selectedChangeset}
      onSelectChangeset={handleSelectChangeset}
      selectedTestCount={selectedTests.length}
      failedTestCount={failedTestCount}
      isRunningTests={isRunningTests}
      onRunSelectedTests={handleRunSelectedTests}
      globalQuery={globalQuery}
      onGlobalQueryChange={setGlobalQuery}
    >
      {activePage === 'projects' && (
        <ProjectsPage
          user={session}
          onNavigate={setActivePage}
          onSelectProject={handleSelectProject}
        />
      )}
      {activePage === 'import-project' && (
        <ImportProjectPage
          user={session}
          onNavigate={setActivePage}
          onProjectImported={handleProjectImported}
        />
      )}
      {activePage === 'dashboard' && (
        <DashboardPage
          changeset={selectedChangeset}
          allChangesets={allChangesets}
          selectedTests={selectedTests}
          onSelectChangeset={handleSelectChangeset}
          onNavigate={setActivePage}
          onRunSelectedTests={handleRunSelectedTests}
        />
      )}
      {activePage === 'code-comparison' && (
        <CodeComparisonPage
          changeset={selectedChangeset}
          globalQuery={globalQuery}
          onNavigate={setActivePage}
        />
      )}
      {activePage === 'impact-analysis' && (
        <ImpactAnalysisPage
          changeset={selectedChangeset}
          globalQuery={globalQuery}
          onNavigate={setActivePage}
        />
      )}
      {activePage === 'dependency-graph' && (
        <DependencyVisualizationPage
          changeset={selectedChangeset}
          onNavigate={setActivePage}
        />
      )}
      {activePage === 'ai-risk' && (
        <AiRiskAssessmentPage
          changeset={selectedChangeset}
          completedMitigations={completedMitigations}
          onToggleMitigation={handleToggleMitigation}
          onNavigate={setActivePage}
          onRunSelectedTests={handleRunSelectedTests}
        />
      )}
      {activePage === 'test-selection' && (
        <RegressionTestSelectionPage
          changeset={selectedChangeset}
          threshold={threshold}
          onThresholdChange={setThreshold}
          manualOverrides={manualOverrides}
          onToggleManualOverride={handleToggleManualOverride}
          onResetOverrides={() => setManualOverrides({})}
          selectedTests={selectedTests}
          globalQuery={globalQuery}
          onRunSelectedTests={handleRunSelectedTests}
        />
      )}
      {activePage === 'test-results' && (
        <TestExecutionResultsPage
          changeset={selectedChangeset}
          selectedTests={selectedTests}
          isRunning={isRunningTests}
          runProgressPct={runProgressPct}
          runCount={runCount}
          onRunSelectedTests={handleRunSelectedTests}
          onNavigate={setActivePage}
        />
      )}
      {activePage === 'reports' && (
        <ReportsPage
          changeset={selectedChangeset}
          allChangesets={allChangesets}
          trendData={REPORT_TREND_DATA}
          hotspots={MODULE_HOTSPOTS}
        />
      )}
    </AppShell>
  )
}
