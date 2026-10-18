// The one place that actually talks to the backend over the internet.

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000"

// While true, the book, progress, and chat services return fake data instead of calling the backend.
// (Profiles always use the real backend.) Set VITE_USE_MOCK=false in frontend/.env once the rest is built.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false"

let authToken: string | null = null

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (authToken) headers.Authorization = `Bearer ${authToken}`

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) {
    throw new ApiError(`${method} ${path} failed (${response.status})`, response.status)
  }
  return response.json()
}

// An error from the backend, with its HTTP status code (e.g. 404 = not found)
export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export const ApiClient = {
  get<T>(path: string) {
    return request<T>("GET", path)
  },
  post<T>(path: string, body: unknown) {
    return request<T>("POST", path, body)
  },
  setAuthToken(token: string | null) {
    authToken = token
  },
}

// Wait a bit so fake data feels like it's coming from a server
export function fakeDelay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
