import { useEffect, useState } from "react";
import { Crosshair, Play, RotateCcw, Save, Shield, ShoppingBag, Swords, Zap } from "lucide-react";
import { useGameStore } from "./useGameStore";
import { hasSavedGame } from "./saveSystem";

export default function MenuScreen() {
  const phase = useGameStore(s => s.phase);
  const score = useGameStore(s => s.score);
  const stage = useGameStore(s => s.stage);
  const totalKills = useGameStore(s => s.totalKills);
  const records = useGameStore(s => s.records);
  const startGame = useGameStore(s => s.startGame);
  const restartGame = useGameStore(s => s.restartGame);
  const loadGame = useGameStore(s => s.loadGame);
  const [hasSave, setHasSave] = useState(false);

  useEffect(() => {
    setHasSave(hasSavedGame());
  }, [phase]);

  if (phase === "playing" || phase === "paused" || phase === "upgrade") return null;

  const isGameOver = phase === "gameover";

  return (
    <div className="menu-screen">
      <div className="menu-stage">
        <div className="title-block">
          <span>ARCADE SURVIVAL</span>
          <h1>TOXIC HARVEST</h1>
          <p>Move to dodge, aim with mouse or touch, hold to shoot and pick wild abilities.</p>
        </div>

        {isGameOver && (
          <section className="gameover-strip">
            <strong>GAME OVER</strong>
            <span>SCORE {score.toString().padStart(6, "0")} - LEVEL {stage} - {totalKills} KILLS</span>
          </section>
        )}

        <div className="menu-actions">
          <button type="button" onClick={isGameOver ? restartGame : startGame}>
            {isGameOver ? <RotateCcw size={20} /> : <Play size={20} />}
            {isGameOver ? "PLAY AGAIN" : "PLAY"}
          </button>
          {hasSave && !isGameOver && (
            <button type="button" onClick={loadGame}>
              <Save size={20} />
              CONTINUE
            </button>
          )}
        </div>

        <div className="menu-info-grid">
          <div><Swords size={20} /><b>WASD</b><span>Move</span></div>
          <div><Crosshair size={20} /><b>AIM</b><span>Mouse or right pad</span></div>
          <div><Zap size={20} /><b>SPACE</b><span>Dash</span></div>
          <div><Shield size={20} /><b>F</b><span>Melee</span></div>
          <div><ShoppingBag size={20} /><b>COINS</b><span>Buy weapons</span></div>
        </div>

        <div className="menu-records">
          <span>BEST SCORE {records.bestScore.toString().padStart(6, "0")}</span>
          <span>BEST LEVEL {records.highestStage}</span>
          <span>MOST KILLS {records.mostKills}</span>
        </div>
      </div>
    </div>
  );
}
