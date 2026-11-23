import React, { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  FolderGit2,
  GitBranch,
  GitCommitHorizontal,
  GitPullRequest,
  Globe,
  HardDriveUpload,
  Info,
  KeyRound,
  Layers,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react'
import type { PageId } from '../../types/analysis'
import type { UserSession } from '../../types/auth'
import type {
  GitHubBranch,
  GitHubCommit,
  GitHubRepository,
  LocalProjectUploadState,
  ProjectRecord,
} from '../../types/project'
import {
  fetchPublicRepository,
  fetchRepositoryBranches,
  fetchRepositoryCommits,
  fetchUserRepositories,
  parseGitHubUrl,
} from '../../services/githubService'
import { isSupabaseConfigured, saveProjectRecord, uploadProjectArchive } from '../../lib/supabase'
import { Card, Chip, PrimaryButton, SecondaryButton, SectionHeader } from '../ui/Primitives'

function GithubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

interface ImportProjectPageProps {
  user: UserSession
  onNavigate: (page: PageId) => void
  onProjectImported: (project: ProjectRecord) => void
}

type ImportTab = 'github_connect' | 'github_url' | 'local_upload'

export function ImportProjectPage({ user, onNavigate, onProjectImported }: ImportProjectPageProps) {
  const [activeTab, setActiveTab] = useState<ImportTab>('github_url')
  const [successProject, setSuccessProject] = useState<ProjectRecord | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)

  // --------------------------------------------------------------------------
  // TAB 1: GitHub Connect State
  // --------------------------------------------------------------------------
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem('s7.github_token') || '')
  const [isConnected, setIsConnected] = useState(Boolean(githubToken))
  const [userRepos, setUserRepos] = useState<GitHubRepository[]>([])
  const [repoSearchQuery, setRepoSearchQuery] = useState('')
  const [isLoadingRepos, setIsLoadingRepos] = useState(false)
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepository | null>(null)
  const [connectBranches, setConnectBranches] = useState<GitHubBranch[]>([])
  const [connectBaseBranch, setConnectBaseBranch] = useState('main')
  const [connectTargetBranch, setConnectTargetBranch] = useState('')
  const [connectError, setConnectError] = useState<string | null>(null)

  // --------------------------------------------------------------------------
  // TAB 2: Public GitHub URL State
  // --------------------------------------------------------------------------
  const [publicUrlInput, setPublicUrlInput] = useState('')
  const [isFetchingUrlRepo, setIsFetchingUrlRepo] = useState(false)
  const [urlRepoData, setUrlRepoData] = useState<GitHubRepository | null>(null)
  const [urlBranches, setUrlBranches] = useState<GitHubBranch[]>([])
  const [urlCommits, setUrlCommits] = useState<GitHubCommit[]>([])
  const [urlBaseRef, setUrlBaseRef] = useState('main')
  const [urlTargetRef, setUrlTargetRef] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)

  // --------------------------------------------------------------------------
  // TAB 3: Local Upload State
  // --------------------------------------------------------------------------
  const [uploadState, setUploadState] = useState<LocalProjectUploadState>({
    baselineFile: null,
    targetFile: null,
    baselineProgress: 0,
    targetProgress: 0,
    status: 'idle',
  })
  const [localProjectName, setLocalProjectName] = useState('')
  const [localProjectLang, setLocalProjectLang] = useState('TypeScript')
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Load user repos if token is present
  useEffect(() => {
    if (githubToken && isConnected) {
      loadUserRepositories(githubToken)
    }
  }, [isConnected])

  const loadUserRepositories = async (token: string) => {
    setIsLoadingRepos(true)
    setConnectError(null)
    const result = await fetchUserRepositories(token)
    setIsLoadingRepos(false)
    if (result.success && result.data) {
      setUserRepos(result.data)
    } else {
      setConnectError(result.error || 'Failed to fetch repositories with the provided token.')
    }
  }

  const handleConnectToken = async () => {
    if (!githubToken.trim()) {
      setConnectError('Please enter a GitHub personal access token or configure OAuth.')
      return
    }
    localStorage.setItem('s7.github_token', githubToken.trim())
    setIsConnected(true)
    await loadUserRepositories(githubToken.trim())
  }

  const handleDisconnectGitHub = () => {
    localStorage.removeItem('s7.github_token')
    setGithubToken('')
    setIsConnected(false)
    setUserRepos([])
    setSelectedRepo(null)
  }

  // When repo is selected in Tab 1
  const handleSelectConnectRepo = async (repo: GitHubRepository) => {
    setSelectedRepo(repo)
    setConnectBaseBranch(repo.defaultBranch || 'main')
    setConnectTargetBranch('')
    const branchRes = await fetchRepositoryBranches(repo.owner.login, repo.name, githubToken)
    if (branchRes.success && branchRes.data) {
      setConnectBranches(branchRes.data)
      const other = branchRes.data.find((b) => b.name !== repo.defaultBranch)
      if (other) setConnectTargetBranch(other.name)
    }
  }

  // Fetch Public GitHub URL
  const handleInspectPublicUrl = async () => {
    setUrlError(null)
    const parsed = parseGitHubUrl(publicUrlInput)
    if (!parsed) {
      setUrlError('Please enter a valid GitHub repository URL (e.g. https://github.com/owner/repository).')
      return
    }

    setIsFetchingUrlRepo(true)
    const repoRes = await fetchPublicRepository(parsed.owner, parsed.repo, githubToken || undefined)
    setIsFetchingUrlRepo(false)

    if (!repoRes.success || !repoRes.data) {
      setUrlError(repoRes.error || 'Unable to inspect repository. Ensure it is public.')
      setUrlRepoData(null)
      return
    }

    const repo = repoRes.data
    setUrlRepoData(repo)
    setUrlBaseRef(repo.defaultBranch || 'main')

    // Fetch branches and recent commits in parallel
    const [branchesRes, commitsRes] = await Promise.all([
      fetchRepositoryBranches(parsed.owner, parsed.repo, githubToken || undefined),
      fetchRepositoryCommits(parsed.owner, parsed.repo, undefined, githubToken || undefined),
    ])

    if (branchesRes.success && branchesRes.data) {
      setUrlBranches(branchesRes.data)
      const target = branchesRes.data.find((b) => b.name !== repo.defaultBranch)
      setUrlTargetRef(target ? target.name : branchesRes.data[0]?.name || 'HEAD')
    }
    if (commitsRes.success && commitsRes.data) {
      setUrlCommits(commitsRes.data)
    }
  }

  // Handle Tab 1 Import Submission
  const handleSubmitConnectImport = async () => {
    if (!selectedRepo) return
    setIsSubmitting(true)
    setGeneralError(null)

    const targetBranch = connectTargetBranch || selectedRepo.defaultBranch
    const result = await saveProjectRecord({
      userId: user.email || 'guest',
      name: selectedRepo.name,
      description: selectedRepo.description || `Imported from ${selectedRepo.fullName}`,
      sourceType: 'github_oauth',
      repoUrl: selectedRepo.htmlUrl,
      defaultBranch: selectedRepo.defaultBranch,
      baseRef: connectBaseBranch,
      targetRef: targetBranch,
      language: selectedRepo.language || 'TypeScript',
      status: 'ready',
      filesCount: Math.max(12, Math.round(selectedRepo.sizeKb / 18)),
      metadata: {
        githubOwner: selectedRepo.owner.login,
        githubRepo: selectedRepo.name,
        stars: selectedRepo.stargazersCount,
        commitSha: connectBranches.find((b) => b.name === targetBranch)?.commitSha,
      },
    })

    setIsSubmitting(false)
    if (result.success && result.data) {
      setSuccessProject(result.data)
      onProjectImported(result.data)
    } else {
      setGeneralError(result.error || 'Failed to save project record.')
    }
  }

  // Handle Tab 2 Import Submission
  const handleSubmitUrlImport = async () => {
    if (!urlRepoData) return
    setIsSubmitting(true)
    setGeneralError(null)

    const result = await saveProjectRecord({
      userId: user.email || 'guest',
      name: urlRepoData.name,
      description: urlRepoData.description || `Public repository ${urlRepoData.fullName}`,
      sourceType: 'github_url',
      repoUrl: urlRepoData.htmlUrl,
      defaultBranch: urlRepoData.defaultBranch,
      baseRef: urlBaseRef,
      targetRef: urlTargetRef || urlBaseRef,
      language: urlRepoData.language || 'TypeScript',
      status: 'ready',
      filesCount: Math.max(15, Math.round(urlRepoData.sizeKb / 22)),
      metadata: {
        githubOwner: urlRepoData.owner.login,
        githubRepo: urlRepoData.name,
        stars: urlRepoData.stargazersCount,
        commitSha: urlBranches.find((b) => b.name === urlTargetRef)?.commitSha || urlCommits[0]?.sha,
      },
    })

    setIsSubmitting(false)
    if (result.success && result.data) {
      setSuccessProject(result.data)
      onProjectImported(result.data)
    } else {
      setGeneralError(result.error || 'Failed to import public GitHub repository.')
    }
  }

  // Handle Tab 3 File Selection & Validation
  const validateZipFile = (file: File): string | null => {
    const validExtensions = ['.zip', '.tar.gz', '.tgz']
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    if (!hasValidExt) {
      return `Invalid file format (${file.name}). Please provide a .zip or .tar.gz archive.`
    }
    const maxBytes = 100 * 1024 * 1024 // 100MB
    if (file.size > maxBytes) {
      return `File too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Limit is 100 MB.`
    }
    return null
  }

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>, variant: 'baseline' | 'target') => {
    e.preventDefault()
    setUploadError(null)
    const file = e.dataTransfer.files[0]
    if (!file) return

    const err = validateZipFile(file)
    if (err) {
      setUploadError(err)
      return
    }

    if (variant === 'baseline') {
      setUploadState((s) => ({ ...s, baselineFile: file, baselineProgress: 100 }))
      if (!localProjectName) {
        setLocalProjectName(file.name.replace(/\.(zip|tar\.gz|tgz)$/i, ''))
      }
    } else {
      setUploadState((s) => ({ ...s, targetFile: file, targetProgress: 100 }))
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, variant: 'baseline' | 'target') => {
    setUploadError(null)
    const file = e.target.files?.[0]
    if (!file) return

    const err = validateZipFile(file)
    if (err) {
      setUploadError(err)
      return
    }

    if (variant === 'baseline') {
      setUploadState((s) => ({ ...s, baselineFile: file, baselineProgress: 100 }))
      if (!localProjectName) {
        setLocalProjectName(file.name.replace(/\.(zip|tar\.gz|tgz)$/i, ''))
      }
    } else {
      setUploadState((s) => ({ ...s, targetFile: file, targetProgress: 100 }))
    }
  }

  const handleLocalUploadSubmit = async () => {
    if (!uploadState.baselineFile) {
      setUploadError('Please select at least a baseline project ZIP archive.')
      return
    }
    if (!localProjectName.trim()) {
      setUploadError('Please specify a project name.')
      return
    }

    setIsSubmitting(true)
    setUploadError(null)
    setGeneralError(null)

    const tempProjId = `proj_${Date.now()}`

    // Upload baseline archive to Supabase Storage (with fallback)
    const uploadRes = await uploadProjectArchive(
      uploadState.baselineFile,
      user.email || 'guest',
      tempProjId,
      'baseline'
    )

    let targetUploadPath = ''
    if (uploadState.targetFile) {
      const targetRes = await uploadProjectArchive(
        uploadState.targetFile,
        user.email || 'guest',
        tempProjId,
        'target'
      )
      targetUploadPath = targetRes.path || ''
    }

    const result = await saveProjectRecord({
      userId: user.email || 'guest',
      name: localProjectName.trim(),
      description: `Uploaded archive: ${uploadState.baselineFile.name}${
        uploadState.targetFile ? ` compared against ${uploadState.targetFile.name}` : ''
      }`,
      sourceType: 'local_upload',
      baseRef: 'baseline (v1.0.0)',
      targetRef: uploadState.targetFile ? 'updated (v1.1.0)' : 'current working tree',
      language: localProjectLang,
      status: 'ready',
      filesCount: Math.round(uploadState.baselineFile.size / (1024 * 14)) || 24,
      storagePath: uploadRes.path,
      metadata: {
        baselineArchiveName: uploadState.baselineFile.name,
        targetArchiveName: uploadState.targetFile?.name,
        archiveSizeBytes: uploadState.baselineFile.size + (uploadState.targetFile?.size || 0),
      },
    })

    setIsSubmitting(false)
    if (result.success && result.data) {
      setSuccessProject(result.data)
      onProjectImported(result.data)
    } else {
      setUploadError(result.error || 'Failed to save uploaded project.')
    }
  }

  // Filter accessible repos in Tab 1
  const filteredUserRepos = userRepos.filter((r) =>
    r.fullName.toLowerCase().includes(repoSearchQuery.toLowerCase()) ||
    (r.language && r.language.toLowerCase().includes(repoSearchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <SectionHeader
        kicker="Project Integration & Ingestion"
        title="Import"
        highlight="Project"
        description="Connect repositories via GitHub App, import public GitHub repositories, or upload local project archives for regression impact analysis."
        actions={
          <SecondaryButton size="sm" onClick={() => onNavigate('projects')}>
            <Layers className="h-4 w-4" />
            View All Projects
          </SecondaryButton>
        }
      />

      {/* Backend Integration Status Banner */}
      <div className="rounded-[8px] border border-[#2E2E2E] bg-[#000000] p-4 flex flex-wrap items-center justify-between gap-4 text-[13px]">
        <div className="flex items-center gap-3">
          <div
            className={`h-2.5 w-2.5 rounded-full ${
              isSupabaseConfigured() ? 'bg-[#22A06B]' : 'bg-[#D97706]'
            }`}
          />
          <div>
            <span className="font-semibold text-[#EDEDED]">Supabase Integration: </span>
            <span className="text-[#878787]">
              {isSupabaseConfigured()
                ? 'Connected to PostgreSQL & Storage Buckets (RLS Active)'
                : 'Local Secure State Active (Configure VITE_SUPABASE_* in .env to connect cloud instance)'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-[#878787]">
          <span>Storage: </span>
          <span className="text-[#38BDF8]">project-archives</span>
        </div>
      </div>

      {generalError && (
        <div className="rounded-[6px] border border-[#DC5555]/30 bg-[#DC5555]/10 p-4 text-[13px] text-[#DC5555] flex items-start gap-2.5">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      {/* SUCCESS CONFIRMATION MODAL / PANEL */}
      {successProject ? (
        <Card padded="lg" className="border-[#22A06B]/30! bg-[#000000]! space-y-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(34,160,107,0.1)] text-[#22A06B] border border-[#22A06B]/30">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-heading-20 font-semibold text-[#EDEDED]">{successProject.name}</h2>
                <Chip variant="success">Import Ready</Chip>
              </div>
              <p className="text-copy-14 text-[#878787]">
                {successProject.description || 'Project successfully imported and indexed for AST regression analysis.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-[6px] border border-[#1F1F1F] bg-[#0A0A0A] p-3 text-label-12-mono">
            <div>
              <div className="text-[#878787]">SOURCE</div>
              <div className="mt-1 font-medium text-[#EDEDED] uppercase">{successProject.sourceType.replace('_', ' ')}</div>
            </div>
            <div>
              <div className="text-[#878787]">BASELINE REF</div>
              <div className="mt-1 font-medium text-[#EDEDED] truncate">{successProject.baseRef}</div>
            </div>
            <div>
              <div className="text-[#878787]">COMPARISON TARGET</div>
              <div className="mt-1 font-medium text-[#22A06B] truncate">{successProject.targetRef}</div>
            </div>
            <div>
              <div className="text-[#878787]">ESTIMATED FILES</div>
              <div className="mt-1 font-medium text-[#EDEDED]">{successProject.filesCount} modules</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <SecondaryButton size="sm" onClick={() => setSuccessProject(null)}>
              Import Another Project
            </SecondaryButton>

            <div className="flex items-center gap-3">
              <SecondaryButton size="sm" onClick={() => onNavigate('projects')}>
                View In Project Management
              </SecondaryButton>
              <PrimaryButton size="sm" onClick={() => onNavigate('code-comparison')}>
                Proceed to Impact Analysis
                <ArrowRight className="h-4 w-4" />
              </PrimaryButton>
            </div>
          </div>
        </Card>
      ) : (
        /* IMPORT WIZARD TABS */
        <div className="space-y-6">
          {/* Navigation Tab Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'github_url',
                title: 'Import GitHub URL',
                desc: 'Instant import of any public repository by pasting URL',
                icon: Globe,
              },
              {
                id: 'github_connect',
                title: 'Connect GitHub',
                desc: 'Authorize GitHub account for personal & team repositories',
                icon: GithubIcon,
              },
              {
                id: 'local_upload',
                title: 'Upload Project ZIP',
                desc: 'Upload baseline & target project archives directly',
                icon: HardDriveUpload,
              },
            ].map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as ImportTab)}
                  className={`flex flex-col text-left rounded-[6px] p-4 border transition-colors cursor-pointer select-none ${
                    active
                      ? 'border-[#454545] bg-[#161616]'
                      : 'border-[#2E2E2E] bg-[#000000] hover:border-[#454545] hover:bg-[#0A0A0A]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-[6px] ${
                        active ? 'bg-[#EDEDED] text-black' : 'bg-[#111111] text-[#878787]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-[#EDEDED]" />}
                  </div>
                  <div className="mt-3 text-label-14 font-semibold text-[#EDEDED]">{tab.title}</div>
                  <div className="mt-1 text-copy-13 text-[#878787] leading-relaxed">{tab.desc}</div>
                </button>
              )
            })}
          </div>

          {/* ===================================================================
              TAB 1: GITHUB URL IMPORT
          ==================================================================== */}
          {activeTab === 'github_url' && (
            <Card padded="lg" className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-[17px] font-bold text-[#EDEDED]">Import by Public GitHub URL</h3>
                <p className="text-[13.5px] text-[#878787]">
                  Paste a link to any public repository on GitHub. No authentication or login is required.
                </p>
              </div>

              {urlError && (
                <div className="rounded-[6px] border border-[#DC5555]/30 bg-[#DC5555]/10 p-3.5 text-[13px] text-[#DC5555] flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{urlError}</span>
                </div>
              )}

              {/* URL Input Box */}
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-[#A0A0A0]">
                  Repository URL or Path
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#878787]" />
                    <input
                      type="text"
                      value={publicUrlInput}
                      onChange={(e) => setPublicUrlInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleInspectPublicUrl()}
                      placeholder="https://github.com/facebook/react or owner/repository"
                      className="w-full rounded-[6px] border border-[#2E2E2E] bg-[#0A0A0A] py-2.5 pl-10 pr-3 text-[14px] font-mono text-[#EDEDED] placeholder-[#64748B] focus:border-[#EDEDED] focus:outline-none"
                    />
                  </div>
                  <PrimaryButton
                    size="md"
                    onClick={handleInspectPublicUrl}
                    disabled={isFetchingUrlRepo || !publicUrlInput.trim()}
                  >
                    {isFetchingUrlRepo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Inspect
                  </PrimaryButton>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-[#64748B]">
                  <span>Examples:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPublicUrlInput('https://github.com/facebook/react')
                    }}
                    className="text-[#EDEDED] hover:underline cursor-pointer"
                  >
                    facebook/react
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPublicUrlInput('https://github.com/vercel/next.js')
                    }}
                    className="text-[#EDEDED] hover:underline cursor-pointer"
                  >
                    vercel/next.js
                  </button>
                </div>
              </div>

              {/* Inspected Repository Card */}
              {urlRepoData && (
                <div className="rounded-[8px] border border-[#2E2E2E] bg-[#000000] p-5 space-y-5 animate-in fade-in duration-200">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {urlRepoData.owner.avatarUrl ? (
                        <img
                          src={urlRepoData.owner.avatarUrl}
                          alt={urlRepoData.owner.login}
                          className="h-10 w-10 rounded-full border border-[#2E2E2E]"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111111] border border-[#2E2E2E]">
                          <GithubIcon className="h-5 w-5 text-[#878787]" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-[16px] font-bold text-white">{urlRepoData.fullName}</h4>
                          <span className="rounded-full border border-[#2E2E2E] bg-[#111111] px-2 py-0.5 text-[10px] font-mono text-[#878787]">
                            {urlRepoData.private ? 'Private' : 'Public'}
                          </span>
                        </div>
                        <p className="text-[13px] text-[#878787] line-clamp-1 mt-0.5">
                          {urlRepoData.description || 'No description provided.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-[12px] font-mono text-[#878787]">
                      {urlRepoData.language && (
                        <span className="flex items-center gap-1.5 text-[#60A5FA]">
                          <span className="h-2 w-2 rounded-full bg-[#EDEDED]" />
                          {urlRepoData.language}
                        </span>
                      )}
                      <span>★ {urlRepoData.stargazersCount.toLocaleString()}</span>
                      <span>⑂ {urlRepoData.forksCount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Branch and Comparison Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#2E2E2E] pt-4">
                    <div className="space-y-1.5">
                      <label className="block text-[12.5px] font-medium text-[#A0A0A0]">
                        Baseline Reference (Base Branch)
                      </label>
                      <div className="relative">
                        <GitBranch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#878787]" />
                        <select
                          value={urlBaseRef}
                          onChange={(e) => setUrlBaseRef(e.target.value)}
                          className="w-full rounded-[6px] border border-[#2E2E2E] bg-[#0A0A0A] py-2 pl-9 pr-3 text-[13px] font-mono text-[#EDEDED] focus:border-[#EDEDED] focus:outline-none"
                        >
                          {urlBranches.length > 0 ? (
                            urlBranches.map((b) => (
                              <option key={b.name} value={b.name}>
                                {b.name} {b.name === urlRepoData.defaultBranch ? '(default)' : ''}
                              </option>
                            ))
                          ) : (
                            <option value={urlRepoData.defaultBranch}>{urlRepoData.defaultBranch}</option>
                          )}
                        </select>
                      </div>
                      <span className="text-[11px] text-[#64748B]">
                        The production or main baseline branch to compare changes against.
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[12.5px] font-medium text-[#A0A0A0]">
                        Comparison Target (Branch or Commit SHA)
                      </label>
                      <div className="relative">
                        <GitCommitHorizontal className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#878787]" />
                        <input
                          type="text"
                          value={urlTargetRef}
                          onChange={(e) => setUrlTargetRef(e.target.value)}
                          placeholder="e.g. feature-branch, PR head, or commit SHA"
                          list="branch-suggestions"
                          className="w-full rounded-[6px] border border-[#2E2E2E] bg-[#0A0A0A] py-2 pl-9 pr-3 text-[13px] font-mono text-[#EDEDED] focus:border-[#EDEDED] focus:outline-none"
                        />
                        <datalist id="branch-suggestions">
                          {urlBranches.map((b) => (
                            <option key={b.name} value={b.name} />
                          ))}
                        </datalist>
                      </div>
                      <span className="text-[11px] text-[#64748B]">
                        The branch or commit containing your modified code changes.
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <PrimaryButton
                      size="md"
                      onClick={handleSubmitUrlImport}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Importing &amp; Indexing...
                        </>
                      ) : (
                        <>
                          Import Repository
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </PrimaryButton>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* ===================================================================
              TAB 2: GITHUB CONNECT (AUTHORIZED REPOSITORIES)
          ==================================================================== */}
          {activeTab === 'github_connect' && (
            <Card padded="lg" className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-[17px] font-bold text-[#EDEDED]">Connect GitHub Account</h3>
                <p className="text-[13.5px] text-[#878787]">
                  Authorize CodeSentra AI to browse and import your private and organizational repositories.
                </p>
              </div>

              {connectError && (
                <div className="rounded-[6px] border border-[#DC5555]/30 bg-[#DC5555]/10 p-3.5 text-[13px] text-[#DC5555] flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{connectError}</span>
                </div>
              )}

              {/* Connection Status & Token Authentication Box */}
              {!isConnected ? (
                <div className="rounded-[8px] border border-[#2E2E2E] bg-[#000000] p-6 space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] bg-[#111111] border border-[#2E2E2E] text-white">
                      <GithubIcon className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[15px] font-bold text-[#EDEDED]">Authorize GitHub Integration</h4>
                      <p className="text-[13px] text-[#878787] leading-[20px]">
                        Connect using a GitHub Personal Access Token (classic with <code className="text-[#60A5FA]">repo</code> scope or fine-grained token) to securely list your accessible repositories.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[12.5px] font-medium text-[#A0A0A0]">
                      GitHub Token
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#878787]" />
                        <input
                          type="password"
                          value={githubToken}
                          onChange={(e) => setGithubToken(e.target.value)}
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_xxxx"
                          className="w-full rounded-[6px] border border-[#2E2E2E] bg-[#0A0A0A] py-2 pl-9 pr-3 text-[13px] font-mono text-[#EDEDED] placeholder-[#64748B] focus:border-[#EDEDED] focus:outline-none"
                        />
                      </div>
                      <PrimaryButton size="md" onClick={handleConnectToken} disabled={isLoadingRepos}>
                        {isLoadingRepos ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Connect'}
                      </PrimaryButton>
                    </div>
                    <p className="text-[11.5px] text-[#64748B]">
                      Tokens are stored only in your local browser session and are never exposed to third parties.
                    </p>
                  </div>
                </div>
              ) : (
                /* Authenticated State & Repository Browser */
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-[#22A06B]/30 bg-[#22A06B]/10 p-3.5 text-[13px]">
                    <div className="flex items-center gap-2 text-[#22A06B]">
                      <Check className="h-4 w-4" />
                      <span className="font-semibold">GitHub Connected</span>
                      <span className="text-[#878787]">({userRepos.length} repositories accessible)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => loadUserRepositories(githubToken)}
                        disabled={isLoadingRepos}
                        className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#2E2E2E] bg-[#0A0A0A] px-2.5 py-1 text-[11.5px] text-[#A0A0A0] hover:text-white cursor-pointer"
                      >
                        <RefreshCw className={`h-3 w-3 ${isLoadingRepos ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                      <button
                        type="button"
                        onClick={handleDisconnectGitHub}
                        className="rounded-[6px] border border-[#DC5555]/30 bg-[#DC5555]/10 px-2.5 py-1 text-[11.5px] text-[#DC5555] hover:bg-[#DC5555]/20 cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>

                  {/* Repository Search Filter */}
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#878787]" />
                    <input
                      type="text"
                      value={repoSearchQuery}
                      onChange={(e) => setRepoSearchQuery(e.target.value)}
                      placeholder="Search accessible repositories by name or language..."
                      className="w-full rounded-[6px] border border-[#2E2E2E] bg-[#0A0A0A] py-2 pl-9 pr-3 text-[13px] text-[#EDEDED] placeholder-[#64748B] focus:border-[#EDEDED] focus:outline-none"
                    />
                  </div>

                  {/* Repository List */}
                  <div className="max-h-[340px] overflow-y-auto space-y-2 rounded-[6px] border border-[#2E2E2E] bg-[#000000] p-2">
                    {isLoadingRepos ? (
                      <div className="py-12 text-center text-[#878787] text-[13px] flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-[#EDEDED]" />
                        <span>Loading repositories from GitHub...</span>
                      </div>
                    ) : filteredUserRepos.length === 0 ? (
                      <div className="py-10 text-center text-[#878787] text-[13px]">
                        No repositories found matching "{repoSearchQuery}".
                      </div>
                    ) : (
                      filteredUserRepos.map((repo) => {
                        const isSelected = selectedRepo?.id === repo.id
                        return (
                          <div
                            key={repo.id}
                            onClick={() => handleSelectConnectRepo(repo)}
                            className={`flex items-center justify-between p-3 rounded-[6px] border transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[#EDEDED] bg-[#111625]'
                                : 'border-transparent bg-[#0A0A0A] hover:border-[#3F3F46]'
                            }`}
                          >
                            <div className="min-w-0 pr-4">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-[13.5px] text-[#EDEDED] truncate">
                                  {repo.fullName}
                                </span>
                                {repo.private ? (
                                  <span className="flex items-center gap-1 rounded bg-[#27272A] px-1.5 py-0.5 text-[10px] text-[#878787]">
                                    <Lock className="h-2.5 w-2.5" /> Private
                                  </span>
                                ) : (
                                  <span className="rounded bg-[#111111] border border-[#2E2E2E] px-1.5 py-0.5 text-[10px] text-[#878787]">
                                    Public
                                  </span>
                                )}
                              </div>
                              <p className="text-[12px] text-[#878787] truncate mt-0.5">
                                {repo.description || 'No description.'}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 font-mono text-[11px] text-[#878787]">
                              {repo.language && (
                                <span className="text-[#60A5FA]">{repo.language}</span>
                              )}
                              <span>★ {repo.stargazersCount}</span>
                              <div
                                className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                                  isSelected
                                    ? 'border-[#EDEDED] bg-[#EDEDED] text-white'
                                    : 'border-[#3F3F46]'
                                }`}
                              >
                                {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Selected Repository Configuration & Submission */}
                  {selectedRepo && (
                    <div className="rounded-[6px] border border-[#2E2E2E] bg-[#000000] p-4 space-y-4">
                      <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-3">
                        <span className="font-semibold text-[13.5px] text-white">
                          Configure {selectedRepo.fullName}
                        </span>
                        <span className="font-mono text-[11px] text-[#878787]">
                          Default: {selectedRepo.defaultBranch}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-[12px] font-medium text-[#A0A0A0]">
                            Base Reference (Production/Baseline)
                          </label>
                          <select
                            value={connectBaseBranch}
                            onChange={(e) => setConnectBaseBranch(e.target.value)}
                            className="w-full rounded-[6px] border border-[#2E2E2E] bg-[#0A0A0A] py-2 px-3 text-[13px] font-mono text-[#EDEDED] focus:border-[#EDEDED] focus:outline-none"
                          >
                            {connectBranches.map((b) => (
                              <option key={b.name} value={b.name}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[12px] font-medium text-[#A0A0A0]">
                            Comparison Target (Branch to Test)
                          </label>
                          <input
                            type="text"
                            value={connectTargetBranch}
                            onChange={(e) => setConnectTargetBranch(e.target.value)}
                            placeholder="e.g. feature-auth or commit SHA"
                            list="connect-branch-suggestions"
                            className="w-full rounded-[6px] border border-[#2E2E2E] bg-[#0A0A0A] py-2 px-3 text-[13px] font-mono text-[#EDEDED] focus:border-[#EDEDED] focus:outline-none"
                          />
                          <datalist id="connect-branch-suggestions">
                            {connectBranches.map((b) => (
                              <option key={b.name} value={b.name} />
                            ))}
                          </datalist>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <PrimaryButton
                          size="md"
                          onClick={handleSubmitConnectImport}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Saving Project...
                            </>
                          ) : (
                            <>
                              Import Authorized Project
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </PrimaryButton>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* ===================================================================
              TAB 3: LOCAL PROJECT ZIP UPLOAD
          ==================================================================== */}
          {activeTab === 'local_upload' && (
            <Card padded="lg" className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-[17px] font-bold text-[#EDEDED]">Upload Local Project Archive</h3>
                <p className="text-[13.5px] text-[#878787]">
                  Upload a ZIP or TAR archive of your repository. For direct code comparison, you can
                  provide both a baseline version and an updated version.
                </p>
              </div>

              {uploadError && (
                <div className="rounded-[6px] border border-[#DC5555]/30 bg-[#DC5555]/10 p-3.5 text-[13px] text-[#DC5555] flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Project Meta Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[12.5px] font-medium text-[#A0A0A0]">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={localProjectName}
                    onChange={(e) => setLocalProjectName(e.target.value)}
                    placeholder="e.g. payments-microservice"
                    className="w-full rounded-[6px] border border-[#2E2E2E] bg-[#0A0A0A] py-2 px-3 text-[13.5px] text-[#EDEDED] placeholder-[#64748B] focus:border-[#EDEDED] focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[12.5px] font-medium text-[#A0A0A0]">
                    Primary Language / Runtime
                  </label>
                  <select
                    value={localProjectLang}
                    onChange={(e) => setLocalProjectLang(e.target.value)}
                    className="w-full rounded-[6px] border border-[#2E2E2E] bg-[#0A0A0A] py-2 px-3 text-[13.5px] text-[#EDEDED] focus:border-[#EDEDED] focus:outline-none"
                  >
                    <option value="TypeScript">TypeScript / JavaScript</option>
                    <option value="Python">Python (pytest)</option>
                    <option value="Go">Go (testing)</option>
                    <option value="Java">Java / Kotlin (JUnit)</option>
                    <option value="Rust">Rust (cargo test)</option>
                  </select>
                </div>
              </div>

              {/* Dual Drag-and-Drop Zones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Zone 1: Baseline Project Archive */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="font-semibold text-white">1. Baseline Project Version (Required)</span>
                    <span className="text-[#878787] text-[11px]">e.g. v1.0.0 or main.zip</span>
                  </div>

                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleFileDrop(e, 'baseline')}
                    className={`relative rounded-[8px] border-2 border-dashed p-6 text-center transition-all ${
                      uploadState.baselineFile
                        ? 'border-[#22A06B]/50 bg-[#22A06B]/5'
                        : 'border-[#2E2E2E] bg-[#000000] hover:border-[#EDEDED]/50'
                    }`}
                  >
                    <input
                      type="file"
                      accept=".zip,.tar.gz,.tgz"
                      onChange={(e) => handleFileSelect(e, 'baseline')}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111111] border border-[#2E2E2E] text-[#878787]">
                        <UploadCloud className="h-5 w-5" />
                      </div>
                      {uploadState.baselineFile ? (
                        <div className="space-y-1">
                          <span className="font-mono text-[13px] font-semibold text-[#22A06B]">
                            {uploadState.baselineFile.name}
                          </span>
                          <div className="text-[11px] text-[#878787]">
                            {(uploadState.baselineFile.size / (1024 * 1024)).toFixed(2)} MB · Ready
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="text-[13px] font-medium text-[#A0A0A0]">
                            Drag &amp; drop baseline ZIP archive
                          </span>
                          <div className="text-[11px] text-[#878787]">or click to browse (.zip, .tar.gz)</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Zone 2: Comparison Target Project Archive */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="font-semibold text-white">2. Updated Version (Optional for Diff)</span>
                    <span className="text-[#878787] text-[11px]">e.g. feature-v2.zip</span>
                  </div>

                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleFileDrop(e, 'target')}
                    className={`relative rounded-[8px] border-2 border-dashed p-6 text-center transition-all ${
                      uploadState.targetFile
                        ? 'border-[#EDEDED]/50 bg-[#EDEDED]/5'
                        : 'border-[#2E2E2E] bg-[#000000] hover:border-[#EDEDED]/50'
                    }`}
                  >
                    <input
                      type="file"
                      accept=".zip,.tar.gz,.tgz"
                      onChange={(e) => handleFileSelect(e, 'target')}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111111] border border-[#2E2E2E] text-[#878787]">
                        <UploadCloud className="h-5 w-5" />
                      </div>
                      {uploadState.targetFile ? (
                        <div className="space-y-1">
                          <span className="font-mono text-[13px] font-semibold text-[#60A5FA]">
                            {uploadState.targetFile.name}
                          </span>
                          <div className="text-[11px] text-[#878787]">
                            {(uploadState.targetFile.size / (1024 * 1024)).toFixed(2)} MB · Ready
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="text-[13px] font-medium text-[#A0A0A0]">
                            Drag &amp; drop updated ZIP archive
                          </span>
                          <div className="text-[11px] text-[#878787]">or leave empty to use current commit</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#2E2E2E] pt-4">
                <div className="flex items-center gap-2 text-[12px] text-[#878787]">
                  <Info className="h-4 w-4" />
                  <span>Files are stored in private Supabase buckets with cryptographic SHA256 validation.</span>
                </div>

                <div className="flex items-center gap-3">
                  {(uploadState.baselineFile || uploadState.targetFile) && (
                    <SecondaryButton
                      size="md"
                      onClick={() =>
                        setUploadState({
                          baselineFile: null,
                          targetFile: null,
                          baselineProgress: 0,
                          targetProgress: 0,
                          status: 'idle',
                        })
                      }
                    >
                      Clear Archives
                    </SecondaryButton>
                  )}
                  <PrimaryButton
                    size="md"
                    onClick={handleLocalUploadSubmit}
                    disabled={isSubmitting || !uploadState.baselineFile}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading &amp; Extracting...
                      </>
                    ) : (
                      <>
                        Upload &amp; Analyze Project
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </PrimaryButton>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
