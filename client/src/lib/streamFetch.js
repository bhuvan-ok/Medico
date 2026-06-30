import { store } from '../app/store.js';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Auth-aware fetch for SSE streaming endpoints
export const streamFetch = (path, options = {}) => {
  const token = store.getState().auth?.accessToken;
  return fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};

// Parse SSE events from a ReadableStream — yields parsed data objects
export async function* readSSE(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const event of events) {
      const line = event.trim();
      if (!line.startsWith('data: ')) continue;
      try {
        yield JSON.parse(line.slice(6));
      } catch {
        // skip malformed event
      }
    }
  }
}
