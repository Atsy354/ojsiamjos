// lib/storage/supabase-storage.ts
import { supabaseAdmin } from "@/lib/supabase/server"

const STORAGE_BUCKET = "submissions"

export interface UploadResult {
  fileName: string
  filePath: string
  fileUrl: string
  fileSize: number
  fileType: string
}

/**
 * Upload file to Supabase Storage
 * IMPROVED: Preserves original filename for better UX
 */
export async function uploadFileToSupabase(
  file: File,
  submissionId: string,
  fileStage: string
): Promise<UploadResult> {
  // Preserve original filename with timestamp for uniqueness
  const timestamp = Date.now()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') // Remove special chars
  const fileName = `${timestamp}_${sanitizedName}` // Original name visible!
  const filePath = `${submissionId}/${fileStage}/${fileName}`

  // Convert File to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer()
  const uint8Array = new Uint8Array(arrayBuffer)

  // Upload to Supabase Storage
  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, uint8Array, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  // Return original filename for display
  return {
    fileName: file.name, // Keep original for UI display
    filePath: data.path,
    fileUrl: "", // Will be generated via signed URL when needed
    fileSize: file.size,
    fileType: file.type,
  }
}

/**
 * Generate signed URL for private file access (valid for 1 hour)
 */
export async function getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(filePath, expiresIn)

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`)
  }

  return data.signedUrl
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFileFromSupabase(filePath: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .remove([filePath])

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}
