export function debounce<Args extends unknown[]>(fn: (...args: Args) => void, delayMs: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}
