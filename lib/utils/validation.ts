// Validation utilities for forms and data

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function isValidOrcid(orcid: string): boolean {
  // ORCID format: 0000-0000-0000-000X (where X can be a digit or X)
  const orcidRegex = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/
  return orcidRegex.test(orcid)
}

export function isValidIssn(issn: string): boolean {
  // ISSN format: 0000-0000
  const issnRegex = /^\d{4}-\d{4}$/
  return issnRegex.test(issn)
}

export function isValidDoi(doi: string): boolean {
  // DOI format: 10.xxxx/xxxxx
  const doiRegex = /^10\.\d{4,}\/\S+$/
  return doiRegex.test(doi)
}

export function isNotEmpty(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim().length > 0
}

export function isMinLength(value: string, minLength: number): boolean {
  return value.length >= minLength
}

export function isMaxLength(value: string, maxLength: number): boolean {
  return value.length <= maxLength
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateSubmission(data: {
  title?: string
  abstract?: string
  keywords?: string[]
}): ValidationResult {
  const errors: string[] = []

  if (!isNotEmpty(data.title)) {
    errors.push("Title is required")
  } else if (!isMinLength(data.title!, 10)) {
    errors.push("Title must be at least 10 characters")
  }

  if (!isNotEmpty(data.abstract)) {
    errors.push("Abstract is required")
  } else if (!isMinLength(data.abstract!, 100)) {
    errors.push("Abstract must be at least 100 characters")
  }

  if (!data.keywords || data.keywords.length < 3) {
    errors.push("At least 3 keywords are required")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateUser(data: {
  email?: string
  firstName?: string
  lastName?: string
}): ValidationResult {
  const errors: string[] = []

  if (!isNotEmpty(data.email)) {
    errors.push("Email is required")
  } else if (!isValidEmail(data.email!)) {
    errors.push("Invalid email format")
  }

  if (!isNotEmpty(data.firstName)) {
    errors.push("First name is required")
  }

  if (!isNotEmpty(data.lastName)) {
    errors.push("Last name is required")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
