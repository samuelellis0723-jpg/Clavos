/**
 * Central HTTP adapter for Clavos API.
 * Respects response.ok, response.status, 204 No Content, network vs HTTP errors,
 * and propagates { status, code, message, details, isNetworkError }.
 */

const DEFAULT_API_URL = 'http://localhost:3000/api';

export function getApiBaseUrl() {
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_API_URL
    : undefined;
  const raw = envUrl || globalThis.__CLAVOS_API_URL__ || DEFAULT_API_URL;
  return String(raw).replace(/\/+$/, '');
}

let unauthorizedHandler = null;

export function setOnUnauthorized(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : null;
}

export class ApiClientError extends Error {
  constructor(message, { status = 0, code = 'UNKNOWN_ERROR', details = null, isNetworkError = false } = {}) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.isNetworkError = isNetworkError;
  }
}

export function buildQueryString(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      search.set(key, String(value).trim());
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function apiRequest(path, { token, body, method = 'GET', headers = {}, fetchImpl = globalThis.fetch, skipAuthRedirect = false } = {}) {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${normalizedPath}`;

  const requestHeaders = {
    Accept: 'application/json',
    ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  let response;
  try {
    response = await fetchImpl(url, {
      method,
      headers: requestHeaders,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch (networkErr) {
    throw new ApiClientError(
      'No se pudo conectar con el servidor de Clavos. Verifica que el backend esté en ejecución y que el origen esté permitido por CORS.',
      {
        status: 0,
        code: 'NETWORK_ERROR',
        details: { originalMessage: networkErr?.message || 'Failed to fetch' },
        isNetworkError: true,
      }
    );
  }

  if (response.status === 204) {
    return null;
  }

  let payload = null;
  const contentType = response.headers?.get?.('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  } else {
    try {
      const text = await response.text();
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const apiErr = payload?.error || {};
    const status = response.status;
    const code = apiErr.code || mapDefaultStatusCode(status);
    const message = apiErr.message || mapDefaultStatusMessage(status);
    const details = apiErr.details !== undefined ? apiErr.details : null;

    if (status === 401 && !skipAuthRedirect && unauthorizedHandler) {
      unauthorizedHandler({ status, code, message });
    }

    throw new ApiClientError(message, {
      status,
      code,
      details,
      isNetworkError: false,
    });
  }

  return payload;
}

function mapDefaultStatusCode(status) {
  switch (status) {
    case 400:
      return 'INVALID_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 405:
      return 'USE_CASE_REQUIRED';
    case 409:
      return 'CONFLICT';
    case 413:
      return 'PAYLOAD_TOO_LARGE';
    case 429:
      return 'TOO_MANY_REQUESTS';
    case 500:
      return 'INTERNAL_ERROR';
    case 503:
      return 'DATABASE_UNAVAILABLE';
    default:
      return `HTTP_${status}`;
  }
}

function mapDefaultStatusMessage(status) {
  switch (status) {
    case 400:
      return 'La solicitud contiene parámetros o campos no válidos.';
    case 401:
      return 'Tu sesión ha expirado o no es válida. Inicia sesión nuevamente.';
    case 403:
      return 'No tienes permisos suficientes para realizar esta operación.';
    case 404:
      return 'El recurso o ruta solicitada no está disponible.';
    case 405:
      return 'Escritura genérica deshabilitada. Utiliza el flujo operativo correspondiente.';
    case 409:
      return 'Conflicto de estado, unicidad, presupuesto o concurrencia con el registro actual.';
    case 413:
      return 'El tamaño de los datos enviados excede el límite permitido (256 KB).';
    case 429:
      return 'Demasiados intentos de acceso. Espera un momento antes de volver a intentar.';
    case 500:
      return 'Error interno del servidor al procesar la solicitud.';
    case 503:
      return 'La base de datos MySQL no está disponible en este momento.';
    default:
      return `Error HTTP ${status} al comunicarse con el servidor.`;
  }
}
