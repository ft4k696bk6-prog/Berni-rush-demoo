import { useGameStore } from "./useGameStore";
import { DRUG_CONFIG } from "./types";

export default function HUD() {
  const { health, maxHealth, score, activeEffects, phase, wave } = useGameStore();

  if (phase !== "playing") return null;

  const now = Date.now();
  const isBossWave = wave === 10 || wave === 20;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0,
      pointerEvents: "none", zIndex: 10,
      fontFamily: "'Courier New', monospace",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 20px" }}>

        {/* Health */}
        <div style={{ minWidth: 210 }}>
          <div style={{ color: "#ff3333", fontSize: 12, marginBottom: 3, letterSpacing: 2, textShadow: "1px 1px 0 #000, 0 0 8px #ff0000" }}>
            ♥ HEALTH
          </div>
          <div style={{ width: 210, height: 16, background: "rgba(0,0,0,0.7)", border: "2px solid #333", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              width: `${(health / maxHealth) * 100}%`,
              height: "100%",
              background: health > 50 ? "#44cc44" : health > 25 ? "#ffaa00" : "#ff2200",
              transition: "width 0.3s ease",
              boxShadow: health > 50 ? "0 0 6px #44cc44" : "0 0 6px #ff2200",
            }} />
          </div>
          <div style={{ color: "#ffff88", fontSize: 11, marginTop: 2, textShadow: "1px 1px 0 #000" }}>{health} / {maxHealth}</div>
        </div>

        {/* Wave + Score */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            color: isBossWave ? "#ff4400" : "#88ffaa",
            fontSize: isBossWave ? 13 : 11,
            letterSpacing: 4,
            marginBottom: 2,
            textShadow: isBossWave
              ? "1px 1px 0 #000, 0 0 12px #ff4400"
              : "1px 1px 0 #000",
            fontWeight: isBossWave ? "bold" : "normal",
          }}>
            {isBossWave ? "⚠ BOSS WAVE " : "WAVE "}{wave}
          </div>
          <div style={{
            color: "#ffffff",
            fontSize: 30,
            fontWeight: "bold",
            textShadow: "2px 2px 0 #000, 0 0 20px rgba(255,255,255,0.3)",
            letterSpacing: 4,
          }}>
            {score.toString().padStart(6, "0")}
          </div>
        </div>

        {/* Controls hint */}
        <div style={{ textAlign: "right", color: "#ffff88", fontSize: 10, lineHeight: 1.9, textShadow: "1px 1px 0 #000", opacity: 0.7 }}>
          <div>WASD — Move</div>
          <div>SPACE — Jump</div>
          <div>CLICK — Shoot</div>
          <div>ENTER — Melee</div>
        </div>
      </div>

      {/* Active mushroom effects */}
      {activeEffects.length > 0 && (
        <div style={{ padding: "0 20px", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {activeEffects.map(effect => {
            const cfg = DRUG_CONFIG[effect.type];
            const remaining = ((effect.expiresAt - now) / 1000).toFixed(1);
            const pct = (effect.expiresAt - now) / (cfg.duration * 1000);
            return (
              <div key={effect.type} style={{
                background: "rgba(0,0,0,0.82)",
                border: `2px solid ${cfg.color}`,
                borderRadius: 4,
                padding: "6px 10px",
                minWidth: 140,
                boxShadow: `0 0 10px ${cfg.color}44`,
              }}>
                <div style={{ color: cfg.color, fontSize: 11, fontWeight: "bold", letterSpacing: 2, textShadow: `0 0 8px ${cfg.color}` }}>
                  🍄 {cfg.label}
                </div>
                <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 9, margin: "2px 0" }}>{cfg.description}</div>
                <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden", marginTop: 3 }}>
                  <div style={{ width: `${Math.max(0, pct * 100)}%`, height: "100%", background: cfg.color, transition: "width 0.1s linear", boxShadow: `0 0 4px ${cfg.color}` }} />
                </div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, marginTop: 2 }}>{remaining}s</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Crosshair */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 22, height: 22, pointerEvents: "none",
      }}>
        <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "rgba(255,255,100,0.75)", marginTop: -1, boxShadow: "0 0 4px #fff" }} />
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: "rgba(255,255,100,0.75)", marginLeft: -1, boxShadow: "0 0 4px #fff" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", width: 6, height: 6, marginTop: -3, marginLeft: -3, borderRadius: "50%", background: "rgba(255,255,100,0.5)" }} />
      </div>
    </div>
  );
}
