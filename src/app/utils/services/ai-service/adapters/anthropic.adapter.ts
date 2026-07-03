import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AiAdapter } from '../ai-adapter.interface';
import { AiProvider, AiProviderConfig, AiRequest, AiResponse } from '../ai-provider.model';

/**
 * Adapter for the Anthropic Messages API.
 *
 * Endpoint: POST {apiUrl}/messages
 * Docs: https://docs.anthropic.com/reference/messages
 *
 * Key differences from OpenAI-compatible APIs:
 *  - Uses `x-api-key` header instead of `Authorization: Bearer`.
 *  - `system` is a top-level field, not a message with role `system`.
 *  - Response text is in `content[0].text`.
 */
export class AnthropicAdapter implements AiAdapter {
  /** Minimum Anthropic API version to send */
  private static readonly API_VERSION = '2023-06-01';

  constructor(private http: HttpClient) {}

  generate(config: AiProviderConfig, request: AiRequest): Observable<AiResponse> {
    const { apiUrl, apiKey, modelName } = config;

    // Separate the optional system message from user/assistant turns
    const systemMessages = request.messages.filter(m => m.role === 'system');
    const conversationMessages = request.messages.filter(m => m.role !== 'system');

    const body: Record<string, unknown> = {
      model: modelName,
      max_tokens: request.maxTokens ?? config.maxTokens ?? 2048,
      temperature: request.temperature ?? 0.7,
      messages: conversationMessages.map(m => ({ role: m.role, content: m.content })),
    };

    if (systemMessages.length > 0) {
      body['system'] = systemMessages.map(m => m.content).join('\n');
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': AnthropicAdapter.API_VERSION,
    });

    const endpoint = `${apiUrl.replace(/\/$/, '')}/messages`;

    return this.http.post<any>(endpoint, body, { headers }).pipe(
      map(raw => ({
        text: raw?.content?.[0]?.text ?? '',
        raw,
        provider: AiProvider.Anthropic,
        model: raw?.model ?? modelName,
      } as AiResponse))
    );
  }
}
