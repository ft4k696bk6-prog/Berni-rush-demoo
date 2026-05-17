import { useCallback, useEffect, useState } from "react";

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function fullscreenElement() {
  if (typeof document === "undefined") return null;
  const doc = document as FullscreenDocument;
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

export function isFullscreenActive() {
  return Boolean(fullscreenElement());
}

export async function toggleGameFullscreen() {
  if (typeof document === "undefined") return false;
  const doc = document as FullscreenDocument;

  if (fullscreenElement()) {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
    }
    return false;
  }

  const target = (document.querySelector(".game-root") ?? document.documentElement) as FullscreenElement;
  if (target.requestFullscreen) {
    await target.requestFullscreen({ navigationUI: "hide" });
  } else if (target.webkitRequestFullscreen) {
    await target.webkitRequestFullscreen();
  }

  return isFullscreenActive();
}

export function useFullscreenStatus() {
  const [isFullscreen, setIsFullscreen] = useState(() => isFullscreenActive());

  useEffect(() => {
    const sync = () => setIsFullscreen(isFullscreenActive());
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    void toggleGameFullscreen()
      .then(setIsFullscreen)
      .catch(() => setIsFullscreen(isFullscreenActive()));
  }, []);

  return { isFullscreen, toggleFullscreen };
}
