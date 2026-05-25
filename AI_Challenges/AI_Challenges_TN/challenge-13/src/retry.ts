import { ApiError, NetworkError } from './errors'

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

function isRetryable(err: unknown): boolean {
  if (err instanceof ApiError) return err.statusCode === 503
  if (err instanceof NetworkError) return true
  return false
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (!isRetryable(err) || attempt === maxRetries - 1) throw err
      await sleep(Math.pow(2, attempt) * baseDelayMs) // 1×, 2×, 4× baseDelayMs
    }
  }
  throw new Error('unreachable')
}
