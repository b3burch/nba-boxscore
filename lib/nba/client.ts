const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  Referer: "https://www.nba.com/",
  Origin: "https://www.nba.com",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
};

const DEFAULT_TIMEOUT_MS = 20_000;
const RETRY_DELAYS_MS = [2_000, 5_000, 15_000];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchJson<T>(url: string): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), DEFAULT_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: HEADERS,
        signal: ctrl.signal,
        cache: "no-store",
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      return (await res.json()) as T;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < RETRY_DELAYS_MS.length) {
        await sleep(RETRY_DELAYS_MS[attempt]);
        continue;
      }
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error(`fetchJson failed: ${url}`);
}
