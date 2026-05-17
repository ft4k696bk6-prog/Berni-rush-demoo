import { useEffect } from "react";
import Scene from "./Scene";
import HUD from "./HUD";
import MenuScreen from "./MenuScreen";
import PauseMenu from "./PauseMenu";
import AbilityDraft from "./AbilityDraft";
import TouchControls from "./TouchControls";
import { useGameStore } from "./useGameStore";
import { toggleGameFullscreen } from "./fullscreen";
import "./game.css";

const TESTER_COIN_CODE = "BERNIRICH";

export default function Game() {
  const phase = useGameStore(s => s.phase);
  const mobileLeftHanded = useGameStore(s => s.mobileLeftHanded);
  const pauseGame = useGameStore(s => s.pauseGame);
  const resumeGame = useGameStore(s => s.resumeGame);
  const grantTesterCoins = useGameStore(s => s.grantTesterCoins);

  useEffect(() => {
    let codeBuffer = "";
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.altKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        void toggleGameFullscreen();
        return;
      }

      const target = event.target as HTMLElement | null;
      const typingInForm = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT";
      if (!typingInForm && event.key.length === 1) {
        codeBuffer = `${codeBuffer}${event.key.toUpperCase()}`.slice(-TESTER_COIN_CODE.length);
        if (codeBuffer === TESTER_COIN_CODE) {
          event.preventDefault();
          grantTesterCoins();
          codeBuffer = "";
          return;
        }
      }

      if (event.key !== "Escape") return;
      const currentPhase = useGameStore.getState().phase;
      if (currentPhase === "playing") pauseGame();
      if (currentPhase === "paused") resumeGame();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [grantTesterCoins, pauseGame, resumeGame]);

  useEffect(() => {
    const pauseAndSave = () => {
      if (useGameStore.getState().phase !== "playing") return;
      pauseGame();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") pauseAndSave();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", pauseAndSave);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", pauseAndSave);
    };
  }, [pauseGame]);

  useEffect(() => {
    const isCoarsePortrait = () => {
      if (typeof window === "undefined") return false;
      return window.matchMedia("(pointer: coarse)").matches && window.innerHeight > window.innerWidth;
    };

    const handleOrientation = () => {
      if (!isCoarsePortrait()) return;
      if (useGameStore.getState().phase !== "playing") return;
      pauseGame();
    };

    window.addEventListener("resize", handleOrientation);
    window.addEventListener("orientationchange", handleOrientation);
    return () => {
      window.removeEventListener("resize", handleOrientation);
      window.removeEventListener("orientationchange", handleOrientation);
    };
  }, [pauseGame]);

  return (
    <div className={`game-root ${phase} ${mobileLeftHanded ? "mobile-left-handed" : ""}`.trim()}>
      <Scene />
      <HUD />
      <AbilityDraft />
      <TouchControls />
      <PauseMenu />
      <MenuScreen />
    </div>
  );
}
