export function safeParse<T>(str: string | null | undefined, fallback: T): T {
  if (str === null || str === undefined) {
    return fallback;
  }
  try {
    return JSON.parse(str) as T;
  } catch (err) {
    console.error('Failed to parse JSON:', err);
    return fallback;
  }
}

export function safeStringify(value: unknown): string | null {
  try {
    return JSON.stringify(value);
  } catch (err) {
    console.error('Failed to stringify JSON:', err);
    return null;
  }
}
