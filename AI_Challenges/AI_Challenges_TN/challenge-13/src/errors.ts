export class ValidationError extends Error {
  readonly fields: Record<string, string>

  constructor(fields: Record<string, string>) {
    super('Validation failed: ' + Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join(', '))
    this.name = 'ValidationError'
    this.fields = fields
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export class AuthError extends Error {
  constructor(message = 'Authentication failed') {
    super(message)
    this.name = 'AuthError'
    Object.setPrototypeOf(this, AuthError.prototype)
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network error') {
    super(message)
    this.name = 'NetworkError'
    Object.setPrototypeOf(this, NetworkError.prototype)
  }
}

export class ApiError extends Error {
  readonly statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}
