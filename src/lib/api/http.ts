import { APP_CONFIG } from "@/config/app-config";

export class ExternalApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ExternalApiError";
  }
}

/**
 * Fetch mit Timeout und Retry (exponentielles Backoff).
 * 404 wird nicht erneut versucht, sondern als null zurueckgegeben.
 */
export async function fetchJsonWithRetry(
  url: string,
  options: { revalidateSeconds: number },
): Promise<unknown | null> {
  const { timeoutMs, retries } = APP_CONFIG.api;
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        next: { revalidate: options.revalidateSeconds },
        headers: { Accept: "application/json" },
      });
      if (res.status === 404) return null;
      if (!res.ok) {
        throw new ExternalApiError(`TCGdex antwortete mit Status ${res.status}`, res.status);
      }
      return (await res.json()) as unknown;
    } catch (err) {
      lastError = err;
      if (err instanceof ExternalApiError && err.status && err.status < 500) {
        throw err;
      }
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 300 * 2 ** attempt));
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw new ExternalApiError(
    lastError instanceof Error ? lastError.message : "Unbekannter Fehler beim Laden von TCGdex",
  );
}
