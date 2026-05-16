import { useEffect, useMemo, useState } from "react";
import { BadgePlus, Clock3, Coins, Crosshair, Gauge, HeartPulse, Pause, Skull, Swords, Trophy, Zap } from "lucide-react";
import { useGameStore } from "./useGameStore";
import { DRUG_CONFIG, STAT_LABELS, StatKey } from "./types";
import { getClassDefinition, getSkinDefinition } from "./loadout";
import { WEAPON_CONFIG } from "./weapons";

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
  const skillStatus = useGameStore(s => s.skillStatus);
  const boss = useGameStore(s => s.poisons.find(enemy => enemy.type === "boss_dragon" || enemy.type === "boss10" || enemy.type === "boss20"));
  const upgradeStat = useGameStore(s => s.upgradeStat);
  const pauseGame = useGameStore(s => s.pauseGame);

  const [now, setNow] = useState(() => Date.now());
  const [hudMode, setHudMode] = useState<"minimal" | "full">(() => (
    typeof window !== "undefined" && (window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 780) ? "minimal" : "full"
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
          <div className="archero-hint">MOUSE TURNS CAMERA - CLICK / RIGHT PAD TO SHOOT</div>
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
        <button className="mobile-pause-button" type="button" onClick={pauseGame} aria-label="Pause">
          <Pause size={20} />
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

      <div className="skill-dock" aria-hidden="true">
        {Object.values(skillStatus).map(skill => {
          const ready = now >= skill.readyAt;
          const remaining = Math.max(0, skill.readyAt - now);
          const progress = ready ? 100 : Math.max(0, 100 - (remaining / Math.max(1, skill.cooldownMs)) * 100);
          const Icon = skill.id === "dash" ? Zap : skill.id === "power_slash" ? Swords : Crosshair;
          return (
            <div key={skill.id} className={`skill-chip skill-${skill.id} ${ready ? "ready" : ""} ${skill.active ? "active" : ""}`}>
              <Icon size={16} />
              <span>{skill.label}</span>
              <b>{ready ? "READY" : `${Math.ceil(remaining / 1000)}s`}</b>
              <i style={{ width: `${progress}%` }} />
            </div>
          );
        })}
      </div>

      {phase === "playing" && (
        <div className="hud-mode-hint">
          {hudMode === "full" ? "TAB: minimal HUD" : "TAB: full HUD"}
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
        <div className="cursor-reticle">
          <Crosshair size={26} />
          <Zap size={12} />
        </div>
      )}
    </div>
  );
}
