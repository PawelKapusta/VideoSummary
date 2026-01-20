import type {
  ChatMessage,
  CompletionOptions,
  JsonSchema,
  OpenRouterConfig,
  OpenRouterResponse,
} from "./openrouter.types";
import {
  OpenRouterError,
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
  ServerError,
} from "./openrouter.errors";

export class OpenRouterService {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private siteUrl?: string;
  private siteName?: string;

  constructor(config: OpenRouterConfig) {
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel;
    this.baseUrl = config.baseUrl || "https://openrouter.ai/api/v1";
    this.siteUrl = config.siteUrl;
    this.siteName = config.siteName;
  }

  private get headers(): HeadersInit {
    const headers: HeadersInit = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    if (this.siteUrl) {
      headers["HTTP-Referer"] = this.siteUrl;
    }
    if (this.siteName) {
      headers["X-Title"] = this.siteName;
    }

    return headers;
  }

  private async handleError(response: Response): Promise<never> {
    let message = response.statusText;
    try {
      const data = await response.json();
      if (data?.error?.message) {
        message = data.error.message;
      }
    } catch {
      // Ignore JSON parse error, use statusText
    }

    switch (response.status) {
      case 401:
        throw new AuthenticationError(message);
      case 429:
        throw new RateLimitError(message);
      case 400:
        throw new InvalidRequestError(message);
      default:
        if (response.status >= 500) {
          throw new ServerError(message, response.status);
        }
        throw new OpenRouterError(message, response.status);
    }
  }

  private async post<T>(endpoint: string, body: unknown): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        await this.handleError(response);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof OpenRouterError) {
        throw error;
      }
      // Handle network errors or other unexpected errors
      throw new OpenRouterError(error instanceof Error ? error.message : "Unknown error");
    }
  }

  public async complete(messages: ChatMessage[], options?: CompletionOptions): Promise<string> {
    const body = {
      model: options?.model || this.defaultModel,
      messages,
      ...options,
    };

    const response = await this.post<OpenRouterResponse>("/chat/completions", body);

    if (!response.choices || response.choices.length === 0) {
      throw new OpenRouterError("No completion choices returned");
    }

    return response.choices[0].message.content;
  }

  public async completeJson<T>(messages: ChatMessage[], schema: JsonSchema, options?: CompletionOptions): Promise<T> {
    const response_format = {
      type: "json_schema" as const,
      json_schema: {
        name: schema.name,
        strict: schema.strict,
        schema: schema.schema,
      },
    };

    const body = {
      model: options?.model || this.defaultModel,
      messages,
      response_format,
      ...options,
    };

    const response = await this.post<OpenRouterResponse>("/chat/completions", body);

    if (!response.choices || response.choices.length === 0) {
      throw new OpenRouterError("No completion choices returned");
    }

    const content = response.choices[0].message.content;

    try {
      return JSON.parse(content) as T;
    } catch {
      throw new OpenRouterError("Failed to parse JSON response");
    }
  }
}
