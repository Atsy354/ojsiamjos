/**
 * Database ↔ Frontend Transformation Utilities
 * Converts between snake_case (PostgreSQL) and camelCase (TypeScript)
 */

/**
 * Convert snake_case to camelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Convert camelCase to snake_case
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

/**
 * Transform object keys from snake_case to camelCase
 */
export function keysToCamel<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => keysToCamel(item)) as any
  }

  if (typeof obj !== 'object' || obj instanceof Date) {
    return obj
  }

  const result: any = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = toCamelCase(key)
      const value = obj[key]
      result[camelKey] = keysToCamel(value)
    }
  }
  return result
}

/**
 * Transform object keys from camelCase to snake_case
 */
export function keysToSnake<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => keysToSnake(item)) as any
  }

  if (typeof obj !== 'object' || obj instanceof Date) {
    return obj
  }

  const result: any = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = toSnakeCase(key)
      const value = obj[key]
      result[snakeKey] = keysToSnake(value)
    }
  }
  return result
}

/**
 * Transform Supabase query result to frontend format
 * Converts snake_case DB columns to camelCase TypeScript
 */
export function transformFromDB<T>(data: any | any[]): T {
  return keysToCamel<T>(data)
}

/**
 * Transform frontend data to database format
 * Converts camelCase TypeScript to snake_case DB columns
 */
export function transformToDB<T>(data: any): T {
  return keysToSnake<T>(data)
}

/**
 * Core table mappings (for reference)
 */
export const TABLE_MAPPINGS = {
  submissions: {
    frontend: {
      id: 'id',
      journalId: 'journal_id',
      submitterId: 'submitter_id',
      title: 'title',
      abstract: 'abstract',
      status: 'status',
      sectionId: 'section_id',
      language: 'language',
      dateSubmitted: 'date_submitted',
      dateLastActivity: 'date_last_activity',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      stageId: 'stage_id',
    },
  },
  users: {
    frontend: {
      id: 'id',
      username: 'username',
      email: 'email',
      firstName: 'first_name',
      lastName: 'last_name',
      role: 'role',
      affiliation: 'affiliation',
      country: 'country',
      url: 'url',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
  submission_files: {
    frontend: {
      fileId: 'file_id',
      submissionId: 'submission_id',
      fileStage: 'file_stage',
      fileType: 'file_type',
      fileSize: 'file_size',
      originalFileName: 'original_file_name',
      filePath: 'file_path',
      dateUploaded: 'date_uploaded',
      uploaderUserId: 'uploader_user_id',
      genreId: 'genre_id',
      assocType: 'assoc_type',
      assocId: 'assoc_id',
      journalId: 'journal_id',
      createdBy: 'created_by',
    },
  },
  review_assignments: {
    frontend: {
      id: 'id',
      submissionId: 'submission_id',
      reviewerId: 'reviewer_id',
      stageId: 'stage_id',
      round: 'round',
      reviewMethod: 'review_method',
      recommendation: 'recommendation',
      dateAssigned: 'date_assigned',
      dateDue: 'date_due',
      dateConfirmed: 'date_confirmed',
      dateCompleted: 'date_completed',
      dateAcknowledged: 'date_acknowledged',
      declined: 'declined',
      cancelled: 'cancelled',
      reviewRoundId: 'review_round_id',
      dateNotified: 'date_notified',
      dateResponseDue: 'date_response_due',
      quality: 'quality',
      competingInterests: 'competing_interests',
      journalId: 'journal_id',
      comments: 'comments',
      confidentialComments: 'confidential_comments',
      status: 'status',
      dateResponded: 'date_responded',
    },
  },
  journals: {
    frontend: {
      journalId: 'journal_id',
      path: 'path',
      enabled: 'enabled',
      seq: 'seq',
      primaryLocale: 'primary_locale',
      createdAt: 'created_at',
      id: 'id',
      name: 'name',
      acronym: 'acronym',
      issn: 'issn',
      description: 'description',
      publisher: 'publisher',
      contactEmail: 'contact_email',
      onlineIssn: 'online_issn',
      printIssn: 'print_issn',
    },
  },
} as const
