/**
 * Centrally sanitizes error messages for production.
 * Filters out raw status codes and technical details.
 */
export const errMsg = (e: unknown): string => {
  const x = e as { response?: { data?: { message?: string } } };
  let message = x?.response?.data?.message || (e instanceof Error ? e.message : 'An unexpected error occurred');

  // Sanitize "status code" messages
  if (message.toLowerCase().includes('status code')) {
    return 'Action failed. Please try again later.';
  }

  // Sanitize "failed to fetch" or connection errors
  if (message.toLowerCase().includes('failed to fetch') || message.toLowerCase().includes('network error')) {
    return 'Network error. Please check your connection.';
  }

  return message;
};
