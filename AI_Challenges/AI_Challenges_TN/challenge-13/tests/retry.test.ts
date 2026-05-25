import { withRetry } from '../src/retry'
import { ApiError, NetworkError, ValidationError, AuthError } from '../src/errors'

// Use 1ms base delay so retry tests complete in ~milliseconds
const FAST = 1

describe('withRetry()', () => {
  test('returns result on first success', async () => {
    const fn = jest.fn().mockResolvedValue('ok')
    const result = await withRetry(fn, 3, FAST)
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('retries on 503 and succeeds on 3rd attempt', async () => {
    let calls = 0
    const fn = jest.fn(async () => {
      calls++
      if (calls <= 2) throw new ApiError(503, 'Service Unavailable')
      return 'success'
    })

    const result = await withRetry(fn, 3, FAST)
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  test('throws ApiError after max retries exhausted', async () => {
    const fn = jest.fn(async () => {
      throw new ApiError(503, 'Service Unavailable')
    })

    await expect(withRetry(fn, 3, FAST)).rejects.toThrow(ApiError)
    expect(fn).toHaveBeenCalledTimes(3)
  })

  test('does NOT retry on 400 validation error', async () => {
    const fn = jest.fn(async () => {
      throw new ApiError(400, 'Bad Request')
    })

    await expect(withRetry(fn, 3, FAST)).rejects.toThrow(ApiError)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('does NOT retry on 401 auth error', async () => {
    const fn = jest.fn(async () => {
      throw new ApiError(401, 'Unauthorized')
    })

    await expect(withRetry(fn, 3, FAST)).rejects.toThrow(ApiError)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('does NOT retry on 404 not found', async () => {
    const fn = jest.fn(async () => {
      throw new ApiError(404, 'Not Found')
    })

    await expect(withRetry(fn, 3, FAST)).rejects.toThrow(ApiError)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('retries on NetworkError', async () => {
    let calls = 0
    const fn = jest.fn(async () => {
      calls++
      if (calls < 3) throw new NetworkError('Connection refused')
      return 'connected'
    })

    const result = await withRetry(fn, 3, FAST)
    expect(result).toBe('connected')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  test('throws after max retries with NetworkError', async () => {
    const fn = jest.fn(async () => {
      throw new NetworkError('No route to host')
    })

    await expect(withRetry(fn, 3, FAST)).rejects.toThrow(NetworkError)
    expect(fn).toHaveBeenCalledTimes(3)
  })
})

describe('Error types', () => {
  test('ValidationError has fields property', () => {
    const err = new ValidationError({ policyId: 'required', amount: 'must be positive' })
    expect(err).toBeInstanceOf(ValidationError)
    expect(err.name).toBe('ValidationError')
    expect(err.fields.policyId).toBe('required')
    expect(err.fields.amount).toBe('must be positive')
    expect(err.message).toContain('Validation failed')
  })

  test('AuthError is instance of Error', () => {
    const err = new AuthError('Invalid API key')
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(AuthError)
    expect(err.name).toBe('AuthError')
    expect(err.message).toBe('Invalid API key')
  })

  test('NetworkError is instance of Error', () => {
    const err = new NetworkError('Timeout')
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(NetworkError)
    expect(err.name).toBe('NetworkError')
  })

  test('ApiError has statusCode', () => {
    const err = new ApiError(503, 'Service Unavailable')
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.name).toBe('ApiError')
    expect(err.statusCode).toBe(503)
    expect(err.message).toBe('Service Unavailable')
  })

  test('instanceof checks work correctly', () => {
    const errors = [
      new ValidationError({ field: 'msg' }),
      new AuthError(),
      new NetworkError(),
      new ApiError(500, 'error'),
    ]

    errors.forEach((err) => expect(err).toBeInstanceOf(Error))

    expect(errors[0]).toBeInstanceOf(ValidationError)
    expect(errors[0]).not.toBeInstanceOf(AuthError)
    expect(errors[1]).toBeInstanceOf(AuthError)
    expect(errors[1]).not.toBeInstanceOf(NetworkError)
    expect(errors[2]).toBeInstanceOf(NetworkError)
    expect(errors[3]).toBeInstanceOf(ApiError)
    expect(errors[3]).not.toBeInstanceOf(ValidationError)
  })
})
