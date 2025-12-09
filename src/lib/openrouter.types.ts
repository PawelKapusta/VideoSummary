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

export interface OpenRouterConfig {
  apiKey: string;
  defaultModel: string;
  baseUrl?: string;
  siteUrl?: string;
  siteName?: string;
}

export interface OpenRouterChoice {
  message: ChatMessage;
  finish_reason: string;
}

export interface OpenRouterResponse {
  id: string;
  choices: OpenRouterChoice[];
  created: number;
  model: string;
  usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
  };
  error?: {
    message: string;
    code?: number;
  };
}

