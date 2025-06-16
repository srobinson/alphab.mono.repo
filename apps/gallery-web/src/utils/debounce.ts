export default function debounce(func: () => void, delay: number) {
  let timeoutId: NodeJS.Timeout | null = null;
  return () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func();
      timeoutId = null;
    }, delay);
  };
}
