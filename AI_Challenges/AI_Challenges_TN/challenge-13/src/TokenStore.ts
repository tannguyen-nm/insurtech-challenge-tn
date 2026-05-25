import { AuthError, NetworkError } from './errors'
import type { SDKConfig } from './types'

interface TokenData {
  token: string
  expiresAt: number
}

export class TokenStore {
  private tokenData: TokenData | null = null
  private refreshPromise: Promise<void> | null = null

  constructor(private config: SDKConfig) {}

  async getToken(): Promise<string> {
    if (this.tokenData && this.tokenData.expiresAt - Date.now() > 60_000) {
      return this.tokenData.token
    }
    // Deduplicate concurrent refresh calls
    if (!this.refreshPromise) {
      this.refreshPromise = this.refresh().finally(() => {
        this.refreshPromise = null
      })
    }
    await this.refreshPromise
    return this.tokenData!.token
  }

  private async refresh(): Promise<void> {
    const baseUrl = this.config.baseUrl ?? this.resolveBaseUrl()
    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.timeout ?? 30_000
    )

    try {
      const res = await fetch(`${baseUrl}/api/v1/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: this.config.apiKey }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (res.status === 401 || res.status === 403) {
        throw new AuthError('Invalid API key')
      }
      if (!res.ok) {
        throw new AuthError(`Token refresh failed with status ${res.status}`)
      }

      const data = (await res.json()) as { token: string; expiresIn: number }
      this.tokenData = {
        token: data.token,
        expiresAt: Date.now() + data.expiresIn * 1000,
      }
    } catch (err) {
      clearTimeout(timeoutId)
      if (err instanceof AuthError) throw err
      if (err instanceof Error && err.name === 'AbortError') {
        throw new NetworkError('Token refresh timed out')
      }
      if (err instanceof TypeError) {
        throw new NetworkError(`Token refresh network error: ${err.message}`)
      }
      throw err
    }
  }

  private resolveBaseUrl(): string {
    return this.config.environment === 'production'
      ? 'https://api.papaya-insurance.com'
      : 'http://localhost:3000'
  }

  /** @internal For testing only */
  _expireToken(): void {
    if (this.tokenData) {
      this.tokenData = { ...this.tokenData, expiresAt: Date.now() - 1 }
    }
  }

  /** @internal For testing only */
  _clearToken(): void {
    this.tokenData = null
  }
}
