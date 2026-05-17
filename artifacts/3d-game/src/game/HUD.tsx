import { useEffect, useMemo, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { BadgePlus, Clock3, Coins, Eye, EyeOff, Gauge, HeartPulse, Pause, RotateCw, Skull, Swords, Trophy, Zap } from "lucide-react";
import { useGameStore } from "./useGameStore";
import { DRUG_CONFIG, STAT_LABELS, StatKey } from "./types";
import { getClassDefinition, getSkinDefinition } from "./loadout";
import { WEAPON_CONFIG } from "./weapons";
import { poisonCurrentPos } from "./poisonPositions";

const STAT_ORDER: StatKey[] = ["strength", "superpower", "vitality", "luck", "dodge", "speed"];

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function HUD() {
  const phase = useGameStore(s => s.phase);
  const health = useGameStore(s => s.health);
  const maxHealth = useGameStore(s => s.maxHealth);
  const stage = useGameStore(s => s.stage);
  const wave = useGameStore(s => s.wave);
  const wavesTotal = useGameStore(s => s.wavesTotal);
  const killsThisStage = useGameStore(s => s.killsThisStage);
  const killsRequired = useGameStore(s => s.killsRequired);
  const totalKills = useGameStore(s => s.totalKills);
  const playerLevel = useGameStore(s => s.playerLevel);
  const xp = useGameStore(s => s.xp);
  const xpToNext = useGameStore(s => s.xpToNext);
  const coins = useGameStore(s => s.coins);
  const walletCoins = useGameStore(s => s.walletCoins);
  const currentWeapon = useGameStore(s => s.currentWeapon);
  const selectedClassId = useGameStore(s => s.selectedClassId);
  const selectedSkinId = useGameStore(s => s.selectedSkinId);
  const activeEffects = useGameStore(s => s.activeEffects);
  const gameTime = useGameStore(s => s.gameTime);
  const statPoints = useGameStore(s => s.statPoints);
  const stats = useGameStore(s => s.stats);
  const centerMessage = useGameStore(s => s.centerMessage);
  const perks = useGameStore(s => s.perks);
  const impactBursts = useGameStore(s => s.impactBursts);
  const poisons = useGameStore(s => s.poisons);
  const playerPos = useGameStore(s => s.playerPos);
  const boss = useGameStore(s => s.poisons.find(enemy => enemy.type === "boss_dragon" || enemy.type === "boss10" || enemy.type === "boss20"));
  const upgradeStat = useGameStore(s => s.upgradeStat);
  const pauseGame = useGameStore(s => s.pauseGame);

  const [now, setNow] = useState(() => Date.now());
  const [hudMode, setHudMode] = useState<"minimal" | "full">(() => (
    typeof window !== "undefined" && (window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 780) ? "minimal" : "full"
  ));
  const [mobilePortrait, setMobilePortrait] = useState(() => (
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches && window.innerHeight > window.innerWidth
  ));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleHudToggle = (event: KeyboardEvent) => {
      if (event.key !== "Tab" && event.code !== "ControlLeft") return;
      if (useGameStore.getState().phase !== "playing") return;
      event.preventDefault();
      setHudMode(mode => mode === "full" ? "minimal" : "full");
    };
    window.addEventListener("keydown", handleHudToggle);
    return () => window.removeEventListener("keydown", handleHudToggle);
  }, []);

  useEffect(() => {
    const syncMobilePortrait = () => {
      setMobilePortrait(window.matchMedia("(pointer: coarse)").matches && window.innerHeight > window.innerWidth);
    };
    syncMobilePortrait();
    window.addEventListener("resize", syncMobilePortrait);
    window.addEventListener("orientationchange", syncMobilePortrait);
    return () => {
      window.removeEventListener("resize", syncMobilePortrait);
      window.removeEventListener("orientationchange", syncMobilePortrait);
    };
  }, []);

  const hpPct = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const xpPct = Math.max(0, Math.min(100, (xp / xpToNext) * 100));
  const weapon = WEAPON_CONFIG[currentWeapon];
  const klass = getClassDefinition(selectedClassId);
  const skin = getSkinDefinition(selectedSkinId);
  const monstersLeft = Math.max(0, killsRequired - killsThisStage);
  const runVisible = phase === "playing" || phase === "paused" || phase === "upgrade";
  const perkCount = Object.values(perks).reduce((total, value) => total + (value ?? 0), 0);
  const bossHpPct = boss ? Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100)) : 0;

  const messageClass = useMemo(() => centerMessage ? `center-message ${centerMessage.tone}` : "center-message", [centerMessage]);
  const handlePausePress = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    pauseGame();
  };
  const handleHudTogglePress = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setHudMode(mode => mode === "full" ? "minimal" : "full");
  };
  const recentHit = useMemo(() => {
    for (let i = impactBursts.length - 1; i >= 0; i--) {
      const burst = impactBursts[i];
      const age = now - burst.createdAt;
      if (age > 260) continue;
      if (burst.kind === "coin" || burst.kind === "death") continue;
      return {
        key: burst.id,
        kind: burst.kind,
        color: burst.color,
        theme: burst.theme,
        age,
      };
    }
    return null;
  }, [impactBursts, now]);
  const threats = useMemo(() => {
    return poisons
      .map(enemy => {
        const live = poisonCurrentPos[enemy.id] ?? [enemy.position[0], enemy.position[2]];
        const dx = live[0] - playerPos[0];
        const dz = live[1] - playerPos[1];
        const distance = Math.hypot(dx, dz);
        if (distance > 34) return null;

        const angle = Math.atan2(dx, -dz);
        const bossThreat = enemy.type === "boss_dragon" || enemy.type === "boss10" || enemy.type === "boss20";
        const rangedThreat = enemy.type === "ranged_enemy" || enemy.type === "shooter";
        const danger = bossThreat || distance < 9;
        const urgency = Math.max(0.24, 1 - distance / 34);

        return {
          id: enemy.id,
          angle,
          distance,
          bossThreat,
          rangedThreat,
          danger,
          opacity: Math.min(0.92, 0.34 + urgency * 0.72),
          scale: bossThreat ? 1.32 : danger ? 1.12 : rangedThreat ? 1.04 : 0.92,
        };
      })
      .filter((threat): threat is NonNullable<typeof threat> => Boolean(threat))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [now, playerPos, poisons]);

  if (!runVisible) return null;

  return (
    <div className={`hud-shell ${hudMode}`}>
      <div className="hud-top">
        <section className="hud-panel hud-health-panel">
          <div className="hud-panel-title"><HeartPulse size={18} /> ZYCIE</div>
          <div className="bar health-bar">
            <div className="bar-fill" style={{ width: `${hpPct}%` }} />
            <span>{Math.ceil(health)} / {maxHealth}</span>
          </div>
          <div className="hud-mini-row">
            <span><Gauge size={14} /> LVL {playerLevel}</span>
            <span>{xp} / {xpToNext} XP</span>
          </div>
          <div className="bar xp-bar">
            <div className="bar-fill" style={{ width: `${xpPct}%` }} />
          </div>
          <div className="loadout-strip" style={{ borderColor: `${klass.color}55` }}>
            <span style={{ color: klass.color }}>{klass.displayName}</span>
            <b>{skin.displayName}</b>
          </div>
        </section>

        <section className="hud-center-panel">
          <div className="stage-badge">
            <Trophy size={18} />
            <span>LEVEL {stage}</span>
          </div>
          <div className="stage-progress">
            <strong>{monstersLeft}</strong>
            <span>LEFT</span>
          </div>
          <div className="wave-strip">WAVE {wave}/{wavesTotal} - {killsThisStage}/{killsRequired}</div>
          <div className="archero-hint">MOVE: WASD / LEFT STICK - LOOK: MOUSE / RIGHT STICK</div>
        </section>

        <section className="hud-panel hud-score-panel">
          <div className="hud-stat"><Coins size={18} /><span>{coins}</span></div>
          <div className="hud-stat bank-stat"><Coins size={18} /><span>{walletCoins}</span></div>
          <div className="hud-stat"><Skull size={18} /><span>{totalKills}</span></div>
          <div className="hud-stat"><Clock3 size={18} /><span>{formatTime(gameTime)}</span></div>
          <div className="hud-stat"><Zap size={18} /><span>{perkCount} perks</span></div>
          <div className="weapon-pill"><Swords size={16} /><span>{weapon.shortName}</span></div>
        </section>
      </div>

      {boss && (
        <div className="boss-health">
          <span>{boss.type === "boss_dragon" ? "HARVEST DRAGON" : "BOSS"}</span>
          <div className="bar">
            <div className="bar-fill" style={{ width: `${bossHpPct}%` }} />
          </div>
        </div>
      )}

      {phase === "playing" && (
        <button className="mobile-pause-button" type="button" onPointerDown={handlePausePress} aria-label="Pause">
          <Pause size={20} />
        </button>
      )}

      {phase === "playing" && (
        <button
          className="mobile-hud-toggle"
          type="button"
          onPointerDown={handleHudTogglePress}
          aria-label={hudMode === "full" ? "Minimal HUD" : "Full HUD"}
        >
          {hudMode === "full" ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}

      {activeEffects.length > 0 && (
        <div className="effect-tray">
          {activeEffects.map(effect => {
            const cfg = DRUG_CONFIG[effect.type];
            const remaining = Math.max(0, (effect.expiresAt - now) / 1000);
            const pct = cfg.duration > 0 ? Math.max(0, Math.min(100, (remaining / cfg.duration) * 100)) : 100;
            return (
              <div className="effect-chip" key={effect.type} style={{ borderColor: cfg.color }}>
                <span style={{ color: cfg.color }}>{cfg.label}</span>
                <b>{remaining.toFixed(1)}s</b>
                <i style={{ width: `${pct}%`, background: cfg.color }} />
              </div>
            );
          })}
        </div>
      )}

      {phase === "playing" && (
        <div className="hud-mode-hint">
          {hudMode === "full" ? "TAB: minimal HUD" : "TAB: full HUD"}
        </div>
      )}

      {mobilePortrait && (
        <div className="mobile-orientation-hint" aria-live="polite">
          <RotateCw size={14} />
          <strong>Rotate to landscape for clearer arena combat</strong>
          <span>Run auto-pauses in portrait to prevent unfair hits.</span>
        </div>
      )}

      {statPoints > 0 && (
        <aside className="upgrade-panel">
          <div className="upgrade-title"><BadgePlus size={18} /> {statPoints} STAT POINT{statPoints > 1 ? "S" : ""}</div>
          <div className="upgrade-grid">
            {STAT_ORDER.map(stat => (
              <button key={stat} type="button" onClick={() => upgradeStat(stat)}>
                <span>{STAT_LABELS[stat].label}</span>
                <b>{stats[stat]}</b>
              </button>
            ))}
          </div>
        </aside>
      )}

      {centerMessage && (
        <div className={messageClass}>
          <strong>{centerMessage.title}</strong>
          {centerMessage.subtitle && <span>{centerMessage.subtitle}</span>}
        </div>
      )}

      {phase === "playing" && (
        <div className="threat-ring" aria-hidden="true">
          {threats.map(threat => (
            <i
              key={threat.id}
              className={`threat-marker ${threat.bossThreat ? "boss" : ""} ${threat.rangedThreat ? "ranged" : ""} ${threat.danger ? "danger" : ""}`}
              style={{
                "--angle": `${threat.angle}rad`,
                "--threat-alpha": threat.opacity,
                "--threat-scale": threat.scale,
              } as CSSProperties}
            />
          ))}
        </div>
      )}

      {phase === "playing" && (
        <div
          key={recentHit?.key ?? "idle"}
          className={`hit-marker ${recentHit ? "active" : ""} ${recentHit?.kind ?? ""} ${recentHit?.theme ?? ""}`}
          style={{ "--hit-color": recentHit?.color ?? "#ffffff" } as CSSProperties}
          aria-hidden="true"
        >
          <i />
          <i />
          <i />
          <i />
        </div>
      )}

    </div>
  );
}
