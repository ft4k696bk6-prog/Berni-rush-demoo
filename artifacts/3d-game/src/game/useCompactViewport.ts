import { useEffect, useState } from "react";

function readCompactViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 780;
}

export function useCompactViewport() {
  const [compact, setCompact] = useState(() => readCompactViewport());

  useEffect(() => {
    const media = window.matchMedia("(pointer: coarse)");
    const sync = () => setCompact(media.matches || window.innerWidth <= 780);
    sync();

    media.addEventListener?.("change", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);

    return () => {
      media.removeEventListener?.("change", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, []);

  return compact;
}
