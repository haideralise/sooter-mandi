/**
 * The API returns two different error shapes:
 *
 *   - Controller failures use the ApiResponse trait:
 *       { success: false, error: "Invalid email or password.", details: null }
 *   - Validation (422) and framework errors use Laravel's default handler:
 *       { message: "The email has already been taken.", errors: { email: [...] } }
 *
 * Reading only `message` silently swallows the first kind, which is why login
 * failures used to surface as a generic "Login failed".
 */
export function apiErrorMessage(error: any, fallback = 'Something went wrong'): string {
  const data = error?.response?.data;

  if (!data) {
    return error?.message || fallback;
  }

  if (typeof data.error === 'string' && data.error) {
    return data.error;
  }

  if (typeof data.message === 'string' && data.message) {
    return data.message;
  }

  const firstFieldError = apiFieldErrors(error);
  const firstKey = Object.keys(firstFieldError)[0];
  if (firstKey) {
    return firstFieldError[firstKey];
  }

  return fallback;
}

/**
 * Flattens per-field validation errors into { field: "first message" } so forms
 * can show them inline. Handles both `errors` (Laravel) and `details` (ApiResponse).
 */
export function apiFieldErrors(error: any): Record<string, string> {
  const data = error?.response?.data;
  const raw = data?.errors ?? data?.details;

  if (!raw || typeof raw !== 'object') {
    return {};
  }

  return Object.entries(raw).reduce<Record<string, string>>((acc, [field, messages]) => {
    acc[field] = Array.isArray(messages) ? String(messages[0]) : String(messages);
    return acc;
  }, {});
}
