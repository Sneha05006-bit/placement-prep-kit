import { useEffect, useState } from "react";

// Reveals `text` one letter at a time. Shows it instantly if the user prefers reduced motion.
export default function useTypewriter(text, speed = 22) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(text);
      return;
    }
    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return shown;
}
