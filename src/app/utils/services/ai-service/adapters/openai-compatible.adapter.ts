import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AiAdapter } from '../ai-adapter.interface';
import { AiProvider, AiProviderConfig, AiRequest, AiResponse } from '../ai-provider.model';

/**
 * Generic OpenAI-compatible adapter.
 *
 * Used for:
 *  - OpenAI (https://api.openai.com/v1)
 *  - Groq (https://api.groq.com/openai/v1)
 *  - Perplexity (https://api.perplexity.ai)
 *  - Any custom endpoint that follows the OpenAI Chat Completions spec
 *
 * Endpoint: POST {apiUrl}/chat/completions
 * Docs: https://platform.openai.com/docs/api-reference/chat
 */
export class OpenAiCompatibleAdapter implements AiAdapter {
  constructor(
    private http: HttpClient,
    /** The logical provider label for the response metadata. */
    private providerLabel: AiProvider = AiProvider.OpenAI
  ) {}

  generate(config: AiProviderConfig, request: AiRequest): Observable<AiResponse> {
    const { apiUrl, apiKey, modelName } = config;

    const body = {
      model: modelName,
      max_tokens: request.maxTokens ?? config.maxTokens ?? 2048,
      temperature: request.temperature ?? 0.7,
      messages: request.messages.map(m => ({ role: m.role, content: m.content })),
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    });

    // Normalise the base URL: strip trailing slash, then append endpoint
    const base = apiUrl.replace(/\/$/, '');
    const endpoint = base.endsWith('/chat/completions')
      ? base
      : `${base}/chat/completions`;

    return this.http.post<any>(endpoint, body, { headers }).pipe(
      map(raw => ({
        text: raw?.choices?.[0]?.message?.content ?? '',
        raw,
        provider: this.providerLabel,
        model: raw?.model ?? modelName,
      } as AiResponse))
    );
  }
}
