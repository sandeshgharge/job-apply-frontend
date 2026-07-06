import { Observable } from 'rxjs';
import { AiProviderConfig, AiRequest, AiResponse } from './ai-provider.model';

/**
 * Every provider adapter must implement this interface.
 *
 * The adapter is responsible for:
 *  1. Translating the normalised {@link AiRequest} into the provider-specific
 *     HTTP request body.
 *  2. Making the HTTP call via Angular's HttpClient (passed in the constructor).
 *  3. Mapping the raw provider response back to a normalised {@link AiResponse}.
 */
export interface AiAdapter {
  /**
   * Send a chat-completion request and return a normalised response.
   * @param config - User-supplied provider configuration.
   * @param request - Normalised request payload.
   */
  generate(config: AiProviderConfig, request: AiRequest): Observable<AiResponse>;
}
