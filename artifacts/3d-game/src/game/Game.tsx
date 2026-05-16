import { useEffect } from "react";
import Scene from "./Scene";
import HUD from "./HUD";
import MenuScreen from "./MenuScreen";
import PauseMenu from "./PauseMenu";
import AbilityDraft from "./AbilityDraft";
import TouchControls from "./TouchControls";
import { useGameStore } from "./useGameStore";
import "./game.css";

export default function Game() {
  const phase = useGameStore(s => s.phase);
  const pauseGame = useGameStore(s => s.pauseGame);
  const resumeGame = useGameStore(s => s.resumeGame);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const currentPhase = useGameStore.getState().phase;
      if (currentPhase === "playing") pauseGame();
      if (currentPhase === "paused") resumeGame();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pauseGame, resumeGame]);

  return (
    <div className={`game-root ${phase}`}>
      <Scene />
      <HUD />
      <AbilityDraft />
      <TouchControls />
      <PauseMenu />
      <MenuScreen />
    </div>
  );
}
