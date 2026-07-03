import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from 'src/environments/environment';

/**
 * Attaches a Bearer token to every outgoing request that targets the backend API.
 * Reads the access token from sessionStorage, matching the existing auth flow.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isBackendRequest = req.url.startsWith(environment.backendAiApiURL);

  if (!isBackendRequest) {
    return next(req);
  }

  const token = sessionStorage.getItem('access_token');

  if (!token) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authReq);
};
