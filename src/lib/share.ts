export type Shared = 'shared' | 'copied' | 'cancelled' | 'failed';

/** The share sheet where there is one (phones), else the clipboard. 'failed' leaves showing the text to the caller. */
export async function shareText(text: string, url?: string): Promise<Shared> {
  try {
    if (navigator.share) {
      await navigator.share(url ? { text, url } : { text });
      return 'shared';
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') return 'cancelled';
  }
  try {
    await navigator.clipboard.writeText(url ? `${text} ${url}` : text);
    return 'copied';
  } catch {
    return 'failed';
  }
}
