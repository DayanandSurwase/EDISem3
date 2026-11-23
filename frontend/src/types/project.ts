/**
 * Project and repository integration types for CodeSentra AI.
 * Supports GitHub App/OAuth, public GitHub URL import, and local ZIP project archives.
 */

export type ProjectSourceType = 'github_oauth' | 'github_url' | 'local_upload'

export type ProjectImportStatus = 'pending' | 'uploading' | 'parsing' | 'ready' | 'analyzed' | 'failed'

export interface GitHubRepository {
  id: number
  name: string
  fullName: string
  owner: {
    login: string
    avatarUrl?: string
    htmlUrl: string
  }
  description: string | null
  private: boolean
  htmlUrl: string
  defaultBranch: string
  language: string | null
  stargazersCount: number
  forksCount: number
  updatedAt: string
  sizeKb: number
  openIssuesCount: number
}

export interface GitHubBranch {
  name: string
  commitSha: string
  isProtected?: boolean
}

export interface GitHubCommit {
  sha: string
  message: string
  authorName: string
  authorDate: string
}

export interface LocalProjectUploadState {
  baselineFile: File | null
  targetFile: File | null
  baselineProgress: number
  targetProgress: number
  baselineError?: string
  targetError?: string
  status: 'idle' | 'uploading' | 'validating' | 'ready' | 'error'
  errorMessage?: string
}

export interface ProjectRecord {
  id: string
  userId: string
  name: string
  description?: string
  sourceType: ProjectSourceType
  repoUrl?: string
  defaultBranch?: string
  baseRef: string
  targetRef: string
  language: string
  status: ProjectImportStatus
  filesCount: number
  storagePath?: string
  createdAt: string
  updatedAt: string
  metadata?: {
    githubOwner?: string
    githubRepo?: string
    baselineArchiveName?: string
    targetArchiveName?: string
    archiveSizeBytes?: number
    commitSha?: string
    prNumber?: string
    stars?: number
  }
}

export interface ProjectImportFormState {
  // Tab 1: GitHub Connect
  selectedRepo: GitHubRepository | null
  selectedBaseBranch: string
  selectedTargetBranch: string
  
  // Tab 2: Public GitHub URL
  publicUrl: string
  urlRepoInfo: GitHubRepository | null
  urlBaseBranch: string
  urlTargetBranch: string
  
  // Tab 3: Local ZIP
  projectName: string
  projectDescription: string
  projectLanguage: string
  baselineZip: File | null
  targetZip: File | null
}
