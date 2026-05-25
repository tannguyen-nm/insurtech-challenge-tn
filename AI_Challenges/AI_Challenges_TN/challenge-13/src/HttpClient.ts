import { ApiError, AuthError, NetworkError } from './errors'
import type { SDKConfig } from './types'
import type { TokenStore } from './TokenStore'

export class HttpClient {
  constructor(
    private tokenStore: TokenStore,
    private config: SDKConfig
  ) {}

  private get baseUrl(): string {
    if (this.config.baseUrl) return this.config.baseUrl
    return this.config.environment === 'production'
      ? 'https://api.papaya-insurance.com'
      : 'http://localhost:3000'
  }

  private get timeout(): number {
    return this.config.timeout ?? 30_000
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = await this.tokenStore.getToken()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return await this.parseResponse<T>(res)
    } catch (err) {
      clearTimeout(timeoutId)
      if (err instanceof ApiError || err instanceof AuthError) throw err
      if (err instanceof Error && err.name === 'AbortError') {
        throw new NetworkError(`Request to ${path} timed out`)
      }
      if (err instanceof TypeError) {
        throw new NetworkError(`Network error on ${path}: ${err.message}`)
      }
      throw err
    }
  }

  async postFormData<T>(path: string, formData: FormData): Promise<T> {
    const token = await this.tokenStore.getToken()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return await this.parseResponse<T>(res)
    } catch (err) {
      clearTimeout(timeoutId)
      if (err instanceof ApiError || err instanceof AuthError) throw err
      if (err instanceof Error && err.name === 'AbortError') {
        throw new NetworkError('File upload timed out')
      }
      if (err instanceof TypeError) {
        throw new NetworkError(`Upload network error: ${err.message}`)
      }
      throw err
    }
  }

  private async parseResponse<T>(res: Response): Promise<T> {
    if (res.status === 401 || res.status === 403) {
      throw new AuthError('Unauthorized — check your API key or token')
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { message?: string; error?: string }
      throw new ApiError(res.status, body.message ?? body.error ?? `HTTP ${res.status}`)
    }
    return res.json() as Promise<T>
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path)
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body)
  }
}
