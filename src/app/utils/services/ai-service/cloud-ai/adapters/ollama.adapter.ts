import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AiAdapter } from '../ai-adapter.interface';
import { AiProvider, AiProviderConfig, AiRequest, AiResponse } from '../ai-provider.model';

/**
 * Adapter for the Ollama native API.
 *
 * Endpoint: POST {apiUrl}/api/chat
 * Docs: https://github.com/ollama/ollama/blob/main/docs/api.md#generate-a-chat-completion
 */
export class OllamaAdapter implements AiAdapter {
  constructor(private http: HttpClient) {}

  generate(config: AiProviderConfig, request: AiRequest): Observable<AiResponse> {
    const { apiUrl, apiKey, modelName } = config;

    const body = {
      model: modelName,
      messages: request.messages.map(m => ({ role: m.role, content: m.content })),
      stream: false,
      options: {
        temperature: request.temperature ?? 0.7,
        num_predict: request.maxTokens ?? config.maxTokens ?? 2048,
      }
    };

    const headersMap: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Send API key as a Bearer token if it is provided
    if (apiKey?.trim()) {
      headersMap['Authorization'] = `Bearer ${apiKey.trim()}`;
    }

    const headers = new HttpHeaders(headersMap);

    // Normalise base URL: strip trailing slash and ensure /api/chat is targeted
    let base = apiUrl.replace(/\/$/, '');
    if (base.endsWith('/api/chat')) {
      // Keep as is
    } else if (base.endsWith('/api')) {
      base = `${base}/chat`;
    } else {
      base = `${base}/api/chat`;
    }

    // -----------------------------------------------------------------------
    // CORS workaround for the Ollama Cloud API (https://ollama.com).
    //
    // Browsers enforce CORS and ollama.com does NOT return
    // Access-Control-Allow-Origin headers, so direct browser requests are
    // blocked. Postman is unaffected because it is a native app, not a browser.
    //
    // The fix: rewrite the URL so the browser calls /ollama-proxy/... on the
    // SAME origin as the Angular app. A server-side proxy then forwards the
    // request to ollama.com (server-to-server = no CORS).
    //
    //   Local dev  → Angular dev-server proxy    (proxy.conf.json)
    //   Production → Cloudflare Pages Function   (functions/ollama-proxy/[[path]].js)
    //
    // Any other URL (e.g. local Ollama at http://localhost:11434) is left as-is.
    // -----------------------------------------------------------------------
    const OLLAMA_CLOUD_ORIGIN = 'https://ollama.com';
    if (base.startsWith(OLLAMA_CLOUD_ORIGIN)) {
      base = base.replace(OLLAMA_CLOUD_ORIGIN, '/ollama-proxy');
    }

    return this.http.post<any>(base, body, { headers }).pipe(
      map(raw => ({
        text: raw?.message?.content ?? '',
        raw,
        provider: AiProvider.Ollama,
        model: raw?.model ?? modelName,
      } as AiResponse))
    );
  }
}
