// === FILE: client/src/hooks/useCountUp.js ===
import { useEffect, useRef, useState } from 'react';
export function useCountUp(target, { duration = 1400 } = {}) {
  const [value, setValue] = useState(0);
  const raf = useRef(); const start = useRef(); const from = useRef(0);
  useEffect(() => {
    cancelAnimationFrame(raf.current); start.current = null; from.current = value;
    const to = Number(target) || 0;
    const step = (ts) => {
      if (!start.current) start.current = ts;
      const p = Math.min((ts - start.current) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setValue(from.current + (to - from.current) * e);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return Math.round(value);
}
