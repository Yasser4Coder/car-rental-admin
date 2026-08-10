const API_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(message, { status, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('admin_token');
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data.message || 'Request failed', {
      status: response.status,
      details: data.details,
    });
  }
  return data;
}

/**
 * Multipart upload with real progress (0–100) via XHR.
 * onProgress({ percent, loaded, total, phase })
 * phase: 'upload' | 'processing' | 'done'
 */
function uploadWithProgress(endpoint, formData, { onProgress } = {}) {
  const token = localStorage.getItem('admin_token');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}${endpoint}`);
    xhr.withCredentials = true;
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
      onProgress({
        percent,
        loaded: event.loaded,
        total: event.total,
        phase: 'upload',
      });
    };

    xhr.upload.onload = () => {
      onProgress?.({ percent: 99, loaded: 0, total: 0, phase: 'processing' });
    };

    xhr.onerror = () => reject(new ApiError('Network error while uploading'));
    xhr.onabort = () => reject(new ApiError('Upload cancelled'));

    xhr.onload = () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText || '{}');
      } catch {
        data = {};
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.({ percent: 100, loaded: 0, total: 0, phase: 'done' });
        resolve(data);
        return;
      }

      reject(
        new ApiError(data.message || 'Upload failed', {
          status: xhr.status,
          details: data.details,
        }),
      );
    };

    xhr.send(formData);
  });
}

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, body) =>
    request(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: (endpoint, body) =>
    request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint, body) =>
    request(endpoint, {
      method: 'DELETE',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  upload: (endpoint, formData, options) => uploadWithProgress(endpoint, formData, options),
};

export default api;
