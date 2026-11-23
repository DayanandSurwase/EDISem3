import type { GitHubBranch, GitHubCommit, GitHubRepository } from '../types/project'

const GITHUB_API_BASE = 'https://api.github.com'

/**
 * Extracts owner and repository name from various GitHub URL formats.
 * e.g.,
 * https://github.com/facebook/react
 * https://github.com/facebook/react.git
 * github.com/vercel/next.js
 * vercel/next.js
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  if (!url || typeof url !== 'string') return null
  const clean = url.trim().replace(/\.git$/, '').replace(/\/+$/, '')

  // Matches https://github.com/owner/repo or http://...
  const httpMatch = clean.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/)
  if (httpMatch && httpMatch[1] && httpMatch[2]) {
    return { owner: httpMatch[1], repo: httpMatch[2] }
  }

  // Matches owner/repo format directly
  const directMatch = clean.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/)
  if (directMatch && directMatch[1] && directMatch[2]) {
    return { owner: directMatch[1], repo: directMatch[2] }
  }

  return null
}

function getAuthHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

function handleGitHubError(status: number, data: any): string {
  if (status === 404) {
    return 'Repository not found. Please verify the URL or ensure you have access permissions.'
  }
  if (status === 403 && data?.message?.includes('API rate limit')) {
    return 'GitHub API rate limit reached for unauthenticated requests. Please connect a GitHub token or wait a few minutes.'
  }
  if (status === 401) {
    return 'Bad GitHub credentials or expired token. Please re-authenticate.'
  }
  return data?.message || `GitHub API request failed with status code ${status}`
}

/**
 * Fetches public repository metadata from GitHub REST API.
 * Does not require authentication for public repos.
 */
export async function fetchPublicRepository(
  owner: string,
  repo: string,
  token?: string
): Promise<{ success: boolean; data?: GitHubRepository; error?: string }> {
  try {
    const res = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
      headers: getAuthHeaders(token),
    })

    const json = await res.json()

    if (!res.ok) {
      return { success: false, error: handleGitHubError(res.status, json) }
    }

    const repository: GitHubRepository = {
      id: json.id,
      name: json.name,
      fullName: json.full_name,
      owner: {
        login: json.owner?.login || owner,
        avatarUrl: json.owner?.avatar_url,
        htmlUrl: json.owner?.html_url || `https://github.com/${owner}`,
      },
      description: json.description,
      private: Boolean(json.private),
      htmlUrl: json.html_url,
      defaultBranch: json.default_branch || 'main',
      language: json.language,
      stargazersCount: json.stargazers_count || 0,
      forksCount: json.forks_count || 0,
      updatedAt: json.updated_at,
      sizeKb: json.size || 0,
      openIssuesCount: json.open_issues_count || 0,
    }

    return { success: true, data: repository }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error while contacting GitHub API. Please check your connection.',
    }
  }
}

/**
 * Fetches branches for a repository.
 */
export async function fetchRepositoryBranches(
  owner: string,
  repo: string,
  token?: string
): Promise<{ success: boolean; data?: GitHubBranch[]; error?: string }> {
  try {
    const res = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/branches?per_page=100`, {
      headers: getAuthHeaders(token),
    })

    const json = await res.json()

    if (!res.ok) {
      return { success: false, error: handleGitHubError(res.status, json) }
    }

    const branches: GitHubBranch[] = (Array.isArray(json) ? json : []).map((b: any) => ({
      name: b.name,
      commitSha: b.commit?.sha || '',
      isProtected: Boolean(b.protected),
    }))

    return { success: true, data: branches }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch repository branches.' }
  }
}

/**
 * Fetches recent commits for a repository.
 */
export async function fetchRepositoryCommits(
  owner: string,
  repo: string,
  sha?: string,
  token?: string
): Promise<{ success: boolean; data?: GitHubCommit[]; error?: string }> {
  try {
    const query = sha ? `?sha=${encodeURIComponent(sha)}&per_page=20` : '?per_page=20'
    const res = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/commits${query}`, {
      headers: getAuthHeaders(token),
    })

    const json = await res.json()

    if (!res.ok) {
      return { success: false, error: handleGitHubError(res.status, json) }
    }

    const commits: GitHubCommit[] = (Array.isArray(json) ? json : []).map((c: any) => ({
      sha: c.sha ? c.sha.substring(0, 7) : '',
      message: c.commit?.message?.split('\n')[0] || 'No commit message',
      authorName: c.commit?.author?.name || 'Unknown',
      authorDate: c.commit?.author?.date || '',
    }))

    return { success: true, data: commits }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch repository commits.' }
  }
}

/**
 * Fetches all accessible repositories for an authenticated user (OAuth/Token).
 */
export async function fetchUserRepositories(
  token: string
): Promise<{ success: boolean; data?: GitHubRepository[]; error?: string }> {
  try {
    const res = await fetch(
      `${GITHUB_API_BASE}/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member`,
      {
        headers: getAuthHeaders(token),
      }
    )

    const json = await res.json()

    if (!res.ok) {
      return { success: false, error: handleGitHubError(res.status, json) }
    }

    const repos: GitHubRepository[] = (Array.isArray(json) ? json : []).map((r: any) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      owner: {
        login: r.owner?.login || '',
        avatarUrl: r.owner?.avatar_url,
        htmlUrl: r.owner?.html_url || '',
      },
      description: r.description,
      private: Boolean(r.private),
      htmlUrl: r.html_url,
      defaultBranch: r.default_branch || 'main',
      language: r.language,
      stargazersCount: r.stargazers_count || 0,
      forksCount: r.forks_count || 0,
      updatedAt: r.updated_at,
      sizeKb: r.size || 0,
      openIssuesCount: r.open_issues_count || 0,
    }))

    return { success: true, data: repos }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch user repositories.' }
  }
}
