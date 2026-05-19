import { useEffect, useMemo, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { Clock3, Coins, Eye, EyeOff, Gauge, HeartPulse, Maximize, Minimize, Pause, RotateCw, Skull, Swords, Trophy, Zap } from "lucide-react";
import { useGameStore } from "./useGameStore";
import { DRUG_CONFIG } from "./types";
import { getClassDefinition, getSkinDefinition } from "./loadout";
import { WEAPON_CONFIG } from "./weapons";
import { poisonCurrentPos } from "./poisonPositions";
import { playerRuntime } from "./gameRuntime";
import { useFullscreenStatus } from "./fullscreen";
import { useCompactViewport } from "./useCompactViewport";

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function normalizeAngleRadians(value: number) {
  return Math.atan2(Math.sin(value), Math.cos(value));
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
  const mapObjective = useGameStore(s => s.mapObjective);
  const activeZoneId = useGameStore(s => s.activeZoneId);
  const exitUnlocked = useGameStore(s => s.exitUnlocked);
  const centerMessage = useGameStore(s => s.centerMessage);
  const perks = useGameStore(s => s.perks);
  const impactBursts = useGameStore(s => s.impactBursts);
  const meleeSwings = useGameStore(s => s.meleeSwings);
  const poisons = useGameStore(s => s.poisons);
  const playerPos = useGameStore(s => s.playerPos);
  const boss = useGameStore(s => s.poisons.find(enemy => enemy.type === "boss_dragon" || enemy.type === "boss10" || enemy.type === "boss20"));
  const pauseGame = useGameStore(s => s.pauseGame);
  const compactViewport = useCompactViewport();

  const [now, setNow] = useState(() => Date.now());
  const [hudMode, setHudMode] = useState<"minimal" | "full">(() => (
    typeof window !== "undefined" && (window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 780) ? "minimal" : "full"
  ));
  const [mobilePortrait, setMobilePortrait] = useState(() => (
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches && window.innerHeight > window.innerWidth
  ));
  const { isFullscreen, toggleFullscreen } = useFullscreenStatus();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), phase === "playing" ? 120 : 240);
    return () => window.clearInterval(timer);
  }, [phase]);

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
  const zoneEnemiesLeft = activeZoneId ? poisons.length : monstersLeft;
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
  const recentSlash = useMemo(() => {
    for (let i = meleeSwings.length - 1; i >= 0; i--) {
      const swing = meleeSwings[i];
      const age = now - swing.startedAt;
      if (age > 420) continue;
      return swing;
    }
    return null;
  }, [meleeSwings, now]);
  const reticleFiring = playerRuntime.attackAnimType === "shoot" && playerRuntime.attackAnimUntil > now;
  const reticleStyle = useMemo(() => ({
    "--reticle-gap": reticleFiring ? "13px" : recentHit?.kind === "heavy" ? "15px" : "14px",
    "--reticle-alpha": reticleFiring ? "1" : "0.9",
    "--reticle-color": recentHit?.color ?? "#bfeeff",
  }) as CSSProperties, [recentHit?.color, recentHit?.kind, reticleFiring]);
  const threats = useMemo(() => {
    const lookLen = Math.hypot(playerRuntime.aimX, playerRuntime.aimZ);
    const lookAngle = lookLen > 0.001 ? Math.atan2(playerRuntime.aimX, -playerRuntime.aimZ) : 0;

    return poisons
      .map(enemy => {
        const live = poisonCurrentPos[enemy.id] ?? [enemy.position[0], enemy.position[2]];
        const dx = live[0] - playerPos[0];
        const dz = live[1] - playerPos[1];
        const distance = Math.hypot(dx, dz);
        if (distance > 34) return null;

        const worldAngle = Math.atan2(dx, -dz);
        const angle = normalizeAngleRadians(worldAngle - lookAngle);
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
            <span>MAP {stage}</span>
          </div>
          <div className="stage-progress">
            <strong>{zoneEnemiesLeft}</strong>
            <span>{activeZoneId ? "ZONE LEFT" : "TOTAL LEFT"}</span>
          </div>
          <div className="wave-strip">{exitUnlocked ? "GATE UNLOCKED" : `ZONE ${wave}/${wavesTotal}`} - {mapObjective}</div>
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

      {phase === "playing" && !compactViewport && (
        <button
          className="desktop-fullscreen-button"
          type="button"
          onPointerDown={event => {
            event.preventDefault();
            event.stopPropagation();
            toggleFullscreen();
          }}
          aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
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
          <strong>Rotate to landscape for clearer expedition combat</strong>
          <span>Run auto-pauses in portrait to prevent unfair hits.</span>
        </div>
      )}

      {centerMessage && (
        <div className={messageClass}>
          <strong>{centerMessage.title}</strong>
          {centerMessage.subtitle && <span>{centerMessage.subtitle}</span>}
        </div>
      )}

      {phase === "playing" && (
        <div className={`fpp-reticle ${reticleFiring ? "hit" : ""}`} style={reticleStyle} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <b />
        </div>
      )}

      {phase === "playing" && recentSlash && (
        <div className={`fpp-melee-slash ${recentSlash.is360 ? "power" : ""} combo-${recentSlash.comboStep ?? 1} ${recentSlash.theme ?? "knight"}`} key={recentSlash.id} aria-hidden="true">
          <i />
          <b />
          {!recentSlash.is360 && (recentSlash.comboStep ?? 1) > 1 && <em>COMBO {recentSlash.comboStep}</em>}
        </div>
      )}

      {phase === "playing" && recentSlash && !recentSlash.is360 && (recentSlash.comboStep ?? 1) > 1 && (
        <div className="combo-meter" aria-hidden="true">COMBO {recentSlash.comboStep}</div>
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
