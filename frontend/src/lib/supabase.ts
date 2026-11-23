import { createClient } from '@supabase/supabase-js'
import type { ProjectRecord } from '../types/project'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const STORAGE_BUCKET = 'project-archives'
const LOCAL_STORAGE_KEY = 'codesentra.imported_projects'

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('your-project') &&
    !SUPABASE_ANON_KEY.includes('your-anon-key')
  )
}

export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

/* --------------------------------------------------------------------------
   Local Storage Fallback (Active when VITE_SUPABASE_* are not configured)
-------------------------------------------------------------------------- */

function readLocalProjects(): ProjectRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ProjectRecord[]
  } catch {
    return []
  }
}

function writeLocalProjects(projects: ProjectRecord[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects))
  } catch (err) {
    console.error('Failed to write projects to localStorage:', err)
  }
}

/* --------------------------------------------------------------------------
   Project Database Operations
-------------------------------------------------------------------------- */

export async function saveProjectRecord(
  payload: Omit<ProjectRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; data?: ProjectRecord; error?: string }> {
  const timestamp = new Date().toISOString()
  const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  const project: ProjectRecord = {
    ...payload,
    id: newId,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          id: project.id,
          user_id: project.userId,
          name: project.name,
          description: project.description,
          source_type: project.sourceType,
          repo_url: project.repoUrl,
          default_branch: project.defaultBranch,
          base_ref: project.baseRef,
          target_ref: project.targetRef,
          language: project.language,
          status: project.status,
          files_count: project.filesCount,
          storage_path: project.storagePath,
          metadata: project.metadata,
        })
        .select()
        .single()

      if (error) {
        console.warn('Supabase insert failed, saving to local state fallback:', error.message)
        // Fallback to local storage so user flow is not broken
        const existing = readLocalProjects()
        writeLocalProjects([project, ...existing])
        return { success: true, data: project }
      }

      return { success: true, data: data as ProjectRecord }
    } catch (err: any) {
      console.warn('Supabase network exception, falling back to local state:', err)
      const existing = readLocalProjects()
      writeLocalProjects([project, ...existing])
      return { success: true, data: project }
    }
  }

  // Pure local storage mode
  const existing = readLocalProjects()
  writeLocalProjects([project, ...existing])
  return { success: true, data: project }
}

export async function listProjectRecords(
  userId: string
): Promise<{ success: boolean; data: ProjectRecord[]; error?: string; isLocalFallback: boolean }> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('Supabase query failed, returning local records:', error.message)
        return { success: true, data: readLocalProjects(), isLocalFallback: true }
      }

      return {
        success: true,
        data: (data || []).map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          name: row.name,
          description: row.description,
          sourceType: row.source_type,
          repoUrl: row.repo_url,
          defaultBranch: row.default_branch,
          baseRef: row.base_ref,
          targetRef: row.target_ref,
          language: row.language,
          status: row.status,
          filesCount: row.files_count,
          storagePath: row.storage_path,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          metadata: row.metadata,
        })),
        isLocalFallback: false,
      }
    } catch (err: any) {
      return { success: true, data: readLocalProjects(), isLocalFallback: true }
    }
  }

  return { success: true, data: readLocalProjects(), isLocalFallback: true }
}

export async function deleteProjectRecord(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) console.warn('Supabase delete error:', error.message)
    } catch (err) {
      console.warn('Supabase delete exception:', err)
    }
  }

  // Also remove from local storage
  const existing = readLocalProjects()
  const updated = existing.filter((p) => p.id !== id)
  writeLocalProjects(updated)
  return { success: true }
}

/* --------------------------------------------------------------------------
   Supabase Storage: Project ZIP Archives
-------------------------------------------------------------------------- */

export async function uploadProjectArchive(
  file: File,
  userId: string,
  projectId: string,
  variant: 'baseline' | 'target' = 'baseline'
): Promise<{ success: boolean; path?: string; error?: string; isLocalFallback: boolean }> {
  const safeFilename = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')
  const storagePath = `${userId}/${projectId}/${variant}_${Date.now()}_${safeFilename}`

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (error) {
        console.warn('Supabase storage upload failed:', error.message)
        return {
          success: true,
          path: `local-cache://${safeFilename}`,
          isLocalFallback: true,
          error: error.message,
        }
      }

      return { success: true, path: data?.path || storagePath, isLocalFallback: false }
    } catch (err: any) {
      return {
        success: true,
        path: `local-cache://${safeFilename}`,
        isLocalFallback: true,
      }
    }
  }

  return {
    success: true,
    path: `local-cache://${safeFilename}`,
    isLocalFallback: true,
  }
}
