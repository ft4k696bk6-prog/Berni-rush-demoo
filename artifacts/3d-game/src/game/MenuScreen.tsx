import { useGameStore } from "./useGameStore";

const enemies = [
  { icon: "👻", name: "Ghost",   desc: "Fires ghost balls at range",   color: "#aaaaff" },
  { icon: "🧟", name: "Zombie",  desc: "Slow but tanky — melee hits",  color: "#44bb44" },
  { icon: "💚", name: "Creeper", desc: "Counts down — then BOOM",       color: "#33cc33" },
  { icon: "💀", name: "Boss",    desc: "Waves 10 & 20 — run.",          color: "#ff4400" },
];

const powers = [
  { label: "SPEED SHROOM",   desc: "3× Speed",        color: "#00eeff" },
  { label: "1-UP SHROOM",    desc: "+40 HP instant",  color: "#ff88aa" },
  { label: "STAR SHROOM",    desc: "Invincibility",    color: "#ffdd00" },
  { label: "POWER SHROOM",   desc: "Kill on touch",    color: "#ff6600" },
  { label: "CLOUD SHROOM",   desc: "Flight",           color: "#dd88ff" },
  { label: "TIME SHROOM",    desc: "Slow enemies",     color: "#44ff88" },
  { label: "TRIPLE SHROOM",  desc: "3 bullets/shot",   color: "#ff4488" },
  { label: "BERSERK SHROOM", desc: "360° Melee",       color: "#ff8800" },
];

export default function MenuScreen() {
  const { phase, score, startGame, restartGame } = useGameStore();

  if (phase === "playing") return null;

  const isGameOver = phase === "gameover";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "flex-start",
      overflowY: "auto",
      background: "radial-gradient(ellipse at 50% 30%, #0a0025 0%, #000010 60%, #000000 100%)",
      fontFamily: "'Courier New', monospace",
      paddingBottom: 40,
    }}>
      <div style={{ width: "100%", maxWidth: 760, padding: "0 24px" }}>

        {/* Title */}
        <div style={{ textAlign: "center", paddingTop: 36, marginBottom: 8 }}>
          <div style={{ fontSize: 12, letterSpacing: 8, color: "#446688", textShadow: "0 0 12px #0055aa", marginBottom: 10 }}>
            ⟡ SURVIVAL ADVENTURE ⟡
          </div>
          <div style={{
            fontSize: 80, fontWeight: 900, lineHeight: 1,
            color: "#ffffff",
            textShadow: "0 0 30px #ffffff, 0 0 60px #4488ff, 4px 4px 0 #001166",
            letterSpacing: 8,
          }}>
            BERNI
          </div>
          <div style={{
            fontSize: 80, fontWeight: 900, lineHeight: 1,
            color: "#44ff88",
            textShadow: "0 0 30px #44ff88, 0 0 60px #00ff44, 4px 4px 0 #003322",
            letterSpacing: 8,
            marginBottom: 12,
          }}>
            RUSH
          </div>
          <div style={{ fontSize: 26, letterSpacing: 10, opacity: 0.7 }}>🍄 🍄‍🟫 🍄 🍄‍🟫</div>
        </div>

        {/* Game Over / Score */}
        {isGameOver && (
          <div style={{
            margin: "16px 0",
            padding: "14px 24px",
            background: "rgba(180,0,0,0.2)",
            border: "2px solid #ff2200",
            borderRadius: 6,
            textAlign: "center",
            boxShadow: "0 0 24px #ff220055",
          }}>
            <div style={{ color: "#ff4444", fontSize: 26, fontWeight: "bold", letterSpacing: 6, textShadow: "0 0 16px #ff0000" }}>
              GAME OVER
            </div>
            <div style={{ color: "#ffdd88", fontSize: 17, marginTop: 6, letterSpacing: 4 }}>
              SCORE: {score.toString().padStart(6, "0")}
            </div>
          </div>
        )}

        {/* Play button */}
        <div style={{ textAlign: "center", margin: "22px 0 18px" }}>
          <button
            onClick={isGameOver ? restartGame : startGame}
            style={{
              background: "transparent",
              border: "3px solid #44ff88",
              borderRadius: 4,
              color: "#44ff88",
              fontSize: 20,
              fontFamily: "'Courier New', monospace",
              letterSpacing: 8,
              padding: "14px 56px",
              cursor: "pointer",
              textShadow: "0 0 12px #44ff88",
              boxShadow: "0 0 20px #44ff8830, inset 0 0 20px #44ff8810",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={e => {
              const b = e.currentTarget;
              b.style.background = "#44ff8820";
              b.style.boxShadow = "0 0 32px #44ff8860, inset 0 0 20px #44ff8820";
            }}
            onMouseLeave={e => {
              const b = e.currentTarget;
              b.style.background = "transparent";
              b.style.boxShadow = "0 0 20px #44ff8830, inset 0 0 20px #44ff8810";
            }}
          >
            {isGameOver ? "▶  PLAY AGAIN" : "▶  PLAY"}
          </button>
        </div>

        {/* Controls */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 20 }}>
          {[
            { key: "WASD",  desc: "Move" },
            { key: "SPACE", desc: "Jump" },
            { key: "CLICK", desc: "Shoot at cursor" },
            { key: "ENTER", desc: "Melee attack" },
          ].map(({ key, desc }) => (
            <div key={key} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 4, padding: "8px 12px",
            }}>
              <span style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 3, padding: "2px 8px",
                fontSize: 11, fontWeight: "bold", color: "#ffffaa", letterSpacing: 1,
              }}>{key}</span>
              <span style={{ color: "#aabbcc", fontSize: 11 }}>{desc}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* Enemies */}
          <div>
            <div style={{ color: "#ff8866", fontSize: 10, letterSpacing: 4, marginBottom: 8, textShadow: "0 0 8px #ff4400" }}>
              ✦ ENEMIES
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {enemies.map(e => (
                <div key={e.name} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${e.color}33`,
                  borderLeft: `3px solid ${e.color}`,
                  borderRadius: 4, padding: "7px 10px",
                }}>
                  <span style={{ fontSize: 20 }}>{e.icon}</span>
                  <div>
                    <div style={{ color: e.color, fontSize: 11, fontWeight: "bold", letterSpacing: 2 }}>{e.name}</div>
                    <div style={{ color: "#7799aa", fontSize: 9, marginTop: 1 }}>{e.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mushrooms */}
          <div>
            <div style={{ color: "#88ffcc", fontSize: 10, letterSpacing: 4, marginBottom: 8, textShadow: "0 0 8px #44ff88" }}>
              🍄 MUSHROOMS
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
              {powers.map(p => (
                <div key={p.label} style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${p.color}44`,
                  borderLeft: `3px solid ${p.color}`,
                  borderRadius: 4, padding: "5px 8px",
                }}>
                  <div style={{ color: p.color, fontSize: 9, fontWeight: "bold", letterSpacing: 1 }}>{p.label}</div>
                  <div style={{ color: "#778899", fontSize: 8, marginTop: 2 }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div style={{ textAlign: "center", marginTop: 28, color: "#334455", fontSize: 9, letterSpacing: 3 }}>
          SURVIVE ALL WAVES ◈ COLLECT MUSHROOMS ◈ DEFEAT THE BOSS
        </div>
      </div>
    </div>
  );
}
