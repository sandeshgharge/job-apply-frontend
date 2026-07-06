/**
 * Supported AI provider types.
 * Used to select the correct request/response adapter.
 */
export enum AiProvider {
  /** OpenAI-compatible APIs (ChatGPT, many local models via OpenAI spec) */
  OpenAI = 'openai',
  /** Anthropic Claude models */
  Anthropic = 'anthropic',
  /** Groq inference API (OpenAI-compatible) */
  Groq = 'groq',
  /** Perplexity AI API (OpenAI-compatible) */
  Perplexity = 'perplexity',
  /** Custom / unknown – falls back to the generic OpenAI-compatible adapter */
  Custom = 'custom',
}

/**
 * Configuration the user supplies for their AI provider.
 * Stored in the user's profile (agentApiUrl, agentApiKey, modelName).
 */
export interface AiProviderConfig {
  /** Full base URL of the AI provider (e.g. https://api.openai.com/v1) */
  apiUrl: string;
  /** Secret API key for the provider */
  apiKey: string;
  /** Model identifier (e.g. gpt-4o, claude-3-5-sonnet-20241022) */
  modelName: string;
  /**
   * Optional explicit provider override.
   * When omitted the service auto-detects from apiUrl / modelName.
   */
  provider?: AiProvider;
  /** Optional maximum tokens to generate (default: 2048) */
  maxTokens?: number;
  /** Optional system prompt override */
  systemPrompt?: string;
}

/**
 * Normalised, provider-agnostic chat message used internally.
 */
export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Normalised request object passed to every adapter.
 */
export interface AiRequest {
  messages: AiMessage[];
  maxTokens?: number;
  /** Temperature 0–1 (default: 0.7) */
  temperature?: number;
}

/**
 * Normalised, provider-agnostic response returned by every adapter.
 */
export interface AiResponse {
  /** The generated text content */
  text: string;
  /** Raw provider response (for debugging / advanced use) */
  raw?: unknown;
  /** Provider that produced this response */
  provider: AiProvider;
  /** Model used */
  model: string;
}

/**
 * Heuristic map: if the API URL contains any of these substrings,
 * we auto-detect the provider.
 */
export const PROVIDER_URL_HINTS: ReadonlyMap<string, AiProvider> = new Map([
  ['anthropic.com', AiProvider.Anthropic],
  ['openai.com', AiProvider.OpenAI],
  ['groq.com', AiProvider.Groq],
  ['perplexity.ai', AiProvider.Perplexity],
]);

/**
 * Heuristic map: if the model name starts with any of these prefixes,
 * we auto-detect the provider (used when the URL alone is not conclusive).
 */
export const PROVIDER_MODEL_HINTS: ReadonlyMap<string, AiProvider> = new Map([
  ['claude', AiProvider.Anthropic],
  ['gpt', AiProvider.OpenAI],
  ['o1', AiProvider.OpenAI],
  ['o3', AiProvider.OpenAI],
  ['o4', AiProvider.OpenAI],
  ['llama', AiProvider.Groq],
  ['mixtral', AiProvider.Groq],
  ['gemma', AiProvider.Groq],
  ['sonar', AiProvider.Perplexity],
  ['pplx', AiProvider.Perplexity],
]);
