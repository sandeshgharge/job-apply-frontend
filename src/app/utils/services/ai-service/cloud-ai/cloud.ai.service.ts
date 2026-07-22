import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, switchMap, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { JobDetails } from '../../../entities/job-details';

import {
  AiProvider,
  AiProviderConfig,
  AiMessage,
  AiRequest,
  AiResponse,
  PROVIDER_URL_HINTS,
  PROVIDER_MODEL_HINTS,
} from './ai-provider.model';
import { AiAdapter, AI_ADAPTERS } from './ai-adapter.interface';
import { AIServiceInterface, AIPrompt } from '../ai.service.interface';
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
 * | Perplexity  | url contains `perplexity.ai`     | `x-api-key` or `Authorization` |
 * | Custom      | any other URL                    | `Authorization: Bearer` |
 */
@Injectable({ providedIn: 'root' })
export class CloudAIService implements AIServiceInterface {
  private adapters = inject(AI_ADAPTERS);
  private store = inject(Store);
  private http = inject(HttpClient);

  // ─────────────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────────────

  generate(prompt: AIPrompt): Observable<{ text: string }> {
    const { adapter, config, provider } = this.resolveProvider();
    const messages: AiMessage[] = [];

    if (prompt.system) {
      messages.push({ role: 'system', content: prompt.system });
    }
    messages.push({ role: 'user', content: prompt.user });

    return adapter.generate({ messages }, config, provider).pipe(
      map(res => ({
        text: AIServiceInterface.extractJson(res.text || '')
      }))
    );
  }

  extractJobData(jobDescription: string): Observable<JobDetails> {
    const { adapter, config, provider } = this.resolveProvider();

    return this.http.get(environment.extractJobDataPromptUrl, { responseType: 'text' }).pipe(
      switchMap(promptTemplate => {
        const prompt = promptTemplate.replace('[job_description]', jobDescription);
        return adapter.generate({ messages: [{ role: 'user', content: prompt }] }, config, provider).pipe(
          map(res => {
            console.log(res)
            const text = AIServiceInterface.extractJson(res.text);
            try {
              return JSON.parse(text) as JobDetails;
            } catch (e) {
              console.error('Failed to parse JobDetails JSON', e, text);
              throw e;
            }
          })
        );
      })
    );
  }

  /**
   * Send a normalised {@link AiRequest} to the configured provider.
   *
   * @param config  User-supplied provider configuration.
   * @param request Normalised messages + optional parameters.
   * @returns Observable that emits a single normalised {@link AiResponse}.
   */
  generatev2(config: AiProviderConfig, request: AiRequest): Observable<AiResponse> {
    const provider = this.detectProvider(config);
    const adapter = this.adapters.find(a => a.supports(provider));
    if (!adapter) throw new Error(`No adapter found for provider ${provider}`);
    return adapter.generate(request, config, provider);
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

  private resolveProvider() {
    const apiUrl = this.store.selectSignal(selectProfileApiUrl)();
    const apiKey = this.store.selectSignal(selectProfileApiKey)();
    const modelName = this.store.selectSignal(selectProfileModelName)();

    const config: AiProviderConfig = {
      apiUrl: apiUrl ?? '',
      apiKey: apiKey ?? '',
      modelName: modelName ?? ''
    }
    const validationError = this.validateConfig(config);
    if (validationError) {
      throw new Error(validationError);
    }

    const provider = this.detectProvider(config);
    const adapter = this.adapters.find(a => a.supports(provider));
    if (!adapter) throw new Error(`No adapter found for provider ${provider}`);

    return { adapter, config, provider };
  }

  /**
   * Basic sanity check on the config before hitting the network.
   * Returns an error message string if invalid, `null` if valid.
   */
  private validateConfig(config: AiProviderConfig): string | null {
    if (!config.apiUrl?.trim()) return 'AI API URL is required.';
    if (!config.modelName?.trim()) return 'AI model name is required.';
    if (!config.apiKey?.trim()) return 'AI API key is required.';

    return null;
  }
}
