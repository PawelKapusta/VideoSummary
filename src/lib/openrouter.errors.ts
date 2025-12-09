export class OpenRouterError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

export class AuthenticationError extends OpenRouterError {
  constructor(message: string = 'Invalid API Key') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends OpenRouterError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

export class InvalidRequestError extends OpenRouterError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'InvalidRequestError';
  }
}

export class ServerError extends OpenRouterError {
  constructor(message: string, status: number) {
    super(message, status);
    this.name = 'ServerError';
  }
}

