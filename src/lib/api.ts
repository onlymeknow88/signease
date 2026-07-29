/**
 * Wrapper around fetch for API calls.
 * Automatically redirects to /login when session is expired (401).
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login";
    // Return a never-resolving promise to stop further execution
    return new Promise(() => {});
  }
  return res;
}
