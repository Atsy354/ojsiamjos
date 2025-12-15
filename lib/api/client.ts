// lib/api/client.ts
// API client utilities for making authenticated requests

const API_BASE_URL = typeof window !== "undefined" ? window.location.origin : ""

function isFormData(value: any): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData
}

export interface ApiError {
  error: string
  details?: any
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const bodyIsFormData = isFormData((options as any).body)

  const headers: HeadersInit = {
    ...(bodyIsFormData ? {} : { "Content-Type": "application/json" }),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // Check if response is JSON
  const contentType = response.headers.get("content-type")
  if (!contentType || !contentType.includes("application/json")) {
    // If not JSON, likely an error page - try to extract error info
    const text = await response.text()
    const errorMessage = response.status === 500
      ? "Server error. Please check your database connection and ensure the database is seeded."
      : `API returned non-JSON response (${response.status})`
    
    // Try to parse as JSON if it looks like JSON
    try {
      const jsonData = JSON.parse(text)
      if (jsonData.error) {
        throw new Error(jsonData.error)
      }
    } catch {
      // Not JSON, use default error
    }
    
    throw new Error(`${errorMessage}. Check server logs for details.`)
  }

  const data = await response.json()

  if (!response.ok) {
    const errorMsg = data.error || data.message || `API Error: ${response.statusText}`
    const error = new Error(errorMsg)
    ;(error as any).status = response.status
    ;(error as any).details = data.details
    throw error
  }

  return data as T
}

export async function apiPost<T>(endpoint: string, body: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: "POST",
    body: isFormData(body) ? body : JSON.stringify(body),
  })
}

export async function apiPut<T>(endpoint: string, body: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: "PUT",
    body: isFormData(body) ? body : JSON.stringify(body),
  })
}

export async function apiPatch<T>(endpoint: string, body: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: "PATCH",
    body: isFormData(body) ? body : JSON.stringify(body),
  })
}

export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: "GET",
  })
}

export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: "DELETE",
  })
}

export async function apiUploadFile(
  endpoint: string,
  file: File,
  additionalData?: Record<string, string>
): Promise<any> {
  const formData = new FormData()
  formData.append("file", file)
  
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value)
    })
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    body: formData,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || `Upload Error: ${response.statusText}`)
  }

  return data
}

