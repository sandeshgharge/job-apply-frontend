import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import {
  AiProvider,
  AiProviderConfig,
  AiMessage,
  AiRequest,
  AiResponse,
  PROVIDER_URL_HINTS,
  PROVIDER_MODEL_HINTS,
} from './ai-provider.model';
import { AiAdapter } from './ai-adapter.interface';
import { AnthropicAdapter } from './adapters/anthropic.adapter';
import { OpenAiCompatibleAdapter } from './adapters/openai-compatible.adapter';
import { AIServiceInterface } from '../ai.service.interface';
import { Store } from '@ngrx/store';
import { selectProfileApiKey, selectProfileApiUrl, selectProfileModelName } from '@app/utils/store/profile/profile.selector';

/**
 * Generic, provider-agnostic AI service.
 *
 * ## Usage
 * Inject `AiService` and call `generate()` or `generateText()` with a
 * {@link AiProviderConfig} sourced from the user's profile.
 *
 * ```ts
 * private ai = inject(AiService);
 *
 * const response = await firstValueFrom(
 *   this.ai.generateText('Write a cover letter intro', {
 *     apiUrl: profile.agentApiUrl,
 *     apiKey: profile.agentApiKey,
 *     modelName: profile.modelName,
 *   })
 * );
 * console.log(response.text);
 * ```
 *
 * ## Provider auto-detection
 * When `config.provider` is not set the service infers the provider from
 * the `apiUrl` and `modelName` using heuristic maps. Unknown providers fall
 * back to the OpenAI-compatible adapter (most APIs implement this spec).
 *
 * ## Supported providers
 * | Provider    | Detection heuristic              | Auth header         |
 * |-------------|----------------------------------|---------------------|
 * | OpenAI      | url contains `openai.com`        | `Authorization: Bearer` |
 * | Anthropic   | url contains `anthropic.com`     | `x-api-key`         |
 * | Groq        | url contains `groq.com`          | `Authorization: Bearer` |
 * | Perplexity  | url contains `perplexity.ai`     | `Authorization: Bearer` |
 * | Custom      | any other URL                    | `Authorization: Bearer` |
 */
export class AIService implements AIServiceInterface {
  private http = inject(HttpClient);
  private store = inject(Store);

  // ─────────────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────────────

  generate(prompt: string): Observable<any> {

    const apiUrl = this.store.selectSignal(selectProfileApiUrl)();
    const apiKey = this.store.selectSignal(selectProfileApiKey)();
    const modelName = this.store.selectSignal(selectProfileModelName)();

    if(!apiUrl || !apiKey || !modelName){
      return throwError(() => new Error('AI API configuration is missing. Please check your profile settings.'));
    }
    
    const config : AiProviderConfig = {
      apiUrl: apiUrl,
      apiKey: apiKey,
      modelName: modelName
    }
    const provider = this.detectProvider(config);
    const adapter = this.resolveAdapter(provider);
    return adapter.generate(config, { messages: [{ role: 'user', content: prompt }] });

  }

  /**
   * Send a normalised {@link AiRequest} to the configured provider.
   *
   * @param config  User-supplied provider configuration.
   * @param request Normalised messages + optional parameters.
   * @returns Observable that emits a single normalised {@link AiResponse}.
   */
  generatev2(config: AiProviderConfig, request: AiRequest): Observable<AiResponse> {
    const validationError = this.validateConfig(config);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    const provider = this.detectProvider(config);
    const adapter = this.resolveAdapter(provider);
    return adapter.generate(config, request);
  }

  /**
   * Convenience method: send a single user text prompt and return the
   * normalised {@link AiResponse}.
   *
   * Optionally pass a `systemPrompt` via `config.systemPrompt`.
   *
   * @param userPrompt Plain text prompt from the user.
   * @param config     User-supplied provider configuration.
   */
  generateText(userPrompt: string, config: AiProviderConfig): Observable<AiResponse> {
    const messages: AiMessage[] = [];

    if (config.systemPrompt) {
      messages.push({ role: 'system', content: config.systemPrompt });
    }
    messages.push({ role: 'user', content: userPrompt });

    return this.generatev2(config, { messages });
  }

  /**
   * Convenience method: send a full message thread and return the response.
   *
   * @param messages Full conversation history.
   * @param config   User-supplied provider configuration.
   */
  generateFromMessages(messages: AiMessage[], config: AiProviderConfig): Observable<AiResponse> {
    return this.generatev2(config, { messages });
  }

  /**
   * Resolve the {@link AiProvider} enum value for the given config.
   * Exposed publicly so callers can display the detected provider in the UI.
   */
  detectProvider(config: AiProviderConfig): AiProvider {
    if (config.provider) return config.provider;

    const url = (config.apiUrl ?? '').toLowerCase();
    for (const [hint, provider] of PROVIDER_URL_HINTS) {
      if (url.includes(hint)) return provider;
    }

    const model = (config.modelName ?? '').toLowerCase();
    for (const [prefix, provider] of PROVIDER_MODEL_HINTS) {
      if (model.startsWith(prefix)) return provider;
    }

    return AiProvider.Custom;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Return an adapter instance for the given {@link AiProvider}.
   * Groq and Perplexity reuse the OpenAI-compatible adapter with their label.
   */
  private resolveAdapter(provider: AiProvider): AiAdapter {
    switch (provider) {
      case AiProvider.Anthropic:
        return new AnthropicAdapter(this.http);

      case AiProvider.Groq:
        return new OpenAiCompatibleAdapter(this.http, AiProvider.Groq);

      case AiProvider.Perplexity:
        return new OpenAiCompatibleAdapter(this.http, AiProvider.Perplexity);

      case AiProvider.OpenAI:
      case AiProvider.Custom:
      default:
        return new OpenAiCompatibleAdapter(this.http, provider);
    }
  }

  /**
   * Basic sanity check on the config before hitting the network.
   * Returns an error message string if invalid, `null` if valid.
   */
  private validateConfig(config: AiProviderConfig): string | null {
    if (!config.apiUrl?.trim()) return 'AI API URL is required.';
    if (!config.apiKey?.trim()) return 'AI API key is required.';
    if (!config.modelName?.trim()) return 'AI model name is required.';
    return null;
  }
}
