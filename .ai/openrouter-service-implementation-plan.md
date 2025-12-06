# OpenRouter Service Implementation Plan

This document outlines the implementation plan for the `OpenRouterService`, a dedicated service for interacting with the OpenRouter API to perform LLM-based chat completions.

## 1. Service Description

The `OpenRouterService` will be a robust, strongly-typed service class responsible for all communication with the OpenRouter API. It will handle authentication, request formatting, response parsing, and error management. The service is designed to be technology-agnostic regarding the HTTP client but will use the native `fetch` API as per the project's tech stack.

**Key Features:**
*   **Chat Completion:** Standard interaction with LLMs.
*   **Structured Outputs:** Native support for `response_format` with JSON schemas to ensure deterministic JSON responses.
*   **Type Safety:** Full TypeScript support for requests and responses.
*   **Error Handling:** granular error types for API issues (rate limits, auth, validation).
*   **Configurability:** easy adjustment of models, parameters, and system messages.

## 2. Constructor Description

The constructor will initialize the service with necessary configuration, primarily the API key and optional defaults.

```typescript
constructor(config: OpenRouterConfig)
```

*   **config.apiKey**: The OpenRouter API key (usually from `import.meta.env.OPENROUTER_API_KEY`).
*   **config.baseUrl**: (Optional) API endpoint, defaults to `https://openrouter.ai/api/v1`.
*   **config.defaultModel**: (Optional) The default model to use if not specified in methods (e.g., `google/gemini-2.0-flash-001`).
*   **config.siteUrl**: (Optional) `HTTP-Referer` header value (for OpenRouter rankings).
*   **config.siteName**: (Optional) `X-Title` header value (for OpenRouter rankings).

## 3. Public Methods and Fields

### `complete(messages: ChatMessage[], options?: CompletionOptions): Promise<string>`
Sends a chat conversation to the LLM and returns the content of the assistant's response as a string.
*   **messages**: Array of message objects (`{ role: 'system' | 'user' | 'assistant', content: string }`).
*   **options**: Overrides for model, temperature, max_tokens, etc.

### `completeJson<T>(messages: ChatMessage[], schema: JsonSchema, options?: CompletionOptions): Promise<T>`
Sends a chat conversation and forces a structured JSON response adhering to the provided schema.
*   **messages**: Array of message objects.
*   **schema**: The JSON Schema object that defines the expected structure.
*   **options**: Request options.
*   **Returns**: The parsed JSON object typed as `T`.

## 4. Private Methods and Fields

*   **`headers`**: Getter for constructing standard headers (Auth, Content-Type, Site-Url).
*   **`post<T>(endpoint: string, body: unknown): Promise<T>`**: Internal helper to perform the `fetch` call, handle non-200 responses, and parse JSON.
*   **`handleError(error: unknown): never`**: Centralized error processing to convert raw fetch errors or API error responses into typed application errors.

## 5. Error Handling

The service will define and throw specific error classes to allow the application to react appropriately:

1.  **`OpenRouterError`**: Base class for service errors.
2.  **`AuthenticationError`**: Invalid API key (401).
3.  **`RateLimitError`**: Too many requests (429).
4.  **`InvalidRequestError`**: Malformed request or invalid parameters (400).
5.  **`ServerError`**: OpenRouter side issues (500+).

## 6. Security Considerations

*   **API Key Storage**: API keys must never be hardcoded. They will be loaded from environment variables (`import.meta.env.OPENROUTER_API_KEY`) and accessed only on the server side (Astro endpoints or Server Actions).
*   **Input Validation**: While OpenRouter validates inputs, pre-validation of message content and parameter ranges prevents unnecessary API calls.
*   **Sanitization**: Although the LLM generates text, any HTML/Script content returned should be sanitized before rendering if used directly in the UI (though this is primarily a frontend concern).

## 7. Step-by-step Implementation Plan

### Step 1: Define Types
Create `src/lib/openrouter/types.ts` to define the interfaces for messages, requests, and responses.

```typescript
// src/lib/openrouter/types.ts

export type Role = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface JsonSchema {
  name: string;
  strict: boolean;
  schema: Record<string, any>;
}

export interface ResponseFormat {
  type: 'json_schema';
  json_schema: JsonSchema;
}

export interface CompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  response_format?: ResponseFormat;
}

// ... other interfaces for API responses
```

### Step 2: Implement the Service Class
Create `src/lib/openrouter/service.ts`.

```typescript
// src/lib/openrouter/service.ts
import type { ChatMessage, CompletionOptions, JsonSchema } from './types';

export class OpenRouterService {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private siteUrl?: string;
  private siteName?: string;

  constructor(config: { apiKey: string; defaultModel: string; baseUrl?: string; siteUrl?: string; siteName?: string }) {
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel;
    this.baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
    this.siteUrl = config.siteUrl;
    this.siteName = config.siteName;
  }

  // ... implementation of public and private methods
}
```

### Step 3: Implement `complete` Method
Implement the standard chat completion logic.
*   Construct the request body with `model`, `messages`, and `options`.
*   Call the private `post` helper.
*   Extract `choices[0].message.content` from the response.

### Step 4: Implement `completeJson` Method
Implement the structured output logic.
*   Accept a `JsonSchema` object.
*   Construct the `response_format` object:
    ```javascript
    const response_format = {
      type: 'json_schema',
      json_schema: {
        name: schema.name,
        strict: true,
        schema: schema.schema
      }
    };
    ```
*   Merge this into the request body.
*   Parse the returned string content as JSON.
*   Ideally, validate the parsed JSON against a Zod schema if passed (optional enhancement).

### Step 5: Implement Error Handling
Create `src/lib/openrouter/errors.ts` and implement the `handleError` method in the service.

```typescript
private async handleError(response: Response) {
  const data = await response.json().catch(() => null);
  const message = data?.error?.message || response.statusText;
  
  switch (response.status) {
    case 401: throw new AuthenticationError(message);
    case 429: throw new RateLimitError(message);
    // ... handle others
    default: throw new OpenRouterError(message, response.status);
  }
}
```

### Step 6: Integration
*   Add `OPENROUTER_API_KEY` to `.env`.
*   Update `src/env.d.ts` to include the new variable.
*   Example usage in an Astro API route:

```typescript
// src/pages/api/chat.ts
import { OpenRouterService } from '@/lib/openrouter/service';

const service = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  defaultModel: 'google/gemini-2.0-flash-001',
  siteUrl: import.meta.env.SITE_URL,
});

const response = await service.complete([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Hello!' }
]);
```

