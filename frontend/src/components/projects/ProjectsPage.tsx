import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Archive,
  ArrowRight,
  Database,
  ExternalLink,
  FolderGit2,
  GitBranch,
  GitCommitHorizontal,
  HardDriveUpload,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react'
import type { PageId } from '../../types/analysis'
import type { UserSession } from '../../types/auth'
import type { ProjectRecord, ProjectSourceType } from '../../types/project'
import { deleteProjectRecord, isSupabaseConfigured, listProjectRecords } from '../../lib/supabase'
import { Card, Chip, PrimaryButton, SecondaryButton, SectionHeader } from '../ui/Primitives'

function GithubIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

interface ProjectsPageProps {
  user: UserSession
  onNavigate: (page: PageId) => void
  onSelectProject: (project: ProjectRecord) => void
}

type FilterSource = 'all' | ProjectSourceType

export function ProjectsPage({ user, onNavigate, onSelectProject }: ProjectsPageProps) {
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLocalMode, setIsLocalMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<FilterSource>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadProjects = async (showLoadingState = true) => {
    if (showLoadingState) setIsLoading(true)
    else setIsRefreshing(true)
    setErrorMessage(null)

    try {
      const res = await listProjectRecords(user.email)
      if (res.success) {
        setProjects(res.data)
        setIsLocalMode(res.isLocalFallback)
      } else {
        setErrorMessage(res.error || 'Failed to load projects.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred while fetching projects.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadProjects(true)
  }, [user.email])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this imported project?')) return

    setDeletingId(id)
    try {
      await deleteProjectRecord(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch (err: any) {
      alert(`Failed to delete project: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSource =
        sourceFilter === 'all' ? true : project.sourceType === sourceFilter

      const q = searchQuery.toLowerCase().trim()
      const matchesQuery =
        !q ||
        project.name.toLowerCase().includes(q) ||
        (project.description && project.description.toLowerCase().includes(q)) ||
        (project.repoUrl && project.repoUrl.toLowerCase().includes(q)) ||
        project.baseRef.toLowerCase().includes(q) ||
        project.targetRef.toLowerCase().includes(q) ||
        project.language.toLowerCase().includes(q)

      return matchesSource && matchesQuery
    })
  }, [projects, sourceFilter, searchQuery])

  const formatSourceBadge = (source: ProjectSourceType) => {
    switch (source) {
      case 'github_oauth':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-[rgba(0,113,246,0.3)] bg-[rgba(0,113,246,0.1)] px-2 py-0.5 text-label-12-mono font-medium text-[#0071F6]">
            <GithubIcon className="h-3 w-3" />
            GitHub App
          </span>
        )
      case 'github_url':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-[#2E2E2E] bg-[#111111] px-2 py-0.5 text-label-12-mono font-medium text-[#EDEDED]">
            <GithubIcon className="h-3 w-3" />
            Public URL
          </span>
        )
      case 'local_upload':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-[rgba(245,166,35,0.3)] bg-[rgba(245,166,35,0.1)] px-2 py-0.5 text-label-12-mono font-medium text-[#F5A623]">
            <Archive className="h-3 w-3" />
            ZIP Archive
          </span>
        )
    }
  }

  const formatStatusBadge = (status: ProjectRecord['status']) => {
    switch (status) {
      case 'ready':
      case 'analyzed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-[rgba(34,160,107,0.3)] bg-[rgba(34,160,107,0.1)] px-2 py-0.5 text-label-12-mono font-medium text-[#22A06B]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22A06B]" />
            Ready
          </span>
        )
      case 'uploading':
      case 'parsing':
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-[rgba(0,113,246,0.3)] bg-[rgba(0,113,246,0.1)] px-2 py-0.5 text-label-12-mono font-medium text-[#0071F6]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0071F6] animate-pulse" />
            Processing
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-[rgba(229,72,77,0.3)] bg-[rgba(229,72,77,0.1)] px-2 py-0.5 text-label-12-mono font-medium text-[#E5484D]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E5484D]" />
            Failed
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <SectionHeader
        kicker="PROJECT REPOSITORIES"
        title="Project Management"
        highlight="& Workspaces"
        description="Inspect, switch, and launch differential regression analysis across connected GitHub repositories and uploaded codebase archives."
        actions={
          <div className="flex items-center gap-2.5">
            <SecondaryButton size="sm" onClick={() => loadProjects(false)} disabled={isRefreshing || isLoading}>
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </SecondaryButton>
            <PrimaryButton size="sm" onClick={() => onNavigate('import-project')}>
              <Plus className="h-3.5 w-3.5" />
              Import Project
            </PrimaryButton>
          </div>
        }
      />

      {/* Storage Backend Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[6px] border border-[#1F1F1F] bg-[#0A0A0A] px-3.5 py-2.5 text-copy-13">
        <div className="flex items-center gap-2.5 text-[#A0A0A0]">
          <Database className="h-4 w-4 text-[#EDEDED]" />
          <span>Storage Engine:</span>
          {isSupabaseConfigured() ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-[#22A06B]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22A06B]" />
              Supabase PostgreSQL & Private Storage Bucket Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 font-medium text-[#F5A623]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F5A623]" />
              Local Persistent Fallback (Configure VITE_SUPABASE_URL for cloud sync)
            </span>
          )}
        </div>
        <div className="text-label-12-mono text-[#878787]">
          Total Projects: <span className="text-[#EDEDED] font-medium">{projects.length}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        {/* Source Filter Tabs */}
        <div className="inline-flex rounded-[6px] border border-[#2E2E2E] bg-[#0A0A0A] p-0.5 text-button-12 font-medium">
          {(
            [
              { id: 'all', label: 'All Projects' },
              { id: 'github_url', label: 'GitHub URL' },
              { id: 'github_oauth', label: 'GitHub App' },
              { id: 'local_upload', label: 'Local ZIP' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSourceFilter(tab.id)}
              className={`rounded-[4px] px-3 py-1 transition-colors cursor-pointer ${
                sourceFilter === tab.id
                  ? 'bg-[#1F1F1F] text-[#EDEDED]'
                  : 'text-[#878787] hover:text-[#EDEDED]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px] sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#878787]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, branches..."
            className="w-full rounded-[6px] border border-[#2E2E2E] bg-[#0A0A0A] pl-8 pr-2.5 py-1 text-copy-13 text-[#EDEDED] placeholder-[#666666] focus:border-[#EDEDED] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-[6px] border border-[#E5484D]/30 bg-[rgba(229,72,77,0.1)] p-3 text-copy-13 text-[#E5484D]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="h-6 w-6 animate-spin text-[#EDEDED]" />
          <div className="text-copy-14 text-[#878787]">Loading imported projects...</div>
        </div>
      ) : filteredProjects.length === 0 ? (
        /* Empty State */
        <Card padded="lg" className="border-dashed border-[#2E2E2E] text-center space-y-5 py-14">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#111111] text-[#878787] border border-[#2E2E2E]">
            <FolderGit2 className="h-6 w-6 text-[#EDEDED]" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-heading-16 text-[#EDEDED]">
              {searchQuery || sourceFilter !== 'all' ? 'No matching projects found' : 'No projects imported yet'}
            </h3>
            <p className="text-copy-14 text-[#878787]">
              {searchQuery || sourceFilter !== 'all'
                ? 'Try adjusting your search query or switching the source filter.'
                : 'Import a GitHub repository via public URL, connect your GitHub account, or upload local ZIP archives to begin regression testing.'}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2.5 pt-1">
            {searchQuery || sourceFilter !== 'all' ? (
              <SecondaryButton
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setSourceFilter('all')
                }}
              >
                Clear Filters
              </SecondaryButton>
            ) : (
              <PrimaryButton size="sm" onClick={() => onNavigate('import-project')}>
                <Plus className="h-3.5 w-3.5" />
                Import First Project
              </PrimaryButton>
            )}
          </div>
        </Card>
      ) : (
        /* Project Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => onSelectProject(project)}
              className="group relative flex flex-col justify-between rounded-[8px] border border-[#2E2E2E] bg-[#000000] p-4.5 hover:border-[#454545] hover:bg-[#0A0A0A] transition-colors cursor-pointer"
            >
              {/* Card Top: Source badge, status & delete button */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  {formatSourceBadge(project.sourceType)}
                  <div className="flex items-center gap-1.5">
                    {formatStatusBadge(project.status)}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, project.id)}
                      disabled={deletingId === project.id}
                      className="p-1 rounded text-[#878787] hover:text-[#E5484D] hover:bg-[rgba(229,72,77,0.1)] transition-colors cursor-pointer"
                      title="Delete project"
                    >
                      {deletingId === project.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#E5484D]" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Project Title & Description */}
                <h3 className="text-label-14 font-semibold text-[#EDEDED] group-hover:text-white transition-colors truncate">
                  {project.name}
                </h3>
                {project.description ? (
                  <p className="mt-1 text-copy-13 text-[#878787] line-clamp-2 leading-normal">
                    {project.description}
                  </p>
                ) : (
                  <p className="mt-1 text-copy-13 text-[#666666] italic">No description provided</p>
                )}
              </div>

              {/* Card Middle: Comparison Branch / Commit / Files */}
              <div className="my-3 rounded-[6px] border border-[#1F1F1F] bg-[#0A0A0A] p-2.5 text-label-12-mono space-y-1.5">
                <div className="flex items-center justify-between text-[#878787]">
                  <span className="flex items-center gap-1.5">
                    <GitBranch className="h-3 w-3 text-[#A0A0A0]" />
                    Baseline:
                  </span>
                  <span className="font-medium text-[#EDEDED] truncate max-w-[130px]">
                    {project.baseRef || 'main'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#878787]">
                  <span className="flex items-center gap-1.5">
                    <GitCommitHorizontal className="h-3 w-3 text-[#22A06B]" />
                    Target:
                  </span>
                  <span className="font-medium text-[#22A06B] truncate max-w-[130px]">
                    {project.targetRef || 'HEAD'}
                  </span>
                </div>
                {project.repoUrl && (
                  <div className="flex items-center justify-between text-[#878787] pt-1 border-t border-[#1F1F1F]">
                    <span className="flex items-center gap-1.5">
                      <ExternalLink className="h-3 w-3" />
                      Repo:
                    </span>
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[#EDEDED] hover:underline truncate max-w-[150px]"
                    >
                      {project.repoUrl.replace(/^https?:\/\/github\.com\//, '')}
                    </a>
                  </div>
                )}
              </div>

              {/* Card Bottom: Metadata and Open Action */}
              <div className="flex items-center justify-between pt-2 border-t border-[#1F1F1F] text-label-12-mono text-[#878787]">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#EDEDED]" />
                  <span>{project.language || 'Codebase'}</span>
                  {project.filesCount > 0 && <span>· {project.filesCount} files</span>}
                </div>
                <div className="flex items-center gap-1 text-[#EDEDED] font-medium group-hover:translate-x-0.5 transition-transform">
                  <span>Open</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
