import axios from 'axios';

export const UNAUTHORIZED_EVENT = 'auth:unauthorized';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // send the httpOnly auth cookie
  timeout: 15000,
});

/** Normalizes every API failure into an Error with `status` and field `details`. */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const payload = error.response?.data?.error;
    // A reply without our { error } envelope didn't come from the API: e.g. the dev proxy
    // when the server isn't running, or another app (like macOS AirPlay) on the same port.
    const notFromApi = !error.response || typeof payload !== 'object';
    const message =
      payload?.message ||
      (error.code === 'ECONNABORTED' ? 'The request timed out' : null) ||
      (notFromApi
        ? 'Cannot reach the API server. Make sure `npm run dev` is running and check the terminal for errors.'
        : 'Something went wrong');

    // A 401 outside the auth endpoints means the session expired.
    if (status === 401 && !error.config?.url?.startsWith('/auth/')) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }

    const normalized = new Error(message);
    normalized.status = status;
    normalized.details = payload?.details || [];
    return Promise.reject(normalized);
  },
);

/** Unwraps the `{ success, data }` envelope. */
export const unwrap = (promise) => promise.then((res) => res.data.data);

export default api;
