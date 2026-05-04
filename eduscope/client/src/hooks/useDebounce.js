// === FILE: client/src/hooks/useDebounce.js ===
import { useEffect, useState } from 'react';
export function useDebounce(value, delay = 300) {
  const [d, setD] = useState(value);
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return d;
}
