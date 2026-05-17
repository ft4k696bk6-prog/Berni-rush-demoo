import { BadgePlus, Flame, HeartPulse, MousePointer2, Repeat2, ShieldCheck, Sparkles, Swords, Zap } from "lucide-react";
import { PERK_CONFIG } from "./perks";
import { PerkId } from "./types";
import { useGameStore } from "./useGameStore";

const ICONS: Record<PerkId, typeof Sparkles> = {
  front_arrow: MousePointer2,
  multishot: Swords,
  side_arrows: Repeat2,
  ricochet: Repeat2,
  piercing: MousePointer2,
  rapid_fire: Zap,
  fire_arrows: Flame,
  strong_heart: HeartPulse,
  swift_boots: Zap,
  lucky_coin: BadgePlus,
  nimble: ShieldCheck,
};

export default function AbilityDraft() {
  const phase = useGameStore(s => s.phase);
  const choices = useGameStore(s => s.perkChoices);
  const perks = useGameStore(s => s.perks);
  const pending = useGameStore(s => s.pendingLevelUps);
  const choosePerk = useGameStore(s => s.choosePerk);

  if (phase !== "upgrade" || choices.length === 0) return null;

  return (
    <div className="ability-overlay">
      <section className="ability-shell">
        <div className="ability-heading">
          <span>MUSHROOM MUTATION</span>
          <h2>Choose a spore power</h2>
          <p>{pending > 1 ? `${pending} spore choices queued` : "Absorb one mushroom mutation and jump back into the arena."}</p>
        </div>

        <div className="ability-grid">
          {choices.map(id => {
            const perk = PERK_CONFIG[id];
            const Icon = ICONS[id];
            const level = perks[id] ?? 0;
            return (
              <button key={id} type="button" className="ability-card" onClick={() => choosePerk(id)} style={{ borderColor: `${perk.color}88` }}>
                <span className="ability-icon" style={{ color: perk.color, boxShadow: `0 0 28px ${perk.color}33` }}>
                  <Icon size={30} />
                </span>
                <strong>{perk.name}</strong>
                <small>LV {level + 1}/{perk.maxLevel}</small>
                <p>{perk.description}</p>
                <i>{perk.tags.join(" / ")}</i>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
